import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Search,
  Filter,
  Package,
  Calendar,
  User,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  Plus,
  ShoppingBag,
  DollarSign,
  XCircle,
} from "lucide-react-native";

import Header from "../../components/Header";
import BottomNavigation from "../../components/navigation/BottomNavigation";
import { getOrders, markRentalAsReturned, updateOrder, cancelOrder, Order, OrderItem as OrderItemType } from "../../services/orderService";

type OrderStatus = 'Active' | 'Completed' | 'Returned' | 'Overdue' | 'Cancelled' | 'Sold';

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<OrderStatus | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string, orderType: string) => {
    if (orderType === 'sale') {
      return <ShoppingBag size={20} color="#3B82F6" />;
    }
    
    switch (status) {
      case "Active":
        return <Package size={20} color="#3B82F6" />;
      case "Completed":
      case "Returned":
        return <CheckCircle size={20} color="#10B981" />;
      case "Overdue":
        return <AlertCircle size={20} color="#EF4444" />;
      default:
        return <Package size={20} color="#6B7280" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-800';
      case 'Returned':
        return 'bg-gray-100 text-gray-800';
      case 'Overdue':
        return 'bg-red-100 text-red-800';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Unpaid':
        return 'bg-red-100 text-red-800';
      case 'Partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter orders by status and search query
  const filteredOrders = orders
    .filter((order) => {
      if (activeFilter === "All") return true;
      // Special case for "Sold" filter - match sale orders with "Active" status
      if (activeFilter === "Sold") {
        return order.order_type === 'sale' && order.status === "Active";
      }
      // Otherwise filter by order status
      return order.status === activeFilter;
    })
    .filter((order) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      
      // Parse items if they're stored as a JSON string
      let orderItems: OrderItemType[] = [];
      try {
        orderItems = JSON.parse(order.items);
      } catch (e) {
        // If parsing fails, treat items as an empty array
        console.error("Error parsing order items:", e);
      }
      
      return (
        order.customer_name.toLowerCase().includes(query) ||
        orderItems.some((item) => item.product_name.toLowerCase().includes(query))
      );
    });

  const handleMarkAsReturned = async (id: string) => {
    try {
      // Get current date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      const result = await markRentalAsReturned(id, today);
      
      if (result) {
        // Refresh the orders list
        fetchOrders();
      } else {
        setError("Failed to mark order as returned. Please try again.");
      }
    } catch (err) {
      console.error("Error marking order as returned:", err);
      setError("Failed to mark order as returned. Please try again.");
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      const result = await updateOrder(id, { 
        payment_status: 'Paid',
        updated_at: new Date().toISOString()
      });
      
      if (result) {
        // Refresh the orders list
        fetchOrders();
      } else {
        setError("Failed to mark order as paid. Please try again.");
      }
    } catch (err) {
      console.error("Error marking order as paid:", err);
      setError("Failed to mark order as paid. Please try again.");
    }
  };

  const handleCancelOrder = async (id: string) => {
    try {
      const result = await cancelOrder(id);
      
      if (result) {
        // Refresh the orders list
        fetchOrders();
      } else {
        setError("Failed to cancel order. Please try again.");
      }
    } catch (err) {
      console.error("Error cancelling order:", err);
      setError("Failed to cancel order. Please try again.");
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const statusColor = getStatusColor(item.status);
    const paymentStatusColor = getPaymentStatusColor(item.payment_status || 'Unpaid');
    
    // Parse items from JSON string
    let orderItems: OrderItemType[] = [];
    try {
      orderItems = JSON.parse(item.items);
    } catch (e) {
      console.error("Error parsing order items:", e);
    }
    
    // Format dates for display
    const startDate = item.start_date ? new Date(item.start_date).toLocaleDateString() : 'N/A';
    const endDate = item.end_date ? new Date(item.end_date).toLocaleDateString() : 'N/A';
    
    // Calculate days remaining or overdue for rental orders
    let daysRemaining, daysOverdue;
    if (item.order_type === 'rental' && item.end_date) {
      const currentDate = new Date();
      const endDate = new Date(item.end_date);
      const differenceInDays = Math.floor((endDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24));
      
      if (differenceInDays < 0 && item.status === 'Active') {
        // Order is overdue
        daysOverdue = Math.abs(differenceInDays);
      } else if (differenceInDays >= 0 && item.status === 'Active') {
        // Order is active with days remaining
        daysRemaining = differenceInDays;
      }
    }

    return (
      <TouchableOpacity
        className="bg-white p-4 rounded-lg mb-3 shadow-sm border border-gray-100"
        onPress={() => router.push(`/orders/view?id=${item.id}`)}
        hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-1 mr-2">
            <View className="flex-row items-center mb-1">
              <User size={14} color="#6B7280" />
              <Text className="font-semibold text-gray-900 ml-1" numberOfLines={1} ellipsizeMode="tail">
                {item.customer_name}
              </Text>
            </View>
            <Text className="text-gray-600 text-sm mb-1" numberOfLines={1} ellipsizeMode="tail">
              {orderItems.length > 0
                ? orderItems.length > 1
                  ? `${orderItems[0].product_name} +${orderItems.length - 1} more`
                  : orderItems[0].product_name
                : "No items"}
            </Text>
            {item.order_type === 'rental' && (
              <View className="flex-row items-center">
                <Calendar size={14} color="#6B7280" />
                <Text className="text-gray-500 text-sm ml-1">
                  {startDate} - {endDate}
                </Text>
              </View>
            )}
            <View className="flex-row items-center mt-1">
              <Text className="text-xs text-gray-500">
                {item.order_type === 'rental' ? 'Rental' : 'Sale'}
              </Text>
            </View>
          </View>
          <View className="items-end">
            <View className="flex-row space-x-2 mb-2">
              <View className={`px-2 py-1 rounded-full ${statusColor}`}>
                <Text className="text-xs font-medium">{item.status}</Text>
              </View>
              <View className={`px-2 py-1 rounded-full ${paymentStatusColor}`}>
                <Text className="text-xs font-medium">{item.payment_status || 'Unpaid'}</Text>
              </View>
            </View>
            <Text className="font-semibold">₹{item.total_amount.toFixed(2)}</Text>
            {item.status === "Active" && daysRemaining !== undefined && (
              <Text
                className={`text-xs ${daysRemaining <= 2 ? "text-red-600" : "text-gray-600"}`}
              >
                {daysRemaining} days remaining
              </Text>
            )}
            {item.status === "Active" && daysOverdue !== undefined && (
              <Text className="text-xs text-red-600">
                {daysOverdue} {daysOverdue === 1 ? "day" : "days"} overdue
              </Text>
            )}
          </View>
        </View>
        <View className="flex-row justify-end flex-wrap mt-3 pt-2 border-t border-gray-100">
          {item.order_type === 'rental' && item.status === 'Active' && (
            <TouchableOpacity
              className="flex-row items-center mr-2 mb-1"
              onPress={() => handleMarkAsReturned(item.id)}
            >
              <CheckCircle size={12} color="#10B981" />
              <Text className="text-xs text-green-600 ml-1">Mark Returned</Text>
            </TouchableOpacity>
          )}
          {item.status === "Active" && (
            <TouchableOpacity
              className="flex-row items-center mb-1"
              onPress={() => handleCancelOrder(item.id)}
            >
              <XCircle size={12} color="#EF4444" />
              <Text className="text-xs text-red-600 ml-1">Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Header title="Orders" />
      <View className="flex-1 px-4 pt-4 shrink">
        <View className="flex-row justify-between items-center mb-4">
          {showSearch ? (
            <View className="flex-1 flex-row items-center bg-white rounded-lg p-2 mr-2">
              <Search size={20} color="#4B5563" />
              <TextInput
                className="flex-1 ml-2"
                placeholder="Search orders..."
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
              <TouchableOpacity 
                className="bg-white p-2 rounded-lg shadow-sm"
                onPress={() => fetchOrders()}
              >
                <Filter size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            className="bg-blue-500 px-3 py-2 rounded-lg flex-row items-center"
            onPress={() => router.push("/orders/add")}
          >
            <Plus size={18} color="#FFFFFF" />
            <Text className="text-white font-medium ml-1">New Order</Text>
          </TouchableOpacity>
        </View>

        {/* Status Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4 shrink-0 grow-0"
        >
          {["All", "Active", "Sold", "Completed", "Returned", "Overdue", "Cancelled"].map(
            (status) => (
              <TouchableOpacity
                key={status}
                className={`px-4 py-2 rounded-full mr-2 ${activeFilter === status ? "bg-blue-500" : "bg-white"}`}
                onPress={() => setActiveFilter(status as OrderStatus | "All")}
              >
                <Text
                  className={`font-medium ${activeFilter === status ? "text-white" : "text-gray-700"}`}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ),
          )}
        </ScrollView>

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="mt-2 text-gray-600">Loading orders...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-red-500">{error}</Text>
            <TouchableOpacity
              className="mt-2 bg-blue-500 px-4 py-2 rounded-lg"
              onPress={fetchOrders}
            >
              <Text className="text-white">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredOrders.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Package size={64} color="#9CA3AF" />
            <Text className="mt-2 text-gray-500 text-lg">No orders found</Text>
            {searchQuery ? (
              <Text className="text-gray-400">Try adjusting your search</Text>
            ) : (
              <TouchableOpacity
                className="mt-4 bg-blue-500 px-4 py-2 rounded-lg"
                onPress={() => router.push("/orders/add")}
              >
                <Text className="text-white">Create New Order</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
          />
        )}
      </View>
      <View className="absolute bottom-0 left-0 right-0">
        <BottomNavigation activeTab="orders" />
      </View>
    </SafeAreaView>
  );
}
