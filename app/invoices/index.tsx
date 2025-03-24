import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  PlusCircle,
  Search,
  SlidersHorizontal,
  FileText,
  Download,
  User,
  Calendar,
  Banknote,
} from "lucide-react-native";

import Header from "../../components/Header";
import BottomNavigation from "../../components/navigation/BottomNavigation";
import { getInvoices } from "../../services/orderService";
import { Invoice } from "../../types";

export default function InvoicesScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real invoices from Supabase
  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true);
      try {
        const fetchedInvoices = await getInvoices();
        setInvoices(fetchedInvoices);
        setError(null);
      } catch (err) {
        console.error("Error fetching invoices:", err);
        setError("Failed to load invoices");
        setInvoices([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, []);

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

  const filteredInvoices = searchQuery
    ? invoices.filter(
        (invoice) =>
          invoice.invoice_number
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          invoice.customer_name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
      )
    : invoices;

  const renderInvoiceItem = ({ item }: { item: Invoice }) => {
    const statusColor = getStatusColor(item.status);

    return (
      <TouchableOpacity
        className="bg-white p-4 rounded-lg mb-3 shadow-sm border border-gray-100"
        onPress={() => router.push(`/finances/invoice-details?id=${item.id}`)}
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900">
              {item.invoice_number}
            </Text>
            <View className="flex-row items-center mt-1">
              <User size={14} color="#6B7280" />
              <Text className="text-gray-600 text-sm ml-1">
                {item.customer_name}
              </Text>
            </View>
            <View className="flex-row items-center mt-1">
              <Calendar size={14} color="#6B7280" />
              <Text className="text-gray-500 text-sm ml-1">
                Issued: {item.invoice_date ? new Date(item.invoice_date).toLocaleDateString() : 'N/A'} | 
                Due: {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
          </View>
          <View className="items-end">
            <View className={`px-2 py-1 rounded-full mb-2 ${statusColor}`}>
              <Text className="text-xs font-medium">{item.status}</Text>
            </View>
            <Text className="font-semibold">
              ₹{Number(item.total_amount || item.amount || 0).toLocaleString()}
            </Text>
            <Text className="text-xs text-gray-500">{item.order_id ? "Order" : "Manual"}</Text>
          </View>
        </View>
        <View className="flex-row justify-end mt-3 pt-2 border-t border-gray-100">
          <TouchableOpacity
            className="flex-row items-center mr-3"
            onPress={() =>
              router.push(`/finances/invoice-details?id=${item.id}`)
            }
          >
            <FileText size={14} color="#3B82F6" />
            <Text className="text-blue-600 text-sm ml-1">View</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => {
              console.log(`Downloading PDF for invoice ${item.id}`);
              // In a real app, you would generate and download a PDF
              alert(`Invoice #${item.invoice_number} PDF is being generated`);
            }}
          >
            <Download size={14} color="#10B981" />
            <Text className="text-green-600 text-sm ml-1">Download PDF</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Header title="Invoices" />

      <View className="flex-1 px-4 pt-4">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row flex-1 mr-3">
            <View className="flex-1 bg-white rounded-xl shadow-sm flex-row items-center px-3">
              <Search size={18} color="#6366f1" strokeWidth={2} />
              <TextInput
                className="flex-1 py-2.5 px-2"
                placeholder="Search invoices..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Text className="text-gray-400 font-medium">✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity className="bg-white p-2.5 rounded-xl shadow-sm ml-2">
              <SlidersHorizontal size={20} color="#6366f1" strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 rounded-xl flex-row items-center shadow-md"
            onPress={() => router.push("/invoices/create")}
          >
            <PlusCircle size={18} color="#FFFFFF" />
            <Text className="text-white font-medium ml-2">Create Invoice</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between mb-5">
          <View className="bg-white p-3.5 rounded-xl flex-1 mr-2 items-center shadow-sm">
            <Text className="text-gray-600 text-sm font-medium">Total</Text>
            <Text className="text-lg font-bold text-gray-900">₹10,100</Text>
          </View>
          <View className="bg-white p-3.5 rounded-xl flex-1 mr-2 items-center shadow-sm">
            <Text className="text-gray-600 text-sm font-medium">Paid</Text>
            <Text className="text-lg font-bold text-emerald-600">₹3,350</Text>
          </View>
          <View className="bg-white p-3.5 rounded-xl flex-1 items-center shadow-sm">
            <Text className="text-gray-600 text-sm font-medium">Pending</Text>
            <Text className="text-lg font-bold text-amber-600">₹6,750</Text>
          </View>
        </View>

        <FlatList
          data={filteredInvoices}
          renderItem={renderInvoiceItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
          ListEmptyComponent={
            isLoading ? (
              <View className="py-10 items-center">
                <ActivityIndicator size="large" color="#6366f1" />
                <Text className="text-gray-500 mt-3">Loading invoices...</Text>
              </View>
            ) : error ? (
              <View className="py-10 items-center">
                <Text className="text-red-500">{error}</Text>
              </View>
            ) : (
              <View className="py-10 items-center">
                <Text className="text-gray-500">No invoices found</Text>
              </View>
            )
          }
        />
      </View>

      <View className="absolute bottom-0 left-0 right-0">
        <BottomNavigation activeTab="finances" />
      </View>
    </SafeAreaView>
  );
}
