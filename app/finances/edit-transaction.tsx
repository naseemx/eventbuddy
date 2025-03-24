import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeft, Calendar } from "lucide-react-native";
import PageTransition from "../../components/animations/PageTransition";

import Header from "../../components/Header";
import CustomDatePicker from "../../components/CustomDatePicker";
import { 
  getTransactionById, 
  updateTransaction, 
  Transaction 
} from "../../services/transactionService";

export default function EditTransactionScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [transactionDate, setTransactionDate] = useState<Date>(new Date());
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');

  // Available categories
  const incomeCategories = [
    "sales_revenue", 
    "rental_payment", 
    "service_fee", 
    "deposit_payment",
    "other_income"
  ];
  
  const expenseCategories = [
    "purchase", 
    "salary", 
    "rent", 
    "utilities", 
    "maintenance", 
    "marketing", 
    "transportation", 
    "office_supplies",
    "other_expense"
  ];

  // Payment methods
  const paymentMethods = ["cash", "card", "bank_transfer", "upi", "cheque", "other"];

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
          
          // Initialize form states with transaction data
          setAmount(data.amount || 0);
          setDescription(data.description || "");
          setCategory(data.category || "");
          setPaymentMethod(data.payment_method || "cash");
          setTransactionType(data.type || "income");
          
          // Handle transaction date
          if (data.transaction_date) {
            setTransactionDate(new Date(data.transaction_date));
          }
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

  const validateForm = () => {
    if (amount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return false;
    }
    
    if (!category) {
      Alert.alert("Error", "Please select a category");
      return false;
    }
    
    return true;
  };

  const handleSaveTransaction = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    
    try {
      const formattedDate = transactionDate.toISOString();
      
      const updates = {
        amount,
        description,
        category,
        payment_method: paymentMethod,
        transaction_date: formattedDate,
        type: transactionType,
        updated_at: new Date().toISOString()
      };
      
      const result = await updateTransaction(id as string, updates);
      
      if (result) {
        Alert.alert(
          "Success",
          "Transaction updated successfully",
          [{ text: "OK", onPress: () => router.back() }]
        );
      } else {
        Alert.alert("Error", "Failed to update transaction. Please try again.");
      }
    } catch (err) {
      console.error("Error updating transaction:", err);
      Alert.alert("Error", "An error occurred while updating the transaction");
    } finally {
      setIsSaving(false);
    }
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
          title="Edit Transaction"
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

  const availableCategories = transactionType === 'income' ? incomeCategories : expenseCategories;

  return (
    <PageTransition type="slide">
      <SafeAreaView className="flex-1 bg-gray-100">
        <Header
          title="Edit Transaction"
          leftIcon={<ArrowLeft size={24} color="#000" />}
          onLeftPress={() => router.back()}
        />

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
        >
          {/* Transaction Type */}
          <View className="bg-white p-4 rounded-xl shadow-sm mb-4">
            <Text className="text-lg font-bold mb-3 text-gray-900">
              Transaction Type
            </Text>
            <View className="flex-row">
              <TouchableOpacity
                className={`flex-1 py-3 rounded-l-lg ${
                  transactionType === 'income'
                    ? 'bg-green-500'
                    : 'bg-gray-200'
                }`}
                onPress={() => {
                  setTransactionType('income');
                  setCategory(''); // Reset category when changing type
                }}
              >
                <Text
                  className={`text-center font-medium ${
                    transactionType === 'income' ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  Income
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 rounded-r-lg ${
                  transactionType === 'expense'
                    ? 'bg-red-500'
                    : 'bg-gray-200'
                }`}
                onPress={() => {
                  setTransactionType('expense');
                  setCategory(''); // Reset category when changing type
                }}
              >
                <Text
                  className={`text-center font-medium ${
                    transactionType === 'expense' ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  Expense
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Transaction Details */}
          <View className="bg-white p-4 rounded-xl shadow-sm mb-4">
            <Text className="text-lg font-bold mb-3 text-gray-900">
              Transaction Details
            </Text>
            
            <View className="mb-3">
              <Text className="text-gray-600 mb-1">Amount*</Text>
              <TextInput
                className="border border-gray-300 p-2 rounded-lg"
                value={amount.toString()}
                onChangeText={(text) => setAmount(parseFloat(text) || 0)}
                keyboardType="numeric"
                placeholder="0.00"
              />
            </View>
            
            <View className="mb-3">
              <Text className="text-gray-600 mb-1">Description</Text>
              <TextInput
                className="border border-gray-300 p-2 rounded-lg"
                value={description}
                onChangeText={setDescription}
                placeholder="Transaction description"
              />
            </View>
            
            <View className="mb-3">
              <CustomDatePicker
                label="Transaction Date"
                required={true}
                date={transactionDate}
                onDateChange={setTransactionDate}
              />
            </View>
          </View>

          {/* Category */}
          <View className="bg-white p-4 rounded-xl shadow-sm mb-4">
            <Text className="text-lg font-bold mb-3 text-gray-900">
              Category*
            </Text>
            <View className="flex-row flex-wrap">
              {availableCategories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  className={`mr-2 mb-2 px-3 py-2 rounded-lg ${
                    category === cat
                      ? transactionType === 'income'
                        ? 'bg-green-500'
                        : 'bg-red-500'
                      : 'bg-gray-200'
                  }`}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    className={`${
                      category === cat
                        ? 'text-white'
                        : 'text-gray-800'
                    }`}
                  >
                    {cat.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Payment Method */}
          <View className="bg-white p-4 rounded-xl shadow-sm mb-6">
            <Text className="text-lg font-bold mb-3 text-gray-900">
              Payment Method
            </Text>
            <View className="flex-row flex-wrap">
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method}
                  className={`mr-2 mb-2 px-3 py-2 rounded-lg ${
                    paymentMethod === method
                      ? 'bg-blue-500'
                      : 'bg-gray-200'
                  }`}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Text
                    className={`${
                      paymentMethod === method
                        ? 'text-white'
                        : 'text-gray-800'
                    }`}
                  >
                    {method.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            className="bg-gradient-to-r from-blue-500 to-indigo-600 py-3 rounded-xl mb-6"
            onPress={handleSaveTransaction}
            disabled={isSaving}
          >
            <Text className="text-white text-center font-bold text-lg">
              {isSaving ? "Saving..." : "Save Transaction"}
            </Text>
            {isSaving && (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
                style={{ marginTop: 4 }}
              />
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </PageTransition>
  );
} 