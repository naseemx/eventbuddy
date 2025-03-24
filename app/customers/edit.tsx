import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeft, Save, AlertCircle } from "lucide-react-native";

import Header from "../../components/Header";
import { Customer, getCustomerById, updateCustomer } from "../../services/customerService";

export default function CustomerEditScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Customer>({
    id: id as string,
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) {
      setError("No customer ID provided");
      setIsLoading(false);
      return;
    }

    async function fetchCustomerData() {
      try {
        setIsLoading(true);
        setError(null);
        const customerData = await getCustomerById(id as string);
        setFormData({
          ...customerData,
          // Ensure all form fields are present, even if empty
          address: customerData.address || "",
          notes: customerData.notes || "",
        });
      } catch (err) {
        console.error("Error fetching customer data:", err);
        setError("Failed to load customer data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCustomerData();
  }, [id]);

  const handleChange = (field: string, value: string) => {
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      });
    }
    
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log("Updating customer with data:", formData);
      
      // Create a clean customer object without any undefined fields
      const customerData = {
        id: formData.id,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: (formData.address || "").trim(),
        notes: (formData.notes || "").trim()
      };
      
      await updateCustomer(id as string, customerData);
      
      // Navigate back immediately
      router.back();
      
      // Show success toast after navigation
      setTimeout(() => {
        Alert.alert('Success', 'Customer updated successfully');
      }, 300);
    } catch (error) {
      console.error("Error updating customer:", error);
      Alert.alert(
        'Error',
        'Failed to update customer. Please try again.'
      );
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <Header
          title="Edit Customer"
          leftIcon={<ArrowLeft size={24} color="#000" />}
          onLeftPress={() => router.back()}
        />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-2 text-gray-600">Loading customer data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <Header
          title="Edit Customer"
          leftIcon={<ArrowLeft size={24} color="#000" />}
          onLeftPress={() => router.back()}
        />
        <View className="flex-1 justify-center items-center p-6">
          <AlertCircle size={40} color="#EF4444" />
          <Text className="mt-4 text-gray-800 font-medium text-center">{error}</Text>
          <TouchableOpacity 
            className="mt-4 bg-blue-500 px-4 py-2 rounded-lg"
            onPress={() => router.back()}
          >
            <Text className="text-white font-medium">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Header
        title="Edit Customer"
        leftIcon={<ArrowLeft size={24} color="#000" />}
        onLeftPress={() => router.back()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom }}
        >
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">
                Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className={`bg-gray-50 p-3 rounded-lg border ${errors.name ? 'border-red-500' : 'border-gray-200'}`}
                value={formData.name}
                onChangeText={(value) => handleChange("name", value)}
                placeholder="Customer name"
              />
              {errors.name ? (
                <Text className="text-red-500 text-xs mt-1">{errors.name}</Text>
              ) : null}
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">
                Email <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className={`bg-gray-50 p-3 rounded-lg border ${errors.email ? 'border-red-500' : 'border-gray-200'}`}
                value={formData.email}
                onChangeText={(value) => handleChange("email", value)}
                placeholder="Email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email ? (
                <Text className="text-red-500 text-xs mt-1">{errors.email}</Text>
              ) : null}
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">
                Phone <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className={`bg-gray-50 p-3 rounded-lg border ${errors.phone ? 'border-red-500' : 'border-gray-200'}`}
                value={formData.phone}
                onChangeText={(value) => handleChange("phone", value)}
                placeholder="Phone number"
                keyboardType="phone-pad"
              />
              {errors.phone ? (
                <Text className="text-red-500 text-xs mt-1">{errors.phone}</Text>
              ) : null}
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Address</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.address}
                onChangeText={(value) => handleChange("address", value)}
                placeholder="Full address"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Notes</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200 min-h-[100px]"
                value={formData.notes}
                onChangeText={(value) => handleChange("notes", value)}
                placeholder="Additional notes"
                multiline
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              className={`py-3 rounded-lg flex-row items-center justify-center mt-4 ${isSubmitting ? 'bg-blue-300' : 'bg-blue-500'}`}
              onPress={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
              <Save size={20} color="#FFFFFF" />
              )}
              <Text className="text-white font-medium ml-2">
                {isSubmitting ? "Updating..." : "Update Customer"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}