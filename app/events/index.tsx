import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  AlertCircle,
  Check,
  XCircle,
} from "lucide-react-native";

import Header from "../../components/Header";
import BottomNavigation from "../../components/navigation/BottomNavigation";
import { supabase } from "../../lib/supabase";

interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  customer_id: string;
  customer_name: string;
  notes: string;
  status: "Upcoming" | "Ended" | "Cancelled";
  created_at: string;
  updated_at: string;
}

// Event service function
const getAllEvents = async (statusFilter?: "Upcoming" | "Ended" | "Cancelled"): Promise<EventItem[]> => {
  try {
    console.log(`Fetching events with status filter: ${statusFilter || 'None'}`);
    
    // Start building the query
    let query = supabase
      .from('events')
      .select(`
        *,
        customers:customer_id (name)
      `);
    
    // Add status filter if provided
    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }
    
    // Complete the query
    const { data, error } = await query.order('date', { ascending: true });
    
    if (error) throw error;
    
    console.log(`Fetched ${data?.length || 0} events`);
    
    // Format the data to include customer_name
    return (data || []).map(event => ({
      ...event,
      customer_name: event.customers?.name || 'Unknown Customer',
    }));
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"Upcoming" | "Ended" | "Cancelled" | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("Fetching all events with filter:", statusFilter);
      const data = await getAllEvents(statusFilter || undefined);
      console.log(`Loaded ${data.length} events`);
      setEvents(data);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to load events. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  // Initial fetch on mount
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("Events list screen in focus - refreshing data");
      fetchEvents();
      return () => {
        // Clean up if needed
      };
    }, [fetchEvents])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }, [fetchEvents]);
  
  const handleFilterPress = () => {
    setShowFilterModal(true);
  };
  
  const applyFilter = (status: "Upcoming" | "Ended" | "Cancelled" | null) => {
    setStatusFilter(status);
    setShowFilterModal(false);
  };

  const renderEventItem = ({ item }: { item: EventItem }) => {
    const statusColor = {
      Upcoming: "bg-blue-100 text-blue-800",
      Ended: "bg-green-100 text-green-800",
      Cancelled: "bg-red-100 text-red-800",
    }[item.status];

    return (
      <TouchableOpacity
        className="bg-white p-4 rounded-lg mb-3 shadow-sm border border-gray-100"
        onPress={() => router.push(`/events/view?id=${item.id}`)}
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900">
              {item.title}
            </Text>
            <View className="flex-row items-center mt-1">
              <Calendar size={14} color="#6B7280" />
              <Text className="text-gray-500 text-sm ml-1">
                {item.date} {item.time}
              </Text>
            </View>
            <View className="flex-row items-center mt-1">
              <MapPin size={14} color="#6B7280" />
              <Text className="text-gray-500 text-sm ml-1">{item.venue}</Text>
            </View>
            <Text className="text-gray-500 text-sm mt-1">
              Client: {item.customer_name}
            </Text>
          </View>
          <View className={`px-2 py-1 rounded-full ${statusColor}`}>
            <Text className="text-xs font-medium">{item.status}</Text>
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
          <Text className="mt-2 text-gray-600">Loading events...</Text>
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
            onPress={fetchEvents}
          >
            <Text className="text-white font-medium">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (events.length === 0) {
      return (
        <View className="flex-1 justify-center items-center p-6">
          <Calendar size={40} color="#9CA3AF" />
          <Text className="mt-4 text-gray-800 font-medium text-center">
            No events found
          </Text>
          {statusFilter && (
            <Text className="mt-2 text-gray-600 text-center">
              No events with status: {statusFilter}
            </Text>
          )}
          <TouchableOpacity
            className="mt-4 px-4 py-2 bg-blue-500 rounded-lg flex-row items-center"
            onPress={() => router.push("/events/add")}
          >
            <Plus size={18} color="#FFFFFF" />
            <Text className="text-white font-medium ml-1">Add Event</Text>
          </TouchableOpacity>
          {statusFilter && (
            <TouchableOpacity
              className="mt-2 px-4 py-2 bg-gray-200 rounded-lg"
              onPress={() => setStatusFilter(null)}
            >
              <Text className="text-gray-700 font-medium">Clear Filter</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <FlatList
        data={events}
        renderItem={renderEventItem}
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
      <Header title="Events" />

      <View className="flex-1 px-4 pt-4">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row">
            <TouchableOpacity className="bg-white p-2 rounded-lg mr-2 shadow-sm">
              <Search size={20} color="#4B5563" />
            </TouchableOpacity>
            <TouchableOpacity 
              className={`${statusFilter ? 'bg-blue-100 border border-blue-300' : 'bg-white'} p-2 rounded-lg shadow-sm`} 
              onPress={handleFilterPress}
            >
              <Filter size={20} color={statusFilter ? "#3B82F6" : "#4B5563"} />
            </TouchableOpacity>
            {statusFilter && (
              <TouchableOpacity 
                className="bg-blue-100 ml-2 px-3 py-2 rounded-lg flex-row items-center"
                onPress={() => applyFilter(null)}
              >
                <Text className="text-blue-700 text-xs mr-1">{statusFilter}</Text>
                <XCircle size={14} color="#3B82F6" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            className="bg-blue-500 px-3 py-2 rounded-lg flex-row items-center"
            onPress={() => router.push("/events/add")}
          >
            <Plus size={18} color="#FFFFFF" />
            <Text className="text-white font-medium ml-1">Add Event</Text>
          </TouchableOpacity>
        </View>

        {renderContent()}
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-5">
          <View className="bg-white rounded-xl w-full p-5">
            <Text className="text-xl font-bold text-center mb-5">Filter Events</Text>
            
            <View className="mb-5">
              <TouchableOpacity 
                className={`p-3 mb-2 rounded-lg flex-row justify-between items-center ${
                  statusFilter === "Upcoming" ? "bg-blue-50 border border-blue-300" : "bg-gray-50"
                }`}
                onPress={() => applyFilter("Upcoming")}
              >
                <Text className={`font-medium ${
                  statusFilter === "Upcoming" ? "text-blue-700" : "text-gray-700"
                }`}>Upcoming Events</Text>
                {statusFilter === "Upcoming" && (
                  <Check size={18} color="#1E40AF" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                className={`p-3 mb-2 rounded-lg flex-row justify-between items-center ${
                  statusFilter === "Ended" ? "bg-green-50 border border-green-300" : "bg-gray-50"
                }`}
                onPress={() => applyFilter("Ended")}
              >
                <Text className={`font-medium ${
                  statusFilter === "Ended" ? "text-green-700" : "text-gray-700"
                }`}>Ended Events</Text>
                {statusFilter === "Ended" && (
                  <Check size={18} color="#065F46" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                className={`p-3 mb-2 rounded-lg flex-row justify-between items-center ${
                  statusFilter === "Cancelled" ? "bg-red-50 border border-red-300" : "bg-gray-50"
                }`}
                onPress={() => applyFilter("Cancelled")}
              >
                <Text className={`font-medium ${
                  statusFilter === "Cancelled" ? "text-red-700" : "text-gray-700"
                }`}>Cancelled Events</Text>
                {statusFilter === "Cancelled" && (
                  <Check size={18} color="#991B1B" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                className={`p-3 rounded-lg flex-row justify-between items-center ${
                  statusFilter === null ? "bg-blue-50 border border-blue-300" : "bg-gray-50"
                }`}
                onPress={() => applyFilter(null)}
              >
                <Text className={`font-medium ${
                  statusFilter === null ? "text-blue-700" : "text-gray-700"
                }`}>All Events</Text>
                {statusFilter === null && (
                  <Check size={18} color="#1E40AF" />
                )}
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              className="bg-gray-200 rounded-lg p-3 flex-row justify-center items-center"
              onPress={() => setShowFilterModal(false)}
            >
              <Text className="text-gray-700 font-medium">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View className="absolute bottom-0 left-0 right-0">
        <BottomNavigation activeTab="events" />
      </View>
    </SafeAreaView>
  );
}
