import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ToastAndroid,
  Platform,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Clock,
  Edit,
  Trash2,
  Package,
  Search,
  Filter,
  X,
} from "lucide-react-native";
import { supabase } from "../../lib/supabase";

import Header from "../../components/Header";
import { 
  Customer, 
  getCustomerById, 
  deleteCustomer,
  getCustomerRentalHistory,
  createCustomer,
  customerHasRelatedRecords
} from "../../services/customerService";

// Simple EmptyState component since we can't find the imported one
function EmptyState({ icon, title, description, actionText, onAction }: any) {
  return (
    <View className="py-8 items-center">
      {icon}
      <Text className="mt-2 font-medium text-gray-800">{title}</Text>
      <Text className="text-gray-500 text-center mt-1">{description}</Text>
      {actionText && onAction && (
        <TouchableOpacity
          className="mt-4 bg-blue-500 px-4 py-2 rounded-lg"
          onPress={onAction}
        >
          <Text className="text-white font-medium">{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function CustomerViewScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [rentalHistory, setRentalHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRentalLoading, setIsRentalLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deletedCustomer, setDeletedCustomer] = useState<Customer | null>(null);
  // State for custom delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [filteredRentals, setFilteredRentals] = useState<any[]>([]);

  const fetchCustomerData = useCallback(async () => {
    if (!id) {
      setError("No customer ID provided");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log("Fetching customer data for ID:", id);
      const data = await getCustomerById(id as string);
      console.log("Customer data received:", data);
      setCustomer(data);
    } catch (err) {
      console.error("Error fetching customer:", err);
      setError("Failed to load customer details");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const fetchRentalHistory = useCallback(async () => {
    if (!id) return;

    try {
      setIsRentalLoading(true);
      const history = await getCustomerRentalHistory(id as string);
      setRentalHistory(history);
    } catch (err) {
      console.error("Error fetching rental history:", err);
    } finally {
      setIsRentalLoading(false);
    }
  }, [id]);

  // Initial data fetch on mount
  useEffect(() => {
    fetchCustomerData();
    fetchRentalHistory();
  }, [fetchCustomerData, fetchRentalHistory]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("Customer view screen in focus - refreshing data");
      fetchCustomerData();
      fetchRentalHistory();
      return () => {
        // Clean up if needed
      };
    }, [fetchCustomerData, fetchRentalHistory])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchCustomerData(), fetchRentalHistory()]);
    setRefreshing(false);
  }, [fetchCustomerData, fetchRentalHistory]);

  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      // For iOS we're using Alert since there's no built-in Toast
      // In a real app, you might want to use a custom toast component
      Alert.alert('', message, [{ text: 'OK' }], { cancelable: true });
    }
  };

  const handleDelete = () => {
    if (!id) return;
    
    Alert.alert(
      "Delete Customer",
      "Are you sure you want to delete this customer?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Check for related records first
              const checkResult = await customerHasRelatedRecords(id.toString());
              if (checkResult.hasRecords) {
                Alert.alert(
                  "Cannot Delete", 
                  checkResult.message,
                  [{ text: "OK" }]
                );
                return;
              }
              
              // Set loading state
              setIsLoading(true);
              
              // Simple delete call
              console.log("Deleting customer with ID:", id);
              await deleteCustomer(id.toString());
              
              // Navigate back
              router.back();
              
              // Show confirmation
              setTimeout(() => {
                Alert.alert("Success", "Customer deleted successfully");
              }, 300);
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : "Unknown error";
              console.error("Delete failed:", errorMessage);
              Alert.alert("Error", `Could not delete this customer: ${errorMessage}`);
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleUndoDelete = async () => {
    if (!deletedCustomer) {
      console.error("Cannot restore: No deleted customer data available");
      showToast("Cannot restore customer: No data available");
      return;
    }

    try {
      showToast("Restoring customer...");
      console.log("Starting restoration process for customer:", deletedCustomer.name);
      
      // Create a new customer with the same data
      const restoredCustomer = {
        name: deletedCustomer.name,
        email: deletedCustomer.email,
        phone: deletedCustomer.phone,
        address: deletedCustomer.address || "",
        notes: deletedCustomer.notes || "",
      };
      
      console.log("Attempting to restore customer with data:", restoredCustomer);
      
      // Restore the customer
      const result = await createCustomer(restoredCustomer);
      console.log("Customer restored successfully with ID:", result?.id);
      
      // Navigate to the newly created customer
      if (result?.id) {
        router.push(`/customers/view?id=${result.id}` as any);
        setTimeout(() => {
          showToast("Customer restored successfully");
        }, 500);
      } else {
        // Fall back to customers list if we don't have an ID
        router.push('/customers' as any);
        showToast("Customer restored successfully");
      }
      
      // Clear the deleted customer data
      setDeletedCustomer(null);
    } catch (error: any) {
      console.error("Error restoring customer:", error?.message || error);
      Alert.alert(
        "Restoration Failed", 
        `Could not restore this customer: ${error?.message || "Unknown error"}`,
        [{ text: "OK" }]
      );
    }
  };

  // Helper function to safely format dates
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  // Custom delete function
  const confirmDelete = () => {
    if (!id) return;
    
    // Show the modal
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  // Function to actually delete the customer
  const performDelete = () => {
    if (!id) return;
    
    console.log("Confirmed deletion for ID:", id);
    setDeleteInProgress(true);
    
    // Direct fetch call to Supabase API
    fetch(`https://wncwlshtddeelkutqyrq.supabase.co/rest/v1/customers?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduY3dsc2h0ZGRlZWxrdXRxeXJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NDQ3NTgsImV4cCI6MjA1ODIyMDc1OH0.BbT5O4rK8ShDwcpfLtqcm71ieCHwiBF6In1OTyvu8ns',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduY3dsc2h0ZGRlZWxrdXRxeXJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NDQ3NTgsImV4cCI6MjA1ODIyMDc1OH0.BbT5O4rK8ShDwcpfLtqcm71ieCHwiBF6In1OTyvu8ns'
      }
    })
    .then(response => {
      console.log("Deletion response status:", response.status);
      
      if (response.ok) {
        console.log("Deletion successful");
        setShowDeleteModal(false);
        // Navigate to customers list
        router.push('/customers' as any);
      } else {
        console.error("Deletion failed with status:", response.status);
        setDeleteError("Failed to delete customer. Please try again.");
        setDeleteInProgress(false);
      }
    })
    .catch(error => {
      console.error("Error during deletion:", error);
      setDeleteError("An unexpected error occurred during deletion.");
      setDeleteInProgress(false);
    });
  };

  // Apply search and filters
  useEffect(() => {
    if (!rentalHistory.length) {
      setFilteredRentals([]);
      return;
    }

    // Log for debugging
    console.log("Filtering rentals with:", {
      searchQuery: searchQuery,
      activeFilter: activeFilter,
      rentalHistoryCount: rentalHistory.length
    });

    let results = [...rentalHistory];

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      console.log("Applying search with query:", query);
      
      results = results.filter(rental => {
        // Safely access properties that might be undefined
        const productName = (rental.product?.name || "").toLowerCase();
        const status = (rental.status || "").toLowerCase();
        const amount = rental.totalAmount?.toString() || "";
        
        const matchesName = productName.includes(query);
        const matchesStatus = status.includes(query);
        const matchesAmount = amount.includes(query);
        
        // Log for debugging
        if (matchesName || matchesStatus || matchesAmount) {
          console.log("Rental matches search:", rental.id, {matchesName, matchesStatus, matchesAmount});
        }
        
        return matchesName || matchesStatus || matchesAmount;
      });
      
      console.log("After search filter, results count:", results.length);
    }

    // Apply status filter
    if (activeFilter) {
      console.log("Applying filter:", activeFilter);
      
      results = results.filter(rental => {
        // Handle both rental status and payment status
        const rentalStatus = (rental.status || "").toString();
        const paymentStatus = (rental.paymentStatus || "").toString();
        
        // Check if filter matches either status or payment status
        const statusMatch = rentalStatus === activeFilter;
        const paymentMatch = paymentStatus === activeFilter;
        
        const matches = statusMatch || paymentMatch;
        
        if (matches) {
          console.log(`Rental ${rental.id} matches filter ${activeFilter}`);
        }
        
        return matches;
      });
      
      console.log("After filter, results count:", results.length);
    }

    console.log("Final filtered results:", results.length);
    setFilteredRentals(results);
  }, [searchQuery, activeFilter, rentalHistory]);

  // Filter button press handler
  const handleFilterPress = (filter: string) => {
    console.log("Filter button pressed:", filter);
    // Toggle the filter
    setActiveFilter(activeFilter === filter ? null : filter);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setActiveFilter(null);
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery.trim() !== "" || activeFilter !== null;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <Header
          title="Customer Details"
          leftIcon={<ArrowLeft size={24} color="#000" />}
          onLeftPress={() => router.back()}
        />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-2 text-gray-600">Loading customer data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !customer) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <Header
          title="Customer Details"
          leftIcon={<ArrowLeft size={24} color="#000" />}
          onLeftPress={() => router.back()}
        />
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-red-500 font-medium text-lg">
            {error || "Customer not found"}
          </Text>
          <TouchableOpacity
            className="mt-4 bg-blue-500 px-6 py-2 rounded-lg"
            onPress={() => router.back()}
          >
            <Text className="text-white font-medium">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Header
        title="Customer Details"
        leftIcon={<ArrowLeft size={24} color="#000" />}
        onLeftPress={() => router.back()}
      />
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <View className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
          <View className="bg-white w-full rounded-xl p-6 shadow-lg">
            <Text className="text-lg font-bold text-gray-800 mb-4">Delete Customer</Text>
            <Text className="text-gray-600 mb-6">
              Are you sure you want to delete {customer?.name}? This action cannot be undone.
            </Text>
            
            {deleteError && (
              <View className="mb-4 p-3 bg-red-100 rounded-lg">
                <Text className="text-red-600">{deleteError}</Text>
              </View>
            )}
            
            <View className="flex-row justify-end">
              <TouchableOpacity
                className="py-2 px-4 mr-3 rounded-lg bg-gray-200"
                onPress={() => setShowDeleteModal(false)}
                disabled={deleteInProgress}
              >
                <Text className="font-medium text-gray-800">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`py-2 px-4 rounded-lg flex-row items-center ${deleteInProgress ? 'bg-red-300' : 'bg-red-500'}`}
                onPress={performDelete}
                disabled={deleteInProgress}
              >
                {deleteInProgress ? (
                  <ActivityIndicator size="small" color="#FFFFFF" className="mr-2" />
                ) : (
                  <Trash2 size={18} color="#FFFFFF" className="mr-2" />
                )}
                <Text className="font-medium text-white">
                  {deleteInProgress ? "Deleting..." : "Delete"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Customer Info Card */}
        <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm overflow-hidden">
          <View className="p-4 border-b border-gray-100">
            <Text className="text-2xl font-bold">{customer.name}</Text>
            
            <View className="mt-4 space-y-3">
              {customer.email && (
                <View className="flex-row items-center">
                  <Mail size={20} color="#71717A" />
                  <Text className="ml-3 text-gray-600">{customer.email}</Text>
                </View>
              )}
              
              {customer.phone && (
                <View className="flex-row items-center">
                  <Phone size={20} color="#71717A" />
                  <Text className="ml-3 text-gray-600">{customer.phone}</Text>
                </View>
              )}
              
              {customer.address && (
                <View className="flex-row items-start">
                  <MapPin size={20} color="#71717A" className="mt-1" />
                  <Text className="ml-3 text-gray-600 flex-1">{customer.address}</Text>
                </View>
              )}

              <View className="flex-row items-center">
                <Clock size={20} color="#71717A" />
                <Text className="ml-3 text-gray-600">
                  Customer since{" "}
                  {customer.created_at ? formatDate(customer.created_at) : "N/A"}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row p-4">
            <TouchableOpacity
              className="flex-1 mr-2 bg-blue-500 py-3 rounded-lg items-center justify-center"
              onPress={() => router.push(`/customers/edit?id=${id}` as any)}
            >
              <Text className="text-white font-medium">Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 ml-2 bg-red-500 py-3 rounded-lg items-center justify-center"
              onPress={confirmDelete}
            >
              <Text className="text-white font-medium">Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Card */}
        <View className="flex-row mx-4 mt-4">
          <View className="flex-1 bg-blue-500 p-4 rounded-xl mr-2">
            <Text className="text-white font-medium">Active Rentals</Text>
            <Text className="text-white text-2xl font-bold mt-1">
              {customer.activeRentals || 0}
            </Text>
          </View>
          <View className="flex-1 bg-green-500 p-4 rounded-xl ml-2">
            <Text className="text-white font-medium">Total Spent</Text>
            <Text className="text-white text-2xl font-bold mt-1">
              ${customer.totalSpent?.toFixed(2) || "0.00"}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {customer.notes && (
          <View className="bg-white mx-4 mt-4 p-4 rounded-xl shadow-sm">
            <Text className="font-bold text-lg mb-2">Notes</Text>
            <Text className="text-gray-600">{customer.notes}</Text>
          </View>
        )}

        {/* Rental History */}
        <View className="bg-white mx-4 mt-4 mb-6 rounded-xl shadow-sm">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
            <Text className="font-bold text-lg">Rental History</Text>
            <TouchableOpacity
              onPress={() => router.push(`/rentals/add?customerId=${id}` as any)}
              className="bg-blue-500 px-3 py-1 rounded-lg"
            >
              <Text className="text-white">New Rental</Text>
            </TouchableOpacity>
          </View>
          
          {/* Search and Filter Section */}
          <View className="p-4 border-b border-gray-100">
            {/* Search Input */}
            <View className="flex-row items-center bg-gray-100 rounded-lg px-3 mb-3">
              <Search size={18} color="#9CA3AF" />
              <TextInput
                className="flex-1 py-2 px-2 text-gray-800"
                placeholder="Search rentals..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={18} color="#9CA3AF" />
                </TouchableOpacity>
              ) : null}
            </View>
            
            {/* Filter Buttons */}
            <View className="flex-row">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  className={`py-1 px-3 mr-2 rounded-lg ${activeFilter === 'Active' ? 'bg-green-500' : 'bg-gray-200'}`}
                  onPress={() => handleFilterPress('Active')}
                >
                  <Text className={`${activeFilter === 'Active' ? 'text-white' : 'text-gray-800'}`}>Active</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`py-1 px-3 mr-2 rounded-lg ${activeFilter === 'Completed' ? 'bg-blue-500' : 'bg-gray-200'}`}
                  onPress={() => handleFilterPress('Completed')}
                >
                  <Text className={`${activeFilter === 'Completed' ? 'text-white' : 'text-gray-800'}`}>Completed</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`py-1 px-3 mr-2 rounded-lg ${activeFilter === 'Returned' ? 'bg-green-500' : 'bg-gray-200'}`}
                  onPress={() => handleFilterPress('Returned')}
                >
                  <Text className={`${activeFilter === 'Returned' ? 'text-white' : 'text-gray-800'}`}>Returned</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`py-1 px-3 mr-2 rounded-lg ${activeFilter === 'Overdue' ? 'bg-red-500' : 'bg-gray-200'}`}
                  onPress={() => handleFilterPress('Overdue')}
                >
                  <Text className={`${activeFilter === 'Overdue' ? 'text-white' : 'text-gray-800'}`}>Overdue</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`py-1 px-3 mr-2 rounded-lg ${activeFilter === 'Cancelled' ? 'bg-gray-500' : 'bg-gray-200'}`}
                  onPress={() => handleFilterPress('Cancelled')}
                >
                  <Text className={`${activeFilter === 'Cancelled' ? 'text-white' : 'text-gray-800'}`}>Cancelled</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`py-1 px-3 mr-2 rounded-lg ${activeFilter === 'Paid' ? 'bg-green-500' : 'bg-gray-200'}`}
                  onPress={() => handleFilterPress('Paid')}
                >
                  <Text className={`${activeFilter === 'Paid' ? 'text-white' : 'text-gray-800'}`}>Paid</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`py-1 px-3 mr-2 rounded-lg ${activeFilter === 'Unpaid' ? 'bg-amber-500' : 'bg-gray-200'}`}
                  onPress={() => handleFilterPress('Unpaid')}
                >
                  <Text className={`${activeFilter === 'Unpaid' ? 'text-white' : 'text-gray-800'}`}>Unpaid</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
            
            {/* Updated debugging info for development */}
            <View className="px-4 pt-1">
              <Text className="text-xs text-gray-500">
                {hasActiveFilters ? 
                  `Filters active: ${activeFilter || ''} ${searchQuery ? `"${searchQuery}"` : ''} (${filteredRentals.length}/${rentalHistory.length})` : 
                  `Showing all ${rentalHistory.length} rentals`}
              </Text>
            </View>
          </View>

          {isRentalLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator color="#3B82F6" />
              <Text className="text-gray-500 mt-2">Loading rental history...</Text>
            </View>
          ) : rentalHistory.length === 0 ? (
            <EmptyState
              icon={<Package size={40} color="#A1A1AA" />}
              title="No rental history"
              description="This customer hasn't rented any items yet."
              actionText="Create Rental"
              onAction={() => router.push(`/rentals/add?customerId=${id}` as any)}
            />
          ) : filteredRentals.length === 0 && hasActiveFilters ? (
            <View className="py-8 items-center">
              <Filter size={40} color="#A1A1AA" />
              <Text className="mt-2 font-medium text-gray-800">No matching rentals</Text>
              <Text className="text-gray-500 text-center mt-1">No rentals match your search or filters.</Text>
              <TouchableOpacity
                className="mt-4"
                onPress={clearFilters}
              >
                <Text className="text-blue-500 font-medium">Clear Filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {(hasActiveFilters ? filteredRentals : rentalHistory).map((rental, index) => (
                <TouchableOpacity
                  key={rental.id || index} // Fallback to index if id is missing
                  className={`p-3 ${
                    index < (hasActiveFilters ? filteredRentals.length : rentalHistory.length) - 1
                      ? "border-b border-gray-100"
                      : ""
                  }`}
                  onPress={() => rental.id ? router.push(`/orders/view?id=${rental.id}` as any) : null}
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="font-medium">
                        {rental.product?.name || "Unknown Product"}
                      </Text>
                      {rental.type === 'rental' && (
                        <View>
                          <Text className="text-gray-500 text-sm mt-1">
                            {formatDate(rental.startDate)} to {formatDate(rental.endDate)}
                          </Text>
                          {rental.returnDate && (
                            <Text className="text-green-600 text-xs">
                              Returned: {formatDate(rental.returnDate)}
                            </Text>
                          )}
                          {rental.rentalDuration > 0 && (
                            <Text className="text-gray-500 text-xs mt-1">
                              Duration: {rental.rentalDuration} {rental.rentalDuration === 1 ? 'day' : 'days'}
                            </Text>
                          )}
                        </View>
                      )}
                      {rental.type === 'sale' && (
                      <Text className="text-gray-500 text-sm mt-1">
                          Purchased on {formatDate(rental.created_at)}
                      </Text>
                      )}
                    </View>
                    <View>
                      <Text className="font-bold text-right">
                        ₹{rental.totalAmount?.toFixed(2) || "0.00"}
                      </Text>
                      <View className="flex-row mt-1 justify-end">
                        <View className={`px-1.5 py-0.5 rounded mr-1 ${
                          rental.status === "Active" ? "bg-blue-100" : 
                          rental.status === "Completed" ? "bg-green-100" : 
                          rental.status === "Returned" ? "bg-green-100" :
                          rental.status === "Overdue" ? "bg-red-100" : 
                          rental.status === "Cancelled" ? "bg-gray-100" : 
                          "bg-gray-100"
                        }`}>
                          <Text className={`text-xs font-medium ${
                            rental.status === "Active" ? "text-blue-600" : 
                            rental.status === "Completed" ? "text-green-600" : 
                            rental.status === "Returned" ? "text-green-600" :
                            rental.status === "Overdue" ? "text-red-600" : 
                            rental.status === "Cancelled" ? "text-gray-600" : 
                            "text-gray-600"
                          }`}>
                            {rental.status || "Unknown"}
                          </Text>
                        </View>
                        <View className={`px-1.5 py-0.5 rounded ${
                          rental.paymentStatus === "Paid" ? "bg-green-100" : 
                          rental.paymentStatus === "Unpaid" ? "bg-amber-100" : 
                          "bg-gray-100"
                        }`}>
                          <Text className={`text-xs font-medium ${
                            rental.paymentStatus === "Paid" ? "text-green-600" : 
                            rental.paymentStatus === "Unpaid" ? "text-amber-600" : 
                            "text-gray-600"
                          }`}>
                            {rental.paymentStatus || "Unpaid"}
                      </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  {rental.itemDetails?.length > 0 && (
                    <View className="mt-2 bg-gray-50 p-2 rounded">
                      <Text className="text-xs font-medium text-gray-700 mb-1">Order Items:</Text>
                      {rental.itemDetails.map((item: { quantity: number; name: string; price: number }, i: number) => (
                        <Text key={i} className="text-xs text-gray-600">
                          {item.quantity}x {item.name} - ₹{item.price * item.quantity}
                        </Text>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
