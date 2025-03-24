import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Plus,
  Search,
  Filter,
  User,
  Phone,
  Calendar,
  Mail,
  Trash2,
  Edit,
  AlertCircle,
} from "lucide-react-native";
import { router, useFocusEffect } from "expo-router";

import Header from "../../components/Header";
import BottomNavigation from "../../components/navigation/BottomNavigation";
import DeleteConfirmation from "../../components/DeleteConfirmation";
import SuccessNotification from "../../components/SuccessNotification";
import { EmployeeFormData, deleteEmployee, getEmployees } from "../../services/employeeService";

export default function EmployeesScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState<EmployeeFormData[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Delete confirmation state
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeFormData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Success notification state
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const fetchEmployees = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getEmployees();
      setEmployees(data);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
      setError("Failed to load employees. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load employees when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchEmployees();
    }, [fetchEmployees])
  );

  const handleDeleteEmployee = (employee: EmployeeFormData) => {
    setEmployeeToDelete(employee);
    setDeleteConfirmVisible(true);
  };
  
  const cancelDelete = () => {
    setDeleteConfirmVisible(false);
    setEmployeeToDelete(null);
  };
  
  const confirmDelete = async () => {
    if (!employeeToDelete || !employeeToDelete.id) return;
    
    try {
      setIsDeleting(true);
      
      // Get employee ID and name for the success message
      const id = employeeToDelete.id;
      const name = employeeToDelete.name;
      
      // Call the delete function
      await deleteEmployee(id);
      
      // Update the UI immediately
      setEmployees(prev => prev.filter(emp => emp.id !== id));
      
      // Hide the confirmation modal
      setDeleteConfirmVisible(false);
      
      // Show success notification
      setSuccessMessage(`${name} has been deleted successfully`);
      setShowSuccess(true);
      
      // Refresh the list from the database
      fetchEmployees();
    } catch (error) {
      console.error(`Error deleting employee:`, error);
      Alert.alert("Error", "Could not delete employee. Please try again.");
    } finally {
      setIsDeleting(false);
      setEmployeeToDelete(null);
    }
  };

  const filteredEmployees = searchQuery
    ? employees.filter(
        (emp) =>
          emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.email.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : employees;

  const renderEmployeeItem = ({ item }: { item: EmployeeFormData }) => {
    const statusColor = {
      Active: "bg-green-100 text-green-800",
      "On Leave": "bg-yellow-100 text-yellow-800",
      Unavailable: "bg-red-100 text-red-800",
    }[item.status || "Active"];

    return (
      <TouchableOpacity
        className="bg-white p-4 rounded-lg mb-3 shadow-sm border border-gray-100"
        onPress={() => router.push(`/employees/view?id=${item.id}`)}
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900">
              {item.name}
            </Text>
            <Text className="text-gray-600 text-sm mt-1">{item.role}</Text>
            <View className="flex-row items-center mt-2">
              <Mail size={14} color="#6B7280" className="mr-1" />
              <Text className="text-gray-500 text-sm">{item.email}</Text>
            </View>
            <View className="flex-row items-center mt-1">
              <Phone size={14} color="#6B7280" className="mr-1" />
              <Text className="text-gray-500 text-sm">{item.phone}</Text>
            </View>
          </View>
          <View className="items-end">
            <View className={`px-2 py-1 rounded-full mb-2 ${statusColor}`}>
              <Text className="text-xs font-medium">{item.status}</Text>
            </View>
            <View className="flex-row items-center">
              <Calendar size={14} color="#6B7280" />
              <Text className="text-gray-700 text-sm ml-1">
                0 events
              </Text>
            </View>
          </View>
        </View>
        <View className="flex-row justify-end mt-3 pt-2 border-t border-gray-100">
          <TouchableOpacity
            className="flex-row items-center mr-4"
            onPress={() => router.push(`/employees/edit?id=${item.id}`)}
          >
            <Edit size={16} color="#3B82F6" />
            <Text className="text-blue-500 ml-1">Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => handleDeleteEmployee(item)}
          >
            <Trash2 size={16} color="#EF4444" />
            <Text className="text-red-500 ml-1">Remove</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => {
    if (isLoading) {
      return (
        <View className="flex-1 justify-center items-center py-20">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-500 mt-4">Loading employees...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View className="flex-1 justify-center items-center py-20">
          <AlertCircle size={40} color="#EF4444" />
          <Text className="text-gray-800 font-medium mt-4">{error}</Text>
          <TouchableOpacity
            className="mt-4 bg-blue-500 px-4 py-2 rounded-lg"
            onPress={fetchEmployees}
          >
            <Text className="text-white font-medium">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (searchQuery && filteredEmployees.length === 0) {
      return (
        <View className="flex-1 justify-center items-center py-20">
          <Search size={40} color="#9CA3AF" />
          <Text className="text-gray-800 font-medium mt-4">No results found</Text>
          <Text className="text-gray-500 text-center mt-2">
            No employees match your search criteria
          </Text>
          <TouchableOpacity
            className="mt-4"
            onPress={() => {
              setSearchQuery("");
              setShowSearch(false);
            }}
          >
            <Text className="text-blue-500 font-medium">Clear Search</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (employees.length === 0) {
      return (
        <View className="flex-1 justify-center items-center py-20">
          <User size={40} color="#9CA3AF" />
          <Text className="text-gray-800 font-medium mt-4">No employees yet</Text>
          <Text className="text-gray-500 text-center mt-2">
            Start by adding your first employee
          </Text>
          <TouchableOpacity
            className="mt-4 bg-blue-500 px-4 py-2 rounded-lg"
            onPress={() => router.push("/employees/add")}
          >
            <Text className="text-white font-medium">Add Employee</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Header title="Employees" />

      <View className="flex-1 px-4 pt-4">
        <View className="flex-row justify-between items-center mb-4">
          {showSearch ? (
            <View className="flex-1 flex-row items-center bg-white rounded-lg p-2 mr-2">
              <Search size={20} color="#4B5563" />
              <TextInput
                className="flex-1 ml-2"
                placeholder="Search employees..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              <TouchableOpacity
                onPress={() => {
                  setShowSearch(false);
                  setSearchQuery("");
                }}
              >
                <Text className="text-blue-500">Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row">
              <TouchableOpacity
                className="bg-white p-2 rounded-lg mr-2 shadow-sm"
                onPress={() => setShowSearch(true)}
              >
                <Search size={20} color="#4B5563" />
              </TouchableOpacity>
              <TouchableOpacity className="bg-white p-2 rounded-lg shadow-sm">
                <Filter size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            className="bg-blue-500 px-3 py-2 rounded-lg flex-row items-center"
            onPress={() => router.push("/employees/add")}
          >
            <Plus size={18} color="#FFFFFF" />
            <Text className="text-white font-medium ml-1">Add Employee</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredEmployees}
          renderItem={renderEmployeeItem}
          keyExtractor={(item) => item.id || Math.random().toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ 
            paddingBottom: insets.bottom + 80,
            flexGrow: 1, 
          }}
          ListEmptyComponent={renderEmptyList}
        />
      </View>

      <View className="absolute bottom-0 left-0 right-0">
        <BottomNavigation activeTab="employees" />
      </View>
      
      {/* Custom delete confirmation */}
      <DeleteConfirmation 
        isVisible={deleteConfirmVisible}
        title="Delete Employee"
        message="Are you sure you want to delete"
        itemName={employeeToDelete?.name}
        isLoading={isDeleting}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />
      
      {/* Success notification */}
      <SuccessNotification 
        visible={showSuccess}
        message={successMessage}
        onDismiss={() => setShowSuccess(false)}
      />
    </SafeAreaView>
  );
}
