import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  Calendar,
  CreditCard,
  BarChart2,
  PieChart,
  FileSpreadsheet,
  User,
} from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";

import Header from "../../components/Header";
import BottomNavigation from "../../components/navigation/BottomNavigation";
import { getTransactions, Transaction } from "../../services/transactionService";
import { getInvoices } from "../../services/orderService";
import { Invoice } from "../../types";

export default function FinancesScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<
    "transactions" | "reports" | "invoices"
  >("transactions");
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Add state for tracking when to refresh data
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Use useFocusEffect to detect when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // This will execute when the screen is focused
      fetchData();
      
      return () => {
        // This will execute when the screen is unfocused
      };
    }, [refreshTrigger, activeTab]) // Dependencies for the callback
  );

  // Fetch data from Supabase
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (activeTab === "transactions") {
          const fetchedTransactions = await getTransactions();
          setTransactions(fetchedTransactions);
          setError(null);
        } else if (activeTab === "invoices") {
        const fetchedInvoices = await getInvoices();
        setInvoices(fetchedInvoices);
          setError(null);
        }
      } catch (err) {
        console.error(`Error fetching ${activeTab}:`, err);
        setError(`Failed to load ${activeTab}`);
        if (activeTab === "transactions") {
          setTransactions([]);
      } else if (activeTab === "invoices") {
        setInvoices([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    return (
      <TouchableOpacity
        className="bg-white p-4 rounded-lg mb-3 shadow-sm border border-gray-100"
        onPress={() =>
          router.push(`/finances/transaction-details?id=${item.id}` as any)
        }
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <View
              className={`w-10 h-10 rounded-full items-center justify-center ${
                item.type === "income" ? "bg-green-100" : "bg-red-100"
              }`}
            >
              {item.type === "income" ? (
                <TrendingUp size={20} color="#10B981" />
              ) : (
                <TrendingDown size={20} color="#EF4444" />
              )}
            </View>
            <View className="ml-3">
              <Text className="font-semibold text-gray-900">
                {item.description}
              </Text>
              <View className="flex-row items-center">
                <Text className="text-gray-500 text-sm">
                  {item.transaction_date
                    ? new Date(item.transaction_date).toLocaleDateString()
                    : "No date"}{" "}
                  • {item.category || "Uncategorized"}
                </Text>
              </View>
            </View>
          </View>
          <Text
            className={`font-bold ${
              item.type === "income" ? "text-green-600" : "text-red-600"
            }`}
          >
            {item.type === "income" ? "+" : "-"}₹{item.amount}
          </Text>
        </View>
        <View className="flex-row mt-2 justify-between">
        {item.payment_method && (
            <View className="bg-gray-50 p-1.5 px-3 rounded-md self-start">
            <Text className="text-xs text-gray-600">
              Paid via {item.payment_method}
            </Text>
          </View>
        )}
          {item.reference_id && item.reference_type && (
            <TouchableOpacity
              className="bg-blue-50 p-1.5 px-3 rounded-md self-start"
              onPress={() => {
                if (item.reference_type === "order") {
                  router.push(`/orders/view?id=${item.reference_id}` as any);
                } else if (item.reference_type === "invoice") {
                  router.push(
                    `/finances/invoice-details?id=${item.reference_id}` as any
                  );
                }
              }}
            >
              <Text className="text-xs text-blue-600">
                {item.reference_type === "order"
                  ? "View Order"
                  : item.reference_type === "invoice"
                  ? "View Invoice"
                  : "View Reference"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderInvoiceItem = ({ item }: { item: Invoice }) => {
    const getStatusColor = (status: string) => {
      switch (status?.toLowerCase()) {
        case "paid":
          return "bg-green-100 text-green-700";
        case "pending":
        case "unpaid":
          return "bg-yellow-100 text-yellow-700";
        case "overdue":
          return "bg-red-100 text-red-700";
        default:
          return "bg-gray-100 text-gray-700";
      }
    };

    const statusColors = getStatusColor(item.status);

    return (
      <TouchableOpacity
        className="bg-white p-4 rounded-lg shadow-sm mb-3 border border-gray-100"
        onPress={() => router.push(`/finances/invoice-details?id=${item.id}` as any)}
      >
        <View className="flex-row justify-between items-start">
          <View>
            <Text className="font-medium text-gray-900">#{item.invoice_number}</Text>
            <Text className="text-gray-600 mb-1">{item.customer_name}</Text>
            <Text className="text-xs text-gray-500">
              Due: {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'No due date'}
            </Text>
          </View>
          <View className="items-end">
            <Text className="font-bold text-gray-900">₹{Number(item.total_amount).toLocaleString()}</Text>
            <View className={`${statusColors} rounded-full px-2 py-0.5 mt-1`}>
              <Text className={`text-xs font-medium ${statusColors}`}>
                {item.status}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Header title="Finances" />

      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <View className="flex-row space-x-2">
          <TouchableOpacity
            className={`flex-1 py-2 rounded-md ${
              activeTab === "transactions" ? "bg-blue-50" : "bg-gray-100"
            }`}
            onPress={() => setActiveTab("transactions")}
          >
            <Text
              className={`text-center font-medium ${
                activeTab === "transactions" ? "text-blue-600" : "text-gray-600"
              }`}
            >
              Transactions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-2 rounded-md ${
              activeTab === "reports" ? "bg-blue-50" : "bg-gray-100"
            }`}
            onPress={() => setActiveTab("reports")}
          >
            <Text
              className={`text-center font-medium ${
                activeTab === "reports" ? "text-blue-600" : "text-gray-600"
              }`}
            >
              Reports
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-2 rounded-md ${
              activeTab === "invoices" ? "bg-blue-50" : "bg-gray-100"
            }`}
            onPress={() => setActiveTab("invoices")}
          >
            <Text
              className={`text-center font-medium ${
                activeTab === "invoices" ? "text-blue-600" : "text-gray-600"
              }`}
            >
              Invoices
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="p-4">
          {activeTab === "transactions" && (
            <>
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-semibold">
                  Recent Transactions
                </Text>
                <TouchableOpacity
                  className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center"
                  onPress={() => router.push("/finances/add-expense" as any)}
                >
                  <Plus size={16} color="#FFFFFF" />
                  <Text className="text-white font-medium ml-1">Add</Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row space-x-3 mb-4">
                <TouchableOpacity className="flex-1 bg-white border border-gray-200 rounded-lg p-2 flex-row justify-center items-center">
                  <Search size={18} color="#6B7280" />
                  <Text className="ml-2 text-gray-500">Search</Text>
                </TouchableOpacity>
                <TouchableOpacity className="bg-white border border-gray-200 rounded-lg p-2 flex-row justify-center items-center px-4">
                  <Filter size={18} color="#6B7280" />
                  <Text className="ml-2 text-gray-500">Filter</Text>
                </TouchableOpacity>
              </View>

              {isLoading ? (
                <View className="items-center justify-center py-8">
                  <ActivityIndicator size="large" color="#3B82F6" />
                </View>
              ) : error ? (
                <View className="items-center justify-center py-8">
                  <Text className="text-red-500">{error}</Text>
                </View>
              ) : transactions.length === 0 ? (
                <View className="items-center justify-center py-8">
                  <Text className="text-gray-500">
                    No transactions found
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={transactions}
                  renderItem={renderTransactionItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              )}
            </>
          )}

          {activeTab === "reports" && (
            <View className="mt-2">
              <Text className="text-lg font-semibold mb-3">Financial Reports</Text>

              <View className="flex-row flex-wrap">
                <TouchableOpacity
                  className="bg-white p-4 rounded-lg shadow-sm flex-row items-center mb-3 w-full"
                  onPress={() => router.push("/finances/reports/profit-loss" as any)}
                >
                  <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                    <BarChart2 size={20} color="#3B82F6" />
                  </View>
                  <View>
                    <Text className="font-medium text-gray-900">Profit & Loss</Text>
                    <Text className="text-gray-500 text-sm">
                      View your business performance
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-white p-4 rounded-lg shadow-sm flex-row items-center mb-3 w-full"
                  onPress={() => router.push("/finances/reports/revenue" as any)}
                >
                  <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
                    <PieChart size={20} color="#10B981" />
                  </View>
                  <View>
                    <Text className="font-medium text-gray-900">
                      Revenue Analysis
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      Analyze your income sources
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-white p-4 rounded-lg shadow-sm flex-row items-center mb-3 w-full"
                  onPress={() => router.push("/finances/reports/expenses" as any)}
                >
                  <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3">
                    <FileSpreadsheet size={20} color="#EF4444" />
                  </View>
                  <View>
                    <Text className="font-medium text-gray-900">Expense Report</Text>
                    <Text className="text-gray-500 text-sm">
                      Track your business expenses
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-white p-4 rounded-lg shadow-sm flex-row items-center w-full"
                  onPress={() => router.push("/finances/reports/tax" as any)}
                >
                  <View className="w-10 h-10 rounded-full bg-purple-100 items-center justify-center mr-3">
                    <DollarSign size={20} color="#8B5CF6" />
                  </View>
                  <View>
                    <Text className="font-medium text-gray-900">Tax Summary</Text>
                    <Text className="text-gray-500 text-sm">
                      Prepare for tax filing
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {activeTab === "invoices" && (
            <View className="mt-2">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-lg font-semibold">Recent Invoices</Text>
                <TouchableOpacity onPress={() => router.push("/invoices" as any)}>
                  <Text className="text-blue-500">View All</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                className="bg-blue-500 py-3 rounded-lg flex-row items-center justify-center mb-4"
                onPress={() => router.push("/invoices/create" as any)}
              >
                <Plus size={18} color="#FFFFFF" />
                <Text className="text-white font-medium ml-2">
                  Create New Invoice
                </Text>
              </TouchableOpacity>

              {isLoading && activeTab === "invoices" ? (
                <View className="items-center justify-center py-8">
                  <ActivityIndicator size="large" color="#3B82F6" />
                </View>
              ) : error && activeTab === "invoices" ? (
                <View className="items-center justify-center py-8">
                  <Text className="text-red-500">{error}</Text>
                </View>
              ) : invoices.length === 0 ? (
                <View className="items-center justify-center py-8">
                  <Text className="text-gray-500">No invoices found</Text>
                </View>
              ) : (
                <FlatList
                  data={invoices.slice(0, 3)} // Show only the first 3 invoices
                  renderItem={renderInvoiceItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0">
        <BottomNavigation activeTab="finances" />
      </View>
    </SafeAreaView>
  );
} 