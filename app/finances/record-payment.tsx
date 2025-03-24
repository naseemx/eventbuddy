import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import PageTransition from "../../components/animations/PageTransition";

import Header from "../../components/Header";
import CustomDatePicker from "../../components/CustomDatePicker";
import { getInvoiceById, updateInvoiceStatus } from "../../services/orderService";
import { createTransaction } from "../../services/transactionService";
import { Invoice } from "../../types";

export default function RecordPaymentScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ invoiceId: string; fromOrderView?: string; orderId?: string }>();
  const invoiceId = params.invoiceId;
  const fromOrderView = params.fromOrderView === 'true';
  const orderId = params.orderId;
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      if (!invoiceId) {
        setError("Invoice ID is missing");
        setIsLoading(false);
        return;
      }

      try {
        const data = await getInvoiceById(invoiceId);
        if (data) {
          setInvoice(data);
          // Set default payment amount to invoice total
          setPaymentAmount(data.total_amount.toString());
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
  }, [invoiceId]);

  const validateForm = () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      Alert.alert("Error", "Please enter a valid payment amount");
      return false;
    }
    
    if (!paymentMethod) {
      Alert.alert("Error", "Please select a payment method");
      return false;
    }
    
    return true;
  };

  const handleRecordPayment = async () => {
    if (!validateForm() || !invoice) return;
    
    setIsSaving(true);
    
    try {
      // Update invoice status to Paid
      const statusUpdated = await updateInvoiceStatus(invoiceId as string, 'Paid');
      
      if (statusUpdated) {
        // Create transaction record with order reference
        const description = invoice.order_id 
          ? `Payment received for rental order #${invoice.order_id.substring(0, 8)}`
          : `Payment for Invoice #${invoice.invoice_number}`;
          
        const transactionData = {
          type: 'income' as 'income',
          amount: parseFloat(paymentAmount),
          description: description,
          transaction_date: paymentDate.toISOString().split('T')[0],
          category: 'Invoice Payment',
          payment_method: paymentMethod,
          reference_id: invoiceId as string,
          reference_type: 'invoice' as 'invoice',
          notes: notes || undefined
        };
        
        const transaction = await createTransaction(transactionData);
        
        if (transaction) {
          // Success - navigate back with refresh parameter
          if (fromOrderView && orderId) {
            // Navigate back to order view with refresh parameter
            router.replace({
              pathname: `/orders/view`,
              params: { id: orderId, refresh: 'true' }
            });
          } else {
            // Navigate back to invoice details with refresh parameter
            router.replace({
              pathname: `/finances/invoice-details`,
              params: { id: invoiceId, refresh: 'true' }
            });
          }
        } else {
          Alert.alert("Warning", "Invoice was marked as paid but failed to create transaction record.");
          router.back();
        }
      } else {
        Alert.alert("Error", "Failed to update invoice status. Please try again.");
      }
    } catch (err) {
      console.error("Error recording payment:", err);
      Alert.alert("Error", "An error occurred while recording the payment");
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

  if (error || !invoice) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <Header
          title="Record Payment"
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

  return (
    <PageTransition type="slide">
      <SafeAreaView className="flex-1 bg-gray-100">
        <Header
          title="Record Payment"
          leftIcon={<ArrowLeft size={24} color="#000" />}
          onLeftPress={() => router.back()}
        />

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
        >
          {/* Invoice Info */}
          <View className="bg-white p-4 rounded-xl shadow-sm mb-4">
            <Text className="text-lg font-bold mb-3 text-gray-900">
              Invoice Information
            </Text>
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-600">Invoice Number</Text>
              <Text className="font-medium">{invoice.invoice_number}</Text>
            </View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-600">Customer</Text>
              <Text className="font-medium">{invoice.customer_name}</Text>
            </View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-600">Amount Due</Text>
              <Text className="font-medium">₹{invoice.total_amount.toLocaleString()}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Due Date</Text>
              <Text className="font-medium">
                {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'None'}
              </Text>
            </View>
          </View>

          {/* Payment Details */}
          <View className="bg-white p-4 rounded-xl shadow-sm mb-4">
            <Text className="text-lg font-bold mb-3 text-gray-900">
              Payment Details
            </Text>
            <View className="mb-3">
              <Text className="text-gray-600 mb-1">Amount*</Text>
              <TextInput
                className="border border-gray-300 p-2 rounded-lg"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
            
            <View className="mb-3">
              <CustomDatePicker
                label="Payment Date"
                required={true}
                date={paymentDate}
                onDateChange={setPaymentDate}
              />
            </View>
            
            <View className="mb-3">
              <Text className="text-gray-600 mb-1">Payment Method*</Text>
              <View className="flex-row flex-wrap">
                {["cash", "card", "bank", "upi"].map((method) => (
                  <TouchableOpacity
                    key={method}
                    className={`mr-2 mb-2 px-3 py-2 rounded-lg ${
                      paymentMethod === method
                        ? "bg-blue-500"
                        : "bg-gray-200"
                    }`}
                    onPress={() => setPaymentMethod(method)}
                  >
                    <Text
                      className={`${
                        paymentMethod === method
                          ? "text-white"
                          : "text-gray-800"
                      }`}
                    >
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View>
              <Text className="text-gray-600 mb-1">Notes</Text>
              <TextInput
                className="border border-gray-300 p-2 rounded-lg min-h-[80px]"
                value={notes}
                onChangeText={setNotes}
                placeholder="Add notes about this payment"
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Record Payment Button */}
          <TouchableOpacity
            className="bg-gradient-to-r from-green-500 to-emerald-600 py-3 rounded-xl mb-6"
            onPress={handleRecordPayment}
            disabled={isSaving}
          >
            <Text className="text-white text-center font-bold text-lg">
              {isSaving ? "Recording..." : "Record Payment"}
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