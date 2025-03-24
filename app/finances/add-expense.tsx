import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, Save, Calendar, CreditCard, Type, DollarSign } from "lucide-react-native";
import { createTransaction } from "../../services/transactionService";

export default function AddTransactionScreen() {
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    transaction_date: new Date().toISOString().split('T')[0],
    category: "",
    notes: "",
    payment_method: "",
    type: "expense" as "income" | "expense",
    reference_id: "",
    reference_type: undefined as "order" | "invoice" | "refund" | "expense" | "salary" | undefined,
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      if (!formData.description || !formData.amount || !formData.category) {
        Alert.alert("Missing Fields", "Please fill in all required fields.");
        return;
      }

      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        reference_id: formData.reference_id.trim() === "" ? undefined : formData.reference_id,
        reference_type: formData.reference_type || undefined
      };

      const result = await createTransaction(transactionData);
      if (result) {
        console.log("Transaction saved successfully:", result);
        router.back();
      } else {
        Alert.alert("Error", "Failed to save transaction. Please try again.");
      }
    } catch (error) {
      console.error("Error saving transaction:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    }
  };

  // Common categories for expenses and income
  const expenseCategories = [
    "Equipment",
    "Salary",
    "Rent",
    "Utilities",
    "Marketing",
    "Insurance",
    "Maintenance",
    "Travel",
    "Office Supplies",
    "Other",
  ];

  const incomeCategories = [
    "Sales",
    "Services",
    "Rental",
    "Commission",
    "Investment",
    "Refund",
    "Other Income",
  ];

  const paymentMethods = [
    "Cash",
    "Credit Card",
    "Bank Transfer",
    "UPI",
    "PayPal",
    "Check",
    "Other",
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="bg-white px-4 py-4 flex-row justify-between items-center shadow-sm">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ArrowLeft size={24} color="#4B5563" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Add Transaction</Text>
          <TouchableOpacity
            onPress={handleSave}
            className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center"
          >
            <Save size={18} color="#FFFFFF" />
            <Text className="text-white font-medium ml-1">Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1 px-4 pt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
          {/* Transaction Type */}
          <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
            <Text className="text-lg font-semibold mb-4">Transaction Type</Text>
            <View className="flex-row mb-4">
              <TouchableOpacity
                className={`flex-1 py-3 rounded-lg flex-row justify-center items-center mr-2 ${
                  formData.type === "income" ? "bg-green-500" : "bg-gray-200"
                }`}
                onPress={() => handleChange("type", "income")}
              >
                <DollarSign size={20} color={formData.type === "income" ? "#FFFFFF" : "#4B5563"} />
                <Text
                  className={`font-medium ml-2 ${
                    formData.type === "income" ? "text-white" : "text-gray-700"
                  }`}
                >
                  Income
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 rounded-lg flex-row justify-center items-center ml-2 ${
                  formData.type === "expense" ? "bg-rose-500" : "bg-gray-200"
                }`}
                onPress={() => handleChange("type", "expense")}
              >
                <CreditCard size={20} color={formData.type === "expense" ? "#FFFFFF" : "#4B5563"} />
                <Text
                  className={`font-medium ml-2 ${
                    formData.type === "expense" ? "text-white" : "text-gray-700"
                  }`}
                >
                  Expense
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Transaction Details */}
          <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
            <Text className="text-lg font-semibold mb-4">Transaction Details</Text>

            <View className="mb-4">
              <Text className="text-gray-700 mb-1">Description *</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                placeholder="Enter description"
                value={formData.description}
                onChangeText={(text) => handleChange("description", text)}
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-1">Amount (₹) *</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                placeholder="Enter amount"
                keyboardType="numeric"
                value={formData.amount}
                onChangeText={(text) => handleChange("amount", text)}
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-1">Date *</Text>
              <View className="flex-row items-center">
                <TextInput
                  className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex-1"
                  placeholder="YYYY-MM-DD"
                  value={formData.transaction_date}
                  onChangeText={(text) => handleChange("transaction_date", text)}
                />
                <TouchableOpacity className="ml-2 p-3 bg-gray-200 rounded-lg">
                  <Calendar size={20} color="#4B5563" />
                </TouchableOpacity>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-1">Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                <View className="flex-row">
                  {(formData.type === "expense" ? expenseCategories : incomeCategories).map((category) => (
                    <TouchableOpacity
                      key={category}
                      className={`mr-2 mb-2 px-3 py-2 rounded-lg ${
                        formData.category === category 
                          ? formData.type === "income" 
                            ? "bg-green-100 border border-green-300" 
                            : "bg-rose-100 border border-rose-300"
                          : "bg-gray-50 border border-gray-200"
                      }`}
                      onPress={() => handleChange("category", category)}
                    >
                      <Text
                        className={`${
                          formData.category === category 
                            ? formData.type === "income" 
                              ? "text-green-800" 
                              : "text-rose-800" 
                            : "text-gray-700"
                        }`}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>

          {/* Payment Details */}
          <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
            <Text className="text-lg font-semibold mb-4">Payment Details</Text>

            <View className="mb-4">
              <Text className="text-gray-700 mb-1">Payment Method</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                <View className="flex-row">
                  {paymentMethods.map((method) => (
                    <TouchableOpacity
                      key={method}
                      className={`mr-2 mb-2 px-3 py-2 rounded-lg ${
                        formData.payment_method === method ? "bg-blue-100 border border-blue-300" : "bg-gray-50 border border-gray-200"
                      }`}
                      onPress={() => handleChange("payment_method", method)}
                    >
                      <Text
                        className={`${
                          formData.payment_method === method ? "text-blue-800" : "text-gray-700"
                        }`}
                      >
                        {method}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-1">Reference ID (Optional)</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                placeholder="Reference ID (order, invoice, etc.)"
                value={formData.reference_id}
                onChangeText={(text) => handleChange("reference_id", text)}
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-1">Reference Type (Optional)</Text>
              <View className="flex-row flex-wrap">
                {(["order", "invoice", "refund", "expense", "salary"] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    className={`mr-2 mb-2 px-3 py-2 rounded-lg ${
                      formData.reference_type === type ? "bg-purple-100 border border-purple-300" : "bg-gray-50 border border-gray-200"
                    }`}
                    onPress={() => handleChange("reference_type", type)}
                  >
                    <Text
                      className={`${
                        formData.reference_type === type ? "text-purple-800" : "text-gray-700"
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Additional Notes */}
          <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
            <Text className="text-lg font-semibold mb-4">Additional Notes</Text>

            <View className="mb-4">
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                placeholder="Enter any additional notes"
                multiline
                numberOfLines={4}
                value={formData.notes}
                onChangeText={(text) => handleChange("notes", text)}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
