import React, { useState } from "react";
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
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import PageTransition from "../../components/animations/PageTransition";
import {
  ArrowLeft,
  Bell,
  AlertCircle,
  Clock,
  Package,
  ChevronRight,
  Filter,
} from "lucide-react-native";

import Header from "../../components/Header";
import { 
  getNotifications, 
  markNotificationAsRead, 
  checkAllNotifications,
  Notification 
} from "../../services/notificationService";

// Helper function to format date to relative time
const getRelativeTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  if (diffSec < 60) {
    return "Just now";
  } else if (diffMin < 60) {
    return `${diffMin} min ago`;
  } else if (diffHour < 24) {
    return `${diffHour}h ago`;
  } else if (diffDay === 1) {
    return "Yesterday";
  } else if (diffDay < 7) {
    return `${diffDay} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};

// Helper function to determine route based on notification type and reference_id
const getRouteFromNotification = (notification: Notification): string | undefined => {
  if (!notification.reference_id) return undefined;
  
  switch (notification.type) {
    case "rental_overdue":
      return `/orders/view?id=${notification.reference_id}`;
    case "event_upcoming":
    case "event_today":
      return `/events/view?id=${notification.reference_id}`;
    default:
      return undefined;
  }
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch notifications when the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchNotifications();
      return () => {}; // Cleanup function if needed
    }, [])
  );

  const checkForNewNotifications = async () => {
    console.log('Checking for new notifications...');
    try {
      // Check and create new notifications based on events and rentals
      await checkAllNotifications();
    } catch (err) {
      console.error('Error checking for new notifications:', err);
    }
  };

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching notifications...');
      
      // First, check for new notifications based on events and rentals
      await checkForNewNotifications();
      
      // Then fetch all existing notifications
      const data = await getNotifications(50); // Get up to 50 notifications
      
      // Filter notifications to only show event and rental types
      const filteredData = data.filter(notification => 
        notification.type === 'event_upcoming' || 
        notification.type === 'event_today' || 
        notification.type === 'rental_overdue'
      );
      
      console.log('Notifications received:', filteredData.length);
      setNotifications(filteredData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "rental_overdue":
        return <Package size={20} color="#EF4444" />;
      case "event_today":
        return <AlertCircle size={20} color="#10B981" />;
      case "event_upcoming":
        return <Clock size={20} color="#F59E0B" />;
      default:
        return <Bell size={20} color="#6B7280" />;
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    try {
    // Mark as read
      if (!notification.is_read) {
        await markNotificationAsRead(notification.id);
        
        // Update the local state to reflect the change
        setNotifications(prev => 
          prev.map(item => 
            item.id === notification.id ? { ...item, is_read: true } : item
          )
        );
      }
      
      // Navigate if route can be determined
      const route = getRouteFromNotification(notification);
      if (route) {
        router.push(route as any);
      }
    } catch (err) {
      console.error(`Error handling notification ${notification.id}:`, err);
    }
  };

  const getNotificationTitle = (notification: Notification) => {
    // Return the title directly if it exists
    if (notification.title) {
      return notification.title;
    }
    
    // Otherwise, generate a title based on the type
    switch (notification.type) {
      case "rental_overdue":
        return "Overdue Rental";
      case "event_today":
        return "Event Today";
      case "event_upcoming":
        return "Upcoming Event";
      default:
        return "Notification";
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    return (
      <TouchableOpacity
        className={`flex-row items-start p-4 mb-2 rounded-md ${item.is_read ? "bg-gray-50" : "bg-blue-50"}`}
        onPress={() => handleNotificationPress(item)}
      >
        <View className="mr-3 mt-1">{getIconForType(item.type)}</View>
        <View className="flex-1">
          <Text
            className={`font-medium ${item.is_read ? "text-gray-700" : "text-gray-900"}`}
          >
            {getNotificationTitle(item)}
          </Text>
          <Text className="text-gray-600 text-sm mt-1">{item.message}</Text>
          <Text className="text-gray-400 text-xs mt-1">{getRelativeTime(item.created_at)}</Text>
        </View>
        <ChevronRight size={16} color="#9CA3AF" />
      </TouchableOpacity>
    );
  };

  return (
    <PageTransition type="fade">
      <SafeAreaView className="flex-1 bg-gray-100">
        <Header
          title="Notifications"
          leftIcon={<ArrowLeft size={24} color="#000" />}
          onLeftPress={() => router.back()}
        />

        <View className="flex-1 px-4 pt-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-semibold text-gray-800">
              All Notifications
            </Text>
            <TouchableOpacity 
              className="bg-white p-2 rounded-lg shadow-sm"
              onPress={fetchNotifications}
            >
              <Filter size={20} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {isLoading && !refreshing ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#3B82F6" />
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-red-500">{error}</Text>
              <TouchableOpacity 
                className="mt-3 px-4 py-2 bg-blue-500 rounded-md"
                onPress={fetchNotifications}
              >
                <Text className="text-white font-medium">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : notifications.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Bell size={40} color="#9CA3AF" />
              <Text className="text-gray-500 mt-3">No notifications yet</Text>
              <TouchableOpacity 
                className="mt-3 px-4 py-2 bg-blue-500 rounded-md"
                onPress={fetchNotifications}
              >
                <Text className="text-white font-medium">Refresh</Text>
              </TouchableOpacity>
            </View>
          ) : (
          <FlatList
              data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={["#3B82F6"]}
                />
              }
            />
          )}
        </View>
      </SafeAreaView>
    </PageTransition>
  );
}
