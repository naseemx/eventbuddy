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
import {
  ArrowLeft,
  Clock,
  User,
  Package,
  FileText,
  DollarSign,
  Calendar,
  Filter,
} from "lucide-react-native";

import Header from "../../components/Header";

interface LogItem {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
  type: "product" | "customer" | "order" | "invoice" | "event" | "system";
}

export default function ActivityLogsScreen() {
  const insets = useSafeAreaInsets();

  // Mock activity logs
  const mockLogs: LogItem[] = [
    {
      id: "1",
      action: "Product Status Updated",
      user: "Alex Johnson",
      timestamp: "Today, 2:30 PM",
      details: "Canon 5D Mark IV status changed from Available to Rented",
      type: "product",
    },
    {
      id: "2",
      action: "Invoice Created",
      user: "Alex Johnson",
      timestamp: "Today, 1:15 PM",
      details: "Created invoice #INV-2023-006 for Sarah Johnson",
      type: "invoice",
    },
    {
      id: "3",
      action: "Customer Added",
      user: "Emily Davis",
      timestamp: "Today, 11:45 AM",
      details: "Added new customer: Robert Wilson",
      type: "customer",
    },
    {
      id: "4",
      action: "Payment Received",
      user: "Alex Johnson",
      timestamp: "Yesterday, 4:20 PM",
      details: "Received payment of ₹850 for invoice #INV-2023-003",
      type: "invoice",
    },
    {
      id: "5",
      action: "Event Created",
      user: "Emily Davis",
      timestamp: "Yesterday, 2:10 PM",
      details: "Created new event: Wilson Anniversary on Jul 15, 2023",
      type: "event",
    },
    {
      id: "6",
      action: "Order Completed",
      user: "Alex Johnson",
      timestamp: "Yesterday, 10:30 AM",
      details: "Marked order #ORD-2023-004 as returned",
      type: "order",
    },
    {
      id: "7",
      action: "Product Added",
      user: "Emily Davis",
      timestamp: "Jun 12, 2023",
      details: "Added new product: Nikon Z6 II to inventory",
      type: "product",
    },
    {
      id: "8",
      action: "System Update",
      user: "System",
      timestamp: "Jun 10, 2023",
      details: "System updated to version 2.1.0",
      type: "system",
    },
  ];

  const getIconForLogType = (type: string) => {
    switch (type) {
      case "product":
        return <Package size={20} color="#6366F1" />;
      case "customer":
        return <User size={20} color="#10B981" />;
      case "order":
        return <Package size={20} color="#F59E0B" />;
      case "invoice":
        return <FileText size={20} color="#3B82F6" />;
      case "event":
        return <Calendar size={20} color="#EC4899" />;
      case "system":
        return <Clock size={20} color="#6B7280" />;
      default:
        return <Clock size={20} color="#6B7280" />;
    }
  };

  const renderLogItem = ({ item }: { item: LogItem }) => {
    return (
      <TouchableOpacity
        className="bg-white p-4 rounded-lg mb-3 shadow-sm border border-gray-100"
        onPress={() => {
          // Navigate based on log type
          switch (item.type) {
            case "product":
              router.push(`/products/view?id=${item.id}`);
              break;
            case "customer":
              router.push(`/customers/view?id=${item.id}`);
              break;
            case "order":
              router.push(`/orders/view?id=${item.id}`);
              break;
            case "invoice":
              router.push(`/finances/invoice-details?id=${item.id}`);
              break;
            case "event":
              router.push(`/events/view?id=${item.id}`);
              break;
            default:
              console.log(`View log ${item.id}`);
          }
        }}
      >
        <View className="flex-row items-start">
          <View className="mr-3 mt-1">{getIconForLogType(item.type)}</View>
          <View className="flex-1">
            <Text className="font-semibold text-gray-900">{item.action}</Text>
            <Text className="text-gray-600 text-sm mt-1">{item.details}</Text>
            <View className="flex-row justify-between items-center mt-2">
              <View className="flex-row items-center">
                <User size={14} color="#6B7280" />
                <Text className="text-gray-500 text-xs ml-1">{item.user}</Text>
              </View>
              <Text className="text-gray-400 text-xs">{item.timestamp}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Header
        title="Activity Logs"
        leftIcon={<ArrowLeft size={24} color="#000" />}
        onLeftPress={() => router.back()}
      />

      <View className="flex-1 px-4 pt-4">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-semibold text-gray-800">
            Recent Activities
          </Text>
          <TouchableOpacity className="bg-white p-2 rounded-lg shadow-sm">
            <Filter size={20} color="#4B5563" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={mockLogs}
          renderItem={renderLogItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom }}
        />
      </View>
    </SafeAreaView>
  );
}
