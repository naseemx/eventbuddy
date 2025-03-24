import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import PageTransition from "../../components/animations/PageTransition";
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  Send,
  Download,
  DollarSign,
  Edit,
  Printer,
} from "lucide-react-native";

import Header from "../../components/Header";
import { getInvoiceById } from "../../services/orderService";
import { Invoice } from "../../types";

export default function InvoiceDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { id, refresh } = useLocalSearchParams<{ id: string, refresh?: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Effect to handle refresh parameter
  useEffect(() => {
    if (refresh === 'true') {
      // Trigger a refresh by updating the refreshKey
      setRefreshKey(prev => prev + 1);
      
      // Clear the refresh parameter from the URL to prevent infinite refreshes
      router.setParams({ refresh: undefined });
    }
  }, [refresh]);

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      if (!id) {
        setError("Invoice ID is missing");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await getInvoiceById(id);
        if (data) {
          setInvoice(data);
          setError(null);
        } else {
          setError("Invoice not found");
        }
      } catch (err) {
        console.error("Error fetching invoice:", err);
        setError("Failed to load invoice details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoiceDetails();
  }, [id, refreshKey]);

  const handleEditInvoice = () => {
    router.push(`/finances/edit-invoice?id=${id}`);
  };

  const handleSendInvoice = () => {
    // In a real app, you would send the invoice via email
    console.log("Sending invoice", id);
  };

  const handleDownloadInvoice = () => {
    // In a real app, you would download or generate a PDF
    console.log("Downloading invoice", id);
  };

  const handlePrintInvoice = () => {
    // In a real app, you would print the invoice
    console.log("Printing invoice", id);
  };

  const handleRecordPayment = () => {
    router.push({
      pathname: "/finances/record-payment",
      params: { invoiceId: id }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
      case "unpaid":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </SafeAreaView>
    );
  }

  if (error || !invoice) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <Header
          title="Invoice Details"
          leftIcon={<ArrowLeft size={24} color="#000" />}
          onLeftPress={() => router.back()}
        />
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-red-500 mb-4">{error || "Invoice not found"}</Text>
          <TouchableOpacity
            className="bg-blue-500 px-4 py-2 rounded-lg"
            onPress={() => router.back()}
          >
            <Text className="text-white font-medium">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Parse items if it's a string
  const invoiceItems = typeof invoice.items === 'string' 
    ? JSON.parse(invoice.items) 
    : invoice.items || [];

  return (
    <PageTransition type="slide">
      <SafeAreaView className="flex-1 bg-gray-100">
        <Header
          title="Invoice Details"
          leftIcon={<ArrowLeft size={24} color="#000" />}
          onLeftPress={() => router.back()}
        />

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom }}
        >
          {/* Invoice Header */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-900">
                  {invoice.invoice_number}
                </Text>
                <View className="flex-row items-center mt-2">
                  <Calendar size={16} color="#6B7280" />
                  <Text className="text-gray-600 ml-2">
                    Issued: {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
                <View className="flex-row items-center mt-1">
                  <Calendar size={16} color="#6B7280" />
                  <Text className="text-gray-600 ml-2">
                    Due: {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
              </View>
              <View
                className={`px-3 py-1.5 rounded-full ${getStatusColor(invoice.status)}`}
              >
                <Text className="text-xs font-medium">{invoice.status}</Text>
              </View>
            </View>

            <View className="flex-row justify-between mt-2">
              <TouchableOpacity
                className="flex-row items-center bg-blue-50 px-4 py-2.5 rounded-xl"
                onPress={handleEditInvoice}
              >
                <Edit size={16} color="#3B82F6" />
                <Text className="text-blue-600 font-medium ml-2">Edit</Text>
              </TouchableOpacity>
              {invoice.status.toLowerCase() !== "paid" && (
                <TouchableOpacity
                  className="flex-row items-center bg-green-50 px-4 py-2.5 rounded-xl"
                  onPress={handleRecordPayment}
                >
                  <DollarSign size={16} color="#10B981" />
                  <Text className="text-green-600 font-medium ml-2">
                    Record Payment
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row justify-between mb-5">
            <TouchableOpacity
              className="flex-1 bg-indigo-500 py-3 rounded-lg flex-row items-center justify-center mr-1"
              onPress={handleSendInvoice}
            >
              <Send size={16} color="#FFFFFF" />
              <Text className="text-white font-medium ml-2">Send</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-indigo-500 py-3 rounded-lg flex-row items-center justify-center mx-1"
              onPress={handleDownloadInvoice}
            >
              <Download size={16} color="#FFFFFF" />
              <Text className="text-white font-medium ml-2">Download</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-indigo-500 py-3 rounded-lg flex-row items-center justify-center ml-1"
              onPress={handlePrintInvoice}
            >
              <Printer size={16} color="#FFFFFF" />
              <Text className="text-white font-medium ml-2">Print</Text>
            </TouchableOpacity>
          </View>

          {/* Customer Info */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-3 text-gray-900">
              Customer Information
            </Text>
            <TouchableOpacity
              className="flex-row items-center mb-2"
              onPress={() => router.push(`/customers/view?id=${invoice.customer_id || '1'}`)}
            >
              <User size={16} color="#3B82F6" />
              <Text className="text-blue-600 font-medium ml-2">
                {invoice.customer_name}
              </Text>
            </TouchableOpacity>
            {invoice.customer_email && (
              <Text className="text-gray-600 mb-1">{invoice.customer_email}</Text>
            )}
            {invoice.customer_phone && (
              <Text className="text-gray-600">{invoice.customer_phone}</Text>
            )}
          </View>

          {/* Invoice Items */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-3 text-gray-900">
              Invoice Items
            </Text>
            {invoiceItems.length > 0 ? (
              invoiceItems.map((item: any, index: number) => (
                <View
                  key={item.id || index}
                  className="flex-row justify-between items-center p-3 mb-2 bg-gray-50 rounded-lg"
                >
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">
                      {item.description || item.name}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      {item.quantity} x ₹{item.unit_price || item.unitPrice}
                    </Text>
                  </View>
                  <Text className="font-semibold text-gray-900">
                    ₹{Number(item.total || (item.quantity * (item.unit_price || item.unitPrice))).toLocaleString()}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-gray-500 italic">No items found</Text>
            )}
          </View>

          {/* Payment Summary */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-3 text-gray-900">
              Payment Summary
            </Text>
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-600">Subtotal</Text>
              <Text className="font-medium">₹{invoice.subtotal?.toLocaleString() || '0.00'}</Text>
            </View>
            {invoice.tax_amount && invoice.tax_amount > 0 && (
              <View className="flex-row justify-between mb-1">
                <Text className="text-gray-600">Tax ({invoice.tax_rate || 0}%)</Text>
                <Text className="font-medium">₹{invoice.tax_amount.toLocaleString()}</Text>
              </View>
            )}
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-600">Discount</Text>
              <Text className="font-medium">₹{invoice.discount_amount?.toLocaleString() || '0.00'}</Text>
            </View>
            <View className="h-[1px] bg-gray-200 my-2" />
            <View className="flex-row justify-between">
              <Text className="font-bold">Total</Text>
              <Text className="font-bold text-lg">₹{invoice.total_amount?.toLocaleString() || '0.00'}</Text>
            </View>
          </View>

          {/* Invoice Notes */}
          {invoice.notes && (
            <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
              <Text className="text-lg font-bold mb-2 text-gray-900">Notes</Text>
              <Text className="text-gray-600">{invoice.notes}</Text>
            </View>
          )}

          {/* Related Order */}
          {invoice.order_id && (
            <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
              <Text className="text-lg font-bold mb-2 text-gray-900">Related Order</Text>
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => router.push(`/orders/view?id=${invoice.order_id}` as any)}
              >
                <FileText size={16} color="#3B82F6" />
                <Text className="text-blue-600 font-medium ml-2">
                  View Order #{invoice.order_id.substring(0, 8)}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </PageTransition>
  );
}
