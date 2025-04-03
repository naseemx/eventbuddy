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
  TextInput,
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
  ChevronRight,
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
    
    // Complete the query with proper sorting
    // First sort by status (to prioritize "Upcoming"), then sort by date
    const { data, error } = await query
      .order('status')  // Remove nullsLast parameter
      .order('date', { ascending: true });
    
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
  const [searchText, setSearchText] = useState<string>("");
  const [showSearch, setShowSearch] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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

  // Add a function to handle search
  const handleSearchPress = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchText("");
    }
  };

  // Add function to handle sort
  const handleSortToggle = () => {
    const newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newSortOrder);
    // Sort the events array
    const sortedEvents = [...events].sort((a, b) => {
      // First prioritize by status (Upcoming first)
      if (a.status !== b.status) {
        if (a.status === 'Upcoming') return -1;
        if (b.status === 'Upcoming') return 1;
      }
      
      // Then sort by date according to sort order
      if (newSortOrder === 'asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });
    setEvents(sortedEvents);
  };

  // Add search filtering to the events
  const filteredEvents = events.filter(event => {
    if (searchText.trim() === "") return true;
    
    const searchLower = searchText.toLowerCase();
    return (
      event.title.toLowerCase().includes(searchLower) ||
      event.venue.toLowerCase().includes(searchLower) ||
      event.customer_name.toLowerCase().includes(searchLower)
    );
  });

  const renderEventItem = ({ item }: { item: EventItem }) => {
    const statusColor = {
      Upcoming: "bg-blue-100 text-blue-800",
      Ended: "bg-green-100 text-green-800",
      Cancelled: "bg-red-100 text-red-800",
    }[item.status];
    
    // Format date for better readability
    const eventDate = new Date(item.date);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    return (
      <TouchableOpacity
        className="bg-white p-4 rounded-lg mb-3 shadow-sm border border-gray-100"
        onPress={() => router.push(`/events/view?id=${item.id}`)}
        activeOpacity={0.7}
      >
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-lg font-semibold text-gray-900 flex-1" numberOfLines={1} ellipsizeMode="tail">
            {item.title}
          </Text>
          <View className={`px-2 py-1 rounded-full ${statusColor} ml-2`}>
            <Text className="text-xs font-medium">{item.status}</Text>
          </View>
        </View>
        
        <View className="flex-row items-center mt-1">
          <Calendar size={16} color="#6B7280" />
          <Text className="text-gray-700 text-sm font-medium ml-2">
            {formattedDate} {item.time && `• ${item.time}`}
          </Text>
        </View>
        
        <View className="flex-row items-center mt-2">
          <MapPin size={16} color="#6B7280" />
          <Text className="text-gray-600 text-sm ml-2" numberOfLines={1} ellipsizeMode="tail">
            {item.venue}
          </Text>
        </View>
        
        <View className="flex-row items-center mt-2 justify-between">
          <View className="flex-row items-center">
            <Users size={16} color="#6B7280" />
            <Text className="text-gray-600 text-sm ml-2" numberOfLines={1} ellipsizeMode="tail">
              {item.customer_name}
            </Text>
          </View>
          <ChevronRight size={16} color="#9CA3AF" />
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
        data={filteredEvents}
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
      <Header 
        title="Events" 
      />

      <View className="flex-1 px-4 pt-4">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-1 mr-2">
            <TextInput
              placeholder="Search events..."
              value={searchText}
              onChangeText={setSearchText}
              className="bg-white px-4 py-2 rounded-lg border border-gray-200"
            />
          </View>
          
          <TouchableOpacity 
            className={`${statusFilter ? 'bg-blue-100 border border-blue-300' : 'bg-white'} p-2 rounded-lg shadow-sm mr-2`} 
            onPress={handleFilterPress}
          >
            <Filter size={20} color={statusFilter ? "#3B82F6" : "#4B5563"} />
          </TouchableOpacity>
          
          <TouchableOpacity
            className="bg-blue-500 p-2 rounded-lg shadow-sm flex-row items-center justify-center"
            onPress={() => router.push("/events/add")}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        {statusFilter && (
          <View className="mb-3 flex-row">
            <TouchableOpacity 
              className="bg-blue-100 px-3 py-1 rounded-full flex-row items-center"
              onPress={() => applyFilter(null)}
            >
              <Text className="text-blue-700 text-xs mr-1">{statusFilter}</Text>
              <XCircle size={14} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        )}

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
            
            <TouchableOpacity
              className="bg-white border border-gray-200 rounded-lg p-3 mb-2 flex-row items-center"
              onPress={() => applyFilter("Upcoming")}
            >
              <View className="w-6 h-6 rounded-full bg-blue-100 items-center justify-center mr-3">
                <Calendar size={14} color="#3B82F6" />
              </View>
              <Text className="text-gray-800 font-medium">Upcoming Events</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="bg-white border border-gray-200 rounded-lg p-3 mb-2 flex-row items-center"
              onPress={() => applyFilter("Ended")}
            >
              <View className="w-6 h-6 rounded-full bg-green-100 items-center justify-center mr-3">
                <Check size={14} color="#10B981" />
              </View>
              <Text className="text-gray-800 font-medium">Ended Events</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="bg-white border border-gray-200 rounded-lg p-3 mb-4 flex-row items-center"
              onPress={() => applyFilter(null)}
            >
              <View className="w-6 h-6 rounded-full bg-gray-100 items-center justify-center mr-3">
                <XCircle size={14} color="#6B7280" />
              </View>
              <Text className="text-gray-800 font-medium">Show All</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="bg-blue-500 p-3 rounded-lg items-center"
              onPress={() => setShowFilterModal(false)}
            >
              <Text className="text-white font-medium">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomNavigation activeTab="events" />
    </SafeAreaView>
  );
}
