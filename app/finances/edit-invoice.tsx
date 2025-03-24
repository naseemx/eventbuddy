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
import { ArrowLeft, Plus, Trash2 } from "lucide-react-native";
import PageTransition from "../../components/animations/PageTransition";

import Header from "../../components/Header";
import CustomDatePicker from "../../components/CustomDatePicker";
import { getInvoiceById, updateInvoice } from "../../services/orderService";
import { Invoice } from "../../types";

// Define the invoice item type for UI purposes
interface InvoiceItemUI {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export default function EditInvoiceScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(new Date());
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"Paid" | "Unpaid">("Unpaid");
  const [items, setItems] = useState<InvoiceItemUI[]>([]);

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      if (!id) {
        setError("Invoice ID is missing");
        setIsLoading(false);
        return;
      }

      try {
        const data = await getInvoiceById(id);
        if (data) {
          setInvoice(data);
          
          // Initialize form states with invoice data
          setCustomerName(data.customer_name || "");
          setCustomerEmail(data.customer_email || "");
          setCustomerPhone(data.customer_phone || "");
          setInvoiceNumber(data.invoice_number || "");
          setNotes(data.notes || "");
          setStatus(data.status as "Paid" | "Unpaid");
          
          // Handle dates
          if (data.invoice_date) {
            setInvoiceDate(new Date(data.invoice_date));
          }
          
          if (data.due_date) {
            setDueDate(new Date(data.due_date));
          }
          
          // Parse items
          if (data.items) {
            try {
              const parsedItems = JSON.parse(data.items);
              // Add id field to each item for UI management
              const itemsWithId = parsedItems.map((item: any, index: number) => ({
                ...item,
                id: index.toString(),
              }));
              setItems(itemsWithId);
            } catch (e) {
              console.error("Error parsing items:", e);
              setItems([]);
            }
          }
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
  }, [id]);

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const addNewItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        product_name: "",
        quantity: 1,
        unit_price: 0,
      },
    ]);
  };

  const updateItemField = (id: string, field: keyof InvoiceItemUI, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    } else {
      Alert.alert("Cannot Remove", "Invoice must have at least one item");
    }
  };

  const validateForm = () => {
    if (!customerName.trim()) {
      Alert.alert("Error", "Please enter customer name");
      return false;
    }
    
    if (!invoiceNumber.trim()) {
      Alert.alert("Error", "Please enter invoice number");
      return false;
    }
    
    // Check if any item is invalid
    const invalidItem = items.find(
      (item) => !item.product_name.trim() || item.quantity <= 0
    );
    
    if (invalidItem) {
      Alert.alert(
        "Error",
        "Please ensure all items have a name and quantity greater than zero"
      );
      return false;
    }
    
    return true;
  };

  const handleSaveInvoice = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    
    try {
      // Format dates to ISO string date only (YYYY-MM-DD)
      const formattedInvoiceDate = invoiceDate.toISOString().split('T')[0];
      const formattedDueDate = dueDate.toISOString().split('T')[0];
      
      // Prepare items for storage (remove the id we added for UI)
      const formattedItems = items.map(({ id, ...rest }) => rest);
      
      const subtotal = calculateSubtotal();
      
      const updates = {
        customer_name: customerName,
        customer_email: customerEmail || undefined,
        customer_phone: customerPhone || undefined,
        invoice_number: invoiceNumber,
        invoice_date: formattedInvoiceDate,
        due_date: formattedDueDate,
        items: JSON.stringify(formattedItems),
        subtotal: subtotal,
        total_amount: subtotal, // You could add tax calculation here if needed
        status: status,
        notes: notes || undefined,
      };
      
      const result = await updateInvoice(id as string, updates);
      
      if (result) {
        // Set the refresh parameter for the invoice details page then go back
        router.setParams({ refresh: 'true' });
        router.back();
      } else {
        Alert.alert("Error", "Failed to update invoice. Please try again.");
      }
    } catch (err) {
      console.error("Error updating invoice:", err);
      Alert.alert("Error", "An error occurred while updating the invoice");
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
          title="Edit Invoice"
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
          title="Edit Invoice"
          leftIcon={<ArrowLeft size={24} color="#000" />}
          onLeftPress={() => router.back()}
        />

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
        >
          {/* Customer Information */}
          <View className="bg-white p-4 rounded-xl shadow-sm mb-4">
            <Text className="text-lg font-bold mb-3 text-gray-900">
              Customer Information
            </Text>
            <View className="mb-3">
              <Text className="text-gray-600 mb-1">Customer Name*</Text>
              <TextInput
                className="border border-gray-300 p-2 rounded-lg"
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Customer Name"
              />
            </View>
            <View className="mb-3">
              <Text className="text-gray-600 mb-1">Email</Text>
              <TextInput
                className="border border-gray-300 p-2 rounded-lg"
                value={customerEmail}
                onChangeText={setCustomerEmail}
                placeholder="Email"
                keyboardType="email-address"
              />
            </View>
            <View>
              <Text className="text-gray-600 mb-1">Phone</Text>
              <TextInput
                className="border border-gray-300 p-2 rounded-lg"
                value={customerPhone}
                onChangeText={setCustomerPhone}
                placeholder="Phone"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Invoice Details */}
          <View className="bg-white p-4 rounded-xl shadow-sm mb-4">
            <Text className="text-lg font-bold mb-3 text-gray-900">
              Invoice Details
            </Text>
            <View className="mb-3">
              <Text className="text-gray-600 mb-1">Invoice Number*</Text>
              <TextInput
                className="border border-gray-300 p-2 rounded-lg"
                value={invoiceNumber}
                onChangeText={setInvoiceNumber}
                placeholder="Invoice Number"
              />
            </View>
            <View className="mb-3">
              <CustomDatePicker
                label="Invoice Date"
                required={true}
                date={invoiceDate}
                onDateChange={setInvoiceDate}
              />
            </View>
            <View className="mb-3">
              <CustomDatePicker
                label="Due Date"
                required={true}
                date={dueDate}
                onDateChange={setDueDate}
              />
            </View>
            <View className="mb-3">
              <Text className="text-gray-600 mb-1">Status</Text>
              <View className="flex-row flex-wrap">
                {["Paid", "Unpaid"].map((statusOption) => (
                  <TouchableOpacity
                    key={statusOption}
                    className={`mr-2 mb-2 px-3 py-2 rounded-lg ${
                      status === statusOption
                        ? "bg-blue-500"
                        : "bg-gray-200"
                    }`}
                    onPress={() => setStatus(statusOption as "Paid" | "Unpaid")}
                  >
                    <Text
                      className={`${
                        status === statusOption
                          ? "text-white"
                          : "text-gray-800"
                      }`}
                    >
                      {statusOption}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Invoice Items */}
          <View className="bg-white p-4 rounded-xl shadow-sm mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-bold text-gray-900">Items</Text>
              <TouchableOpacity
                className="bg-blue-500 px-3 py-1 rounded-lg flex-row items-center"
                onPress={addNewItem}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text className="text-white ml-1">Add Item</Text>
              </TouchableOpacity>
            </View>

            {items.map((item, index) => (
              <View
                key={item.id}
                className="border border-gray-200 rounded-lg p-3 mb-3"
              >
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="font-medium">Item #{index + 1}</Text>
                  <TouchableOpacity
                    onPress={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className={`${
                      items.length === 1 ? "opacity-50" : ""
                    }`}
                  >
                    <Trash2 size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                <View className="mb-2">
                  <Text className="text-gray-600 mb-1">Description*</Text>
                  <TextInput
                    className="border border-gray-300 p-2 rounded-lg"
                    value={item.product_name}
                    onChangeText={(text) =>
                      updateItemField(item.id, "product_name", text)
                    }
                    placeholder="Item description"
                  />
                </View>
                <View className="flex-row">
                  <View className="flex-1 mr-2">
                    <Text className="text-gray-600 mb-1">Quantity*</Text>
                    <TextInput
                      className="border border-gray-300 p-2 rounded-lg"
                      value={item.quantity.toString()}
                      onChangeText={(text) =>
                        updateItemField(
                          item.id,
                          "quantity",
                          parseInt(text) || 0
                        )
                      }
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>
                  <View className="flex-1 ml-2">
                    <Text className="text-gray-600 mb-1">Price*</Text>
                    <TextInput
                      className="border border-gray-300 p-2 rounded-lg"
                      value={item.unit_price.toString()}
                      onChangeText={(text) =>
                        updateItemField(
                          item.id,
                          "unit_price",
                          parseFloat(text) || 0
                        )
                      }
                      keyboardType="numeric"
                      placeholder="0.00"
                    />
                  </View>
                </View>
                <View className="items-end mt-2">
                  <Text className="font-bold">
                    Total: ₹{(item.quantity * item.unit_price).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}

            <View className="flex-row justify-end mt-3">
              <Text className="text-lg font-bold">
                Subtotal: ₹{calculateSubtotal().toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Notes */}
          <View className="bg-white p-4 rounded-xl shadow-sm mb-6">
            <Text className="text-lg font-bold mb-3 text-gray-900">Notes</Text>
            <TextInput
              className="border border-gray-300 p-2 rounded-lg min-h-[100px]"
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes to this invoice"
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            className="bg-gradient-to-r from-blue-500 to-indigo-600 py-3 rounded-xl mb-6"
            onPress={handleSaveInvoice}
            disabled={isSaving}
          >
            <Text className="text-white text-center font-bold text-lg">
              {isSaving ? "Saving..." : "Save Invoice"}
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