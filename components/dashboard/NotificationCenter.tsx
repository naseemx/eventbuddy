import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import {
  Bell,
  AlertTriangle, 
  Calendar, 
  CheckCircle, 
  Clock,
  Truck, 
  DollarSign, 
  MessageCircle,
  Info
} from 'lucide-react-native';
import { getNotifications } from '../../services/notificationService';

export type NotificationType = 
  | 'alert' 
  | 'reminder' 
  | 'success' 
  | 'info' 
  | 'payment' 
  | 'delivery' 
  | 'event' 
  | 'message';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  route?: string;
}

// Define the database notification type structure
interface DBNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  reference_id?: string;
}

interface NotificationCenterProps {
  notifications?: Notification[];
  limit?: number;
}

export default function NotificationCenter({ 
  notifications: propNotifications,
  limit = 5 
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If notifications are provided as props, use them
    if (propNotifications) {
      setNotifications(propNotifications);
      return;
    }

    // Otherwise fetch from Supabase
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const fetchedNotifications = await getNotifications(limit);
        // Map Supabase notifications to component format if needed
        const formattedNotifications = fetchedNotifications.map((notification: DBNotification) => {
          // Determine route based on notification type and reference_id
          let route = '';
          if (notification.type === 'event' && notification.reference_id) {
            route = `/events/details?id=${notification.reference_id}`;
          } else if (notification.type === 'payment' && notification.reference_id) {
            route = `/finances/transaction-details?id=${notification.reference_id}`;
          } else if (notification.type === 'delivery' && notification.reference_id) {
            route = `/rentals/details?id=${notification.reference_id}`;
          }

          // Format time - convert from ISO date to relative time
          const timeDiff = new Date().getTime() - new Date(notification.created_at).getTime();
          const minutes = Math.floor(timeDiff / 60000);
          const hours = Math.floor(minutes / 60);
          const days = Math.floor(hours / 24);
          
          let formattedTime = '';
          if (days > 0) {
            formattedTime = `${days}d ago`;
          } else if (hours > 0) {
            formattedTime = `${hours}h ago`;
          } else {
            formattedTime = `${minutes}m ago`;
          }

          // Convert DB notification type to component type
          const mappedType: NotificationType = 
            notification.type === 'reminder' ? 'reminder' :
            notification.type === 'alert' ? 'alert' :
            notification.type === 'success' ? 'success' :
            notification.type === 'payment' ? 'payment' :
            notification.type === 'delivery' ? 'delivery' :
            notification.type === 'event' ? 'event' :
            notification.type === 'message' ? 'message' : 'info';

          return {
            id: notification.id,
            type: mappedType,
            title: notification.title,
            message: notification.message,
            time: formattedTime,
            read: notification.is_read,
            route
          };
        });

        setNotifications(formattedNotifications);
        setError(null);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications');
        
        // Fallback to empty notifications array
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [limit, propNotifications]);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle size={18} color="#EF4444" />;
      case 'reminder':
        return <Clock size={18} color="#F59E0B" />;
      case 'success':
        return <CheckCircle size={18} color="#10B981" />;
      case 'payment':
        return <DollarSign size={18} color="#8B5CF6" />;
      case 'delivery':
        return <Truck size={18} color="#3B82F6" />;
      case 'event':
        return <Calendar size={18} color="#EC4899" />;
      case 'message':
        return <MessageCircle size={18} color="#6366F1" />;
      case 'info':
      default:
        return <Info size={18} color="#6B7280" />;
    }
  };

  return (
    <View className="bg-white rounded-lg shadow-sm p-4 w-full max-h-96">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <Bell size={18} color="#4B5563" />
          <Text className="font-semibold text-gray-900 ml-2">Notifications</Text>
        </View>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={() => router.push('/notifications')}>
            <Text className="text-blue-600 text-sm">See All</Text>
        </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View className="items-center justify-center py-8">
          <ActivityIndicator size="small" color="#3B82F6" />
        </View>
      ) : error ? (
        <View className="items-center justify-center py-8">
          <Text className="text-red-500 text-sm">{error}</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View className="items-center justify-center py-8">
          <Text className="text-gray-500 text-sm">No notifications</Text>
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          className="max-h-72"
        >
          {notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              className={`p-3 mb-2 rounded-md border-l-4 ${
                notification.read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-500'
              }`}
              onPress={() => notification.route ? router.push(notification.route as any) : null}
            >
              <View className="flex-row">
                <View className="mt-1 mr-3">
                  {getNotificationIcon(notification.type)}
              </View>
              <View className="flex-1">
                  <Text className="font-medium text-gray-900">{notification.title}</Text>
                  <Text className="text-gray-600 text-sm">{notification.message}</Text>
                  <Text className="text-gray-400 text-xs mt-1">{notification.time}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}