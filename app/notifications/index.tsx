import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import PageTransition from "../../components/animations/PageTransition";
import {
  ArrowLeft,
  Bell,
  AlertCircle,
  Clock,
  CheckCircle,
  ChevronRight,
  Filter,
} from "lucide-react-native";

import Header from "../../components/Header";

type NotificationType = "alert" | "reminder" | "success";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  route?: string;
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();

  // Mock notifications
  const mockNotifications: Notification[] = [
    {
      id: "1",
      type: "alert",
      title: "Overdue Return",
      message: "Camera equipment for John Doe is 2 days overdue",
      time: "2h ago",
      read: false,
      route: "/orders/view?id=3",
    },
    {
      id: "2",
      type: "reminder",
      title: "Event Tomorrow",
      message: "Wedding photoshoot at Sunset Gardens",
      time: "3h ago",
      read: false,
      route: "/events/view?id=1",
    },
    {
      id: "3",
      type: "success",
      title: "Payment Received",
      message: "Invoice #1234 has been paid in full",
      time: "5h ago",
      read: true,
      route: "/finances/invoice-details?id=1",
    },
    {
      id: "4",
      type: "reminder",
      title: "Maintenance Due",
      message: "Sony A7 III is due for sensor cleaning",
      time: "Yesterday",
      read: true,
      route: "/products/view?id=2",
    },
    {
      id: "5",
      type: "alert",
      title: "Low Inventory",
      message: "Only 2 Canon 24-70mm lenses left in stock",
      time: "2 days ago",
      read: true,
    },
    {
      id: "6",
      type: "success",
      title: "New Customer",
      message: "Michael Brown has registered as a new customer",
      time: "3 days ago",
      read: true,
      route: "/customers/view?id=3",
    },
  ];

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case "alert":
        return <AlertCircle size={20} color="#EF4444" />;
      case "reminder":
        return <Clock size={20} color="#F59E0B" />;
      case "success":
        return <CheckCircle size={20} color="#10B981" />;
      default:
        return <Bell size={20} color="#6B7280" />;
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read
    console.log(`Marking notification ${notification.id} as read`);

    // Navigate if route is provided
    if (notification.route) {
      router.push(notification.route);
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    return (
      <TouchableOpacity
        className={`flex-row items-start p-4 mb-2 rounded-md ${item.read ? "bg-gray-50" : "bg-blue-50"}`}
        onPress={() => handleNotificationPress(item)}
      >
        <View className="mr-3 mt-1">{getIconForType(item.type)}</View>
        <View className="flex-1">
          <Text
            className={`font-medium ${item.read ? "text-gray-700" : "text-gray-900"}`}
          >
            {item.title}
          </Text>
          <Text className="text-gray-600 text-sm mt-1">{item.message}</Text>
          <Text className="text-gray-400 text-xs mt-1">{item.time}</Text>
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
            <TouchableOpacity className="bg-white p-2 rounded-lg shadow-sm">
              <Filter size={20} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={mockNotifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom }}
          />
        </View>
      </SafeAreaView>
    </PageTransition>
  );
}
