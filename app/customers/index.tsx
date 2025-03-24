import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import {
  Plus,
  Search,
  Filter,
  User,
  Phone,
  Package,
  AlertCircle
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

  const renderCustomerItem = ({ item }: { item: Customer }) => {
    return (
      <TouchableOpacity
        className="bg-white p-4 rounded-lg mb-3 shadow-sm border border-gray-100"
        onPress={() => router.push(`/customers/view?id=${item.id}`)}
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900">
              {item.name}
            </Text>
            <Text className="text-gray-500 text-sm mt-1">{item.email}</Text>
            <View className="flex-row items-center mt-1">
              <Phone size={14} color="#6B7280" />
              <Text className="text-gray-500 text-sm ml-1">{item.phone}</Text>
            </View>
          </View>
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

    if (customers.length === 0) {
      return (
        <View className="flex-1 justify-center items-center p-6">
          <User size={40} color="#9CA3AF" />
          <Text className="mt-4 text-gray-800 font-medium text-center">
            No customers found
          </Text>
          <Text className="mt-2 text-gray-600 text-center">
            Add your first customer to get started
          </Text>
          <TouchableOpacity
            className="mt-4 px-4 py-2 bg-blue-500 rounded-lg flex-row items-center"
            onPress={() => router.push("/customers/add")}
          >
            <Plus size={18} color="#FFFFFF" />
            <Text className="text-white font-medium ml-1">Add Customer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={customers}
        renderItem={renderCustomerItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
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
        <View className="flex-row justify-between items-center mb-4 animate-none">
          <View className="flex-row">
            <TouchableOpacity className="bg-white p-2 rounded-lg mr-2 shadow-sm">
              <Search size={20} color="#4B5563" />
            </TouchableOpacity>
            <TouchableOpacity className="bg-white p-2 rounded-lg shadow-sm">
              <Filter size={20} color="#4B5563" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            className="px-3 py-2 rounded-lg flex-row items-center bg-[#4489f0]"
            onPress={() => router.push("/customers/add")}
          >
            <Plus size={18} color="#FFFFFF" />
            <Text className="text-white font-medium ml-1">Add Customer</Text>
          </TouchableOpacity>
        </View>

        {renderContent()}
      </View>
      <View className="absolute bottom-0 left-0 right-0">
        <BottomNavigation activeTab="customers" />
      </View>
    </SafeAreaView>
  );
}
