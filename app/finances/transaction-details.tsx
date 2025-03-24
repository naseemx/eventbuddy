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
  Tag,
  FileText,
  User,
  Edit,
  Trash2,
  Download,
  TrendingUp,
  TrendingDown,
} from "lucide-react-native";

import Header from "../../components/Header";
import { getTransactionById, deleteTransaction, Transaction } from "../../services/transactionService";
import { formatDate } from "../../utils/dateUtils";

export default function TransactionDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactionDetails = async () => {
      if (!id) {
        setError("Transaction ID is missing");
        setIsLoading(false);
        return;
      }

      try {
        const data = await getTransactionById(id);
        if (data) {
          setTransaction(data);
        } else {
          setError("Transaction not found");
        }
      } catch (err) {
        console.error("Error fetching transaction:", err);
        setError("Failed to load transaction details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactionDetails();
  }, [id]);

  const handleEditTransaction = () => {
    router.push(`/finances/edit-transaction?id=${id}`);
  };

  const handleDeleteTransaction = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const success = await deleteTransaction(id);
      if (success) {
        router.back();
      } else {
        setError("Failed to delete transaction");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Error deleting transaction:", err);
      setError("An error occurred while deleting the transaction");
      setIsLoading(false);
    }
  };

  const handleDownloadReceipt = () => {
    // In a real app, you would download or generate a receipt
    console.log("Downloading receipt for transaction", id);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </SafeAreaView>
    );
  }

  if (error || !transaction) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <Header
          title="Transaction Details"
          leftIcon={<ArrowLeft size={24} color="#000" />}
          onLeftPress={() => router.back()}
        />
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-red-500 mb-4">{error || "Transaction not found"}</Text>
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

  return (
    <PageTransition type="slide">
      <SafeAreaView className="flex-1 bg-gray-100">
        <Header
          title="Transaction Details"
          leftIcon={<ArrowLeft size={24} color="#000" />}
          onLeftPress={() => router.back()}
        />

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom }}
        >
          {/* Transaction Info Card */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-900">
                  {transaction.description || "No description"}
                </Text>
                <View className="flex-row items-center mt-2">
                  <Calendar size={16} color="#6B7280" />
                  <Text className="text-gray-600 ml-2">
                    {transaction.transaction_date ? new Date(transaction.transaction_date).toLocaleDateString() : 'No date'}
                  </Text>
                </View>
                <View className="flex-row items-center mt-2">
                  <Tag size={16} color="#6B7280" />
                  <Text className="text-gray-600 ml-2">
                    {transaction.category || "Uncategorized"}
                  </Text>
                </View>
              </View>
              <View
                className={`h-12 w-12 rounded-full items-center justify-center ${transaction.type === "income" ? "bg-green-100" : "bg-red-100"}`}
              >
                {transaction.type === "income" ? (
                  <TrendingUp size={24} color="#10B981" />
                ) : (
                  <TrendingDown size={24} color="#EF4444" />
                )}
              </View>
            </View>

            <View
              className={`p-4 rounded-lg mb-4 ${transaction.type === "income" ? "bg-green-50" : "bg-red-50"}`}
            >
              <Text
                className={`text-center text-2xl font-bold ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}
              >
                {transaction.type === "income" ? "+" : "-"}₹
                {Number(transaction.amount).toLocaleString()}
              </Text>
            </View>

            <View className="flex-row justify-between mt-2">
              <TouchableOpacity
                className="flex-row items-center bg-blue-50 px-4 py-2.5 rounded-xl"
                onPress={handleEditTransaction}
              >
                <Edit size={16} color="#3B82F6" />
                <Text className="text-blue-600 font-medium ml-2">Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-row items-center bg-red-50 px-4 py-2.5 rounded-xl"
                onPress={handleDeleteTransaction}
              >
                <Trash2 size={16} color="#EF4444" />
                <Text className="text-red-600 font-medium ml-2">Delete</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Download Receipt Button */}
          <TouchableOpacity
            className="bg-indigo-500 py-3 rounded-lg flex-row items-center justify-center mb-5"
            onPress={handleDownloadReceipt}
          >
            <Download size={18} color="#FFFFFF" />
            <Text className="text-white font-medium ml-2">
              Download Receipt
            </Text>
          </TouchableOpacity>

          {/* Transaction Details */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-3 text-gray-900">
              Transaction Details
            </Text>

            <View className="mb-3 pb-3 border-b border-gray-100">
              <Text className="text-gray-500 text-sm">Transaction ID</Text>
              <Text className="font-medium text-gray-800">
                {transaction.id}
              </Text>
            </View>

            <View className="mb-3 pb-3 border-b border-gray-100">
              <Text className="text-gray-500 text-sm">Type</Text>
              <Text className="font-medium text-gray-800 capitalize">
                {transaction.type}
              </Text>
            </View>

            {transaction.payment_method && (
              <View className="mb-3 pb-3 border-b border-gray-100">
                <Text className="text-gray-500 text-sm">Payment Method</Text>
                <Text className="font-medium text-gray-800">
                  {transaction.payment_method}
                </Text>
              </View>
            )}

            {transaction.reference_id && transaction.reference_type && (
              <View className="mb-3 pb-3 border-b border-gray-100">
                <Text className="text-gray-500 text-sm">Reference</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (transaction.reference_type === 'order') {
                      router.push(`/orders/view?id=${transaction.reference_id}` as any);
                    } else if (transaction.reference_type === 'invoice') {
                      router.push(`/finances/invoice-details?id=${transaction.reference_id}` as any);
                    }
                  }}
                >
                  <Text className="font-medium text-blue-600">
                    {transaction.reference_type.charAt(0).toUpperCase() + transaction.reference_type.slice(1)} #{transaction.reference_id.substring(0, 8)}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {transaction.created_at && (
              <View className="mb-3 pb-3 border-b border-gray-100">
                <Text className="text-gray-500 text-sm">Created At</Text>
                <Text className="font-medium text-gray-800">
                  {new Date(transaction.created_at).toLocaleString()}
                </Text>
              </View>
            )}

            {transaction.updated_at && (
              <View className="mb-3 pb-3 border-b border-gray-100">
                <Text className="text-gray-500 text-sm">Last Updated</Text>
                <Text className="font-medium text-gray-800">
                  {new Date(transaction.updated_at).toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </PageTransition>
  );
}
