import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Package,
  Calendar,
  User,
  FileText,
  Clock,
  CheckCircle,
  Printer,
  Download,
  Send,
  ShoppingBag,
  Mail,
  Phone,
  DollarSign,
} from "lucide-react-native";
import { getOrderById, markRentalAsReturned, Order, OrderItem } from "../../services/orderService";
import { getInvoiceById } from "../../services/orderService";

export default function OrderViewScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const orderId = params.id as string;
  const refreshParam = params.refresh as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId, refreshKey]);

  // Handle refresh parameter
  useEffect(() => {
    if (refreshParam === 'true') {
      // Clear the refresh parameter to prevent infinite refresh loops
      router.setParams({ refresh: undefined });
      // Trigger a refresh by updating the refresh key
      setRefreshKey(prev => prev + 1);
    }
  }, [refreshParam]);

  const fetchOrderDetails = async () => {
    if (!orderId) {
      setError("Order ID is missing");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getOrderById(orderId);
      
      if (data) {
        setOrder(data);
      } else {
        setError("Order not found");
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
      setError("Failed to load order details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsReturned = async () => {
    if (!order) return;

    Alert.alert(
      "Confirm Return",
      "Are you sure you want to mark this rental as returned?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              setSubmitting(true);
              // Use today's date as the return date
              const today = new Date().toISOString().split('T')[0];
              const result = await markRentalAsReturned(order.id, today);
              
              if (result) {
                // Refresh order details
                fetchOrderDetails();
                Alert.alert("Success", "Rental has been marked as returned");
              } else {
                Alert.alert("Error", "Failed to mark rental as returned");
              }
            } catch (err) {
              console.error("Error marking rental as returned:", err);
              Alert.alert("Error", "Failed to mark rental as returned");
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-blue-100 text-blue-800";
      case "Completed":
        return "bg-purple-100 text-purple-800";
      case "Returned":
        return "bg-green-100 text-green-800";
      case "Overdue":
        return "bg-red-100 text-red-800";
      case "Cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "text-green-600";
      case "Unpaid":
        return "text-red-600";
      case "Partial":
        return "text-blue-600";
      case "Cancelled":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  // Parse order items
  const parseOrderItems = (): OrderItem[] => {
    if (!order || !order.items) return [];
    
    try {
      return JSON.parse(order.items);
    } catch (e) {
      console.error("Error parsing order items:", e);
      return [];
    }
  };

  // Calculate days remaining or overdue
  const calculateDaysInfo = () => {
    if (!order || !order.end_date || order.order_type !== 'rental') {
      return { daysRemaining: undefined, daysOverdue: undefined };
    }

    const currentDate = new Date();
    const endDate = new Date(order.end_date);
    const differenceInDays = Math.floor((endDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24));
    
    if (differenceInDays < 0 && order.status === 'Active') {
      // Order is overdue
      return { daysRemaining: undefined, daysOverdue: Math.abs(differenceInDays) };
    } else if (differenceInDays >= 0 && order.status === 'Active') {
      // Order is active with days remaining
      return { daysRemaining: differenceInDays, daysOverdue: undefined };
    }
    
    return { daysRemaining: undefined, daysOverdue: undefined };
  };

  const { daysRemaining, daysOverdue } = order ? calculateDaysInfo() : { daysRemaining: undefined, daysOverdue: undefined };
  const orderItems = order ? parseOrderItems() : [];

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-2 text-gray-600">Loading order details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <View className="bg-white px-4 py-4 flex-row justify-between items-center shadow-sm">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ArrowLeft size={24} color="#4B5563" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Order Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-red-500 mb-2">{error || "Order not found"}</Text>
          <TouchableOpacity
            className="bg-blue-500 px-4 py-2 rounded-lg"
            onPress={() => router.back()}
          >
            <Text className="text-white">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Format dates for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const startDate = formatDate(order.start_date);
  const endDate = formatDate(order.end_date);
  const returnDate = formatDate(order.return_date);

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-white px-4 py-4 flex-row justify-between items-center shadow-sm">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ArrowLeft size={24} color="#4B5563" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">
          {order.order_type === 'rental' ? 'Rental' : 'Sale'} Details
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 20,
        }}
      >
        {/* Order Status */}
        <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-lg font-semibold">Order #{order.id.substring(0, 8)}</Text>
            <View
              className={`px-3 py-1 rounded-full ${getStatusColor(order.status)}`}
            >
              <Text className="text-xs font-medium">{order.status}</Text>
            </View>
          </View>
          
          <View className="flex-row items-center mb-1">
            {order.order_type === 'rental' ? (
              <Package size={16} color="#6B7280" />
            ) : (
              <ShoppingBag size={16} color="#6B7280" />
            )}
            <Text className="text-gray-700 ml-2">
              {order.order_type === 'rental' ? 'Rental' : 'Sale'} Order
            </Text>
          </View>

          {order.order_type === 'rental' && (
            <View className="flex-row items-center mb-2">
              <Calendar size={16} color="#6B7280" />
              <Text className="text-gray-700 ml-2">
                {startDate} - {endDate}
              </Text>
            </View>
          )}

          {order.order_type === 'rental' && order.status === 'Returned' && (
            <View className="flex-row items-center mb-2">
              <CheckCircle size={16} color="#10B981" />
              <Text className="text-green-700 ml-2">
                Returned on {returnDate}
              </Text>
            </View>
          )}

          {order.order_type === 'rental' && daysRemaining !== undefined && (
            <View className="bg-blue-50 p-2 rounded-lg">
              <Text className="text-blue-800">
                {daysRemaining} days remaining until return
              </Text>
            </View>
          )}

          {order.order_type === 'rental' && daysOverdue !== undefined && (
            <View className="bg-red-50 p-2 rounded-lg">
              <Text className="text-red-800">
                {daysOverdue} {daysOverdue === 1 ? "day" : "days"} overdue
              </Text>
            </View>
          )}

          <View className="flex-row items-center mt-2">
            <Text className="text-gray-700 font-medium">Payment Status: </Text>
            <Text className={getPaymentStatusColor(order.payment_status || 'Unpaid')}>
              {order.payment_status || 'Unpaid'}
            </Text>
          </View>
        </View>

        {/* Customer Information */}
        <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
          <Text className="text-lg font-semibold mb-3">
            Customer Information
          </Text>

          <View className="mb-2">
            <View className="flex-row items-center">
              <User size={16} color="#6B7280" />
              <Text className="text-gray-900 font-medium ml-2">
                {order.customer_name}
              </Text>
            </View>
          </View>

          {order.customer_email && (
            <View className="mb-2 flex-row items-center">
              <Mail size={14} color="#6B7280" />
              <Text className="text-gray-700 ml-2">
                {order.customer_email}
              </Text>
            </View>
          )}

          {order.customer_phone && (
            <View className="flex-row items-center">
              <Phone size={14} color="#6B7280" />
              <Text className="text-gray-700 ml-2">
                {order.customer_phone}
              </Text>
            </View>
          )}
        </View>

        {/* Order Items */}
        <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
          <Text className="text-lg font-semibold mb-3">
            {order.order_type === 'rental' ? 'Rented Items' : 'Purchased Items'}
          </Text>

          {orderItems.length === 0 ? (
            <Text className="text-gray-500 italic">No items found</Text>
          ) : (
            orderItems.map((item, index) => (
              <View
                key={index}
                className="flex-row justify-between items-center py-3 border-b border-gray-100"
              >
                <View className="flex-row items-center">
                  {order.order_type === 'rental' ? (
                    <Package size={16} color="#6B7280" />
                  ) : (
                    <ShoppingBag size={16} color="#6B7280" />
                  )}
                  <View className="ml-2">
                    <Text className="text-gray-900">{item.product_name}</Text>
                    <Text className="text-gray-500 text-sm">
                      Qty: {item.quantity} × ₹{item.unit_price}/
                      {order.order_type === 'rental' ? 'day' : 'item'}
                    </Text>
                  </View>
                </View>
                <Text className="font-medium">
                  ₹{item.quantity * item.unit_price * 
                    (order.order_type === 'rental' && order.start_date && order.end_date
                      ? Math.max(1, Math.ceil((new Date(order.end_date).getTime() - new Date(order.start_date).getTime()) / (1000 * 60 * 60 * 24)))
                      : 1)
                  }
                </Text>
              </View>
            ))
          )}

          <View className="mt-4 pt-3 border-t border-gray-200">
            {order.subtotal && (
              <View className="flex-row justify-between mb-1">
                <Text className="text-gray-600">Subtotal</Text>
                <Text className="text-gray-800">₹{order.subtotal.toFixed(2)}</Text>
              </View>
            )}
            
            {order.discount_value && order.discount_value > 0 && (
              <View className="flex-row justify-between mb-1">
                <Text className="text-gray-600">Discount</Text>
                <Text className="text-red-500">-₹{order.discount_value.toFixed(2)}</Text>
              </View>
            )}
            
            <View className="flex-row justify-between mt-2 pt-2 border-t border-gray-200">
              <Text className="font-semibold">Total</Text>
              <Text className="font-bold">₹{order.total_amount.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Invoice Information */}
        {order.invoice_id && (
          <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
            <Text className="text-lg font-semibold mb-3">
              Invoice Information
            </Text>

            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-700">Invoice Number</Text>
              <Text className="font-medium">#{order.invoice_id.substring(0, 8)}</Text>
            </View>

            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-gray-700">Payment Status</Text>
              <Text
                className={`font-medium ${getPaymentStatusColor(order.payment_status || 'Unpaid')}`}
              >
                {order.payment_status || 'Unpaid'}
              </Text>
            </View>

            {/* Invoice Actions */}
            <View className="mt-3 space-y-2">
              <TouchableOpacity
                className="bg-blue-50 py-2 px-4 rounded-lg flex-row items-center"
                onPress={() => {
                  router.push(`/finances/invoice-details?id=${order.invoice_id}`);
                }}
              >
                <FileText size={16} color="#3B82F6" />
                <Text className="text-blue-600 font-medium ml-2">
                  View Invoice
                </Text>
              </TouchableOpacity>
              
              {(order.payment_status === 'Unpaid' || !order.payment_status) && (
                <TouchableOpacity
                  className="bg-green-50 py-2 px-4 rounded-lg flex-row items-center"
                  onPress={() => {
                    router.push({
                      pathname: "/finances/record-payment",
                      params: { 
                        invoiceId: order.invoice_id,
                        fromOrderView: 'true',
                        orderId: order.id
                      }
                    });
                  }}
                >
                  <DollarSign size={16} color="#10B981" />
                  <Text className="text-green-600 font-medium ml-2">
                    Record Payment
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                className="bg-blue-50 py-2 px-4 rounded-lg flex-row items-center"
                onPress={() => {
                  console.log(`Emailing invoice to ${order.customer_email}`);
                  Alert.alert("Email Invoice", "This feature is coming soon!");
                }}
              >
                <Send size={16} color="#3B82F6" />
                <Text className="text-blue-600 font-medium ml-2">
                  Email Invoice
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Notes */}
        {order.notes && (
          <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
            <Text className="text-lg font-semibold mb-2">Notes</Text>
            <Text className="text-gray-700">{order.notes}</Text>
          </View>
        )}

        {/* Action Buttons - Vertical Stack Layout */}
        <View className="space-y-2 mb-4">
          {order.order_type === 'rental' && order.status === 'Active' && (
            <TouchableOpacity
              className="bg-green-500 py-3 rounded-lg flex-row justify-center items-center"
              onPress={handleMarkAsReturned}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <CheckCircle size={18} color="#FFFFFF" />
                  <Text className="text-white font-medium ml-2">
                    Mark as Returned
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="bg-blue-500 py-3 rounded-lg flex-row justify-center items-center"
            onPress={() => {
              Alert.alert("Download Details", "This feature is coming soon!");
            }}
          >
            <Download size={18} color="#FFFFFF" />
            <Text className="text-white font-medium ml-2">
              Download Details
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

