import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import {
  Plus,
  Search,
  User,
  Phone,
  Mail,
  AlertCircle,
  MapPin,
  ChevronRight
} from "lucide-react-native";

import Header from "../../components/Header";
import BottomNavigation from "../../components/navigation/BottomNavigation";
import { Customer, getAllCustomers } from "../../services/customerService";

export default function CustomersScreen() {
  const insets = useSafeAreaInsets();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("Fetching all customers");
      const data = await getAllCustomers();
      console.log(`Loaded ${data.length} customers`);
      setCustomers(data);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError("Failed to load customers. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("Customers list screen in focus - refreshing data");
      fetchCustomers();
      return () => {
        // Clean up if needed
      };
    }, [fetchCustomers])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCustomers();
    setRefreshing(false);
  }, [fetchCustomers]);

  // Filter customers based on search query
  const filteredCustomers = searchQuery
    ? customers.filter(
        (customer) =>
          customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.phone?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : customers;

  const renderCustomerItem = ({ item }: { item: Customer }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/customers/view?id=${item.id}`)}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center mb-2">
          <View className="h-10 w-10 rounded-full bg-blue-100 items-center justify-center mr-3">
            <User size={18} color="#3b82f6" />
          </View>
          <View className="flex-1">
            <Text 
              className="text-base font-semibold text-gray-900"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.name}
            </Text>
          </View>
          <ChevronRight size={18} color="#9ca3af" />
        </View>
        
        <View className="ml-13 pl-1 border-l-2 border-gray-100">
          {item.email && (
            <View className="flex-row items-center ml-3 mb-1.5">
              <Mail size={14} color="#6B7280" />
              <Text 
                className="text-gray-700 text-sm ml-2"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.email}
              </Text>
            </View>
          )}
          
          {item.phone && (
            <View className="flex-row items-center ml-3 mb-1.5">
              <Phone size={14} color="#6B7280" />
              <Text 
                className="text-gray-700 text-sm ml-2"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.phone}
              </Text>
            </View>
          )}
          
          {item.address && (
            <View className="flex-row items-center ml-3">
              <MapPin size={14} color="#6B7280" />
              <Text 
                className="text-gray-700 text-sm ml-2"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.address}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (isLoading && !refreshing) {
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-2 text-gray-600">Loading customers...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View className="flex-1 justify-center items-center p-6">
          <AlertCircle size={40} color="#EF4444" />
          <Text className="mt-4 text-gray-800 font-medium text-center">{error}</Text>
          <TouchableOpacity 
            className="mt-4 bg-blue-500 px-4 py-2 rounded-lg"
            onPress={fetchCustomers}
          >
            <Text className="text-white font-medium">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (filteredCustomers.length === 0) {
      return (
        <View className="flex-1 justify-center items-center p-6">
          <User size={40} color="#9CA3AF" />
          <Text className="mt-4 text-gray-800 font-medium text-center">
            {searchQuery ? "No matching customers found" : "No customers found"}
          </Text>
          <Text className="mt-2 text-gray-600 text-center">
            {searchQuery ? "Try a different search term" : "Add your first customer to get started"}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              className="mt-4 px-4 py-2 bg-blue-500 rounded-lg flex-row items-center"
              onPress={() => router.push("/customers/add")}
            >
              <Plus size={18} color="#FFFFFF" />
              <Text className="text-white font-medium ml-1">Add Customer</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <FlatList
        data={filteredCustomers}
        renderItem={renderCustomerItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingBottom: insets.bottom + 80,
          flexGrow: filteredCustomers.length === 0 ? 1 : undefined
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Header title="Customers" />
      <View className="flex-1 px-4 pt-4">
        <View className="flex-row mb-4">
          <View className="flex-row flex-1">
            <View className="flex-1 bg-white rounded-lg shadow-sm flex-row items-center px-3">
              <Search size={18} color="#4B5563" />
              <TextInput
                className="flex-1 py-2.5 px-2"
                placeholder="Search customers..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>
          
          <TouchableOpacity
            className="ml-2 bg-blue-500 rounded-lg items-center justify-center px-4"
            onPress={() => router.push("/customers/add")}
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {renderContent()}
      </View>

      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
        <BottomNavigation activeTab="customers" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6"
  }
});
