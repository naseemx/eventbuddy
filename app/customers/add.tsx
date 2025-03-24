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
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, Save } from "lucide-react-native";

import Header from "../../components/Header";
import { createCustomer } from "../../services/customerService";

export default function CustomerAddScreen() {
  const insets = useSafeAreaInsets();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      console.log("Submitting customer data:", formData);
      await createCustomer(formData);
      
      // Navigate back immediately
      router.back();
      
      // Show success toast or notification instead of blocking alert
      // Note: You might want to add a toast/notification library for better UX
      setTimeout(() => {
        Alert.alert('Success', 'Customer added successfully');
      }, 300);
      
    } catch (error) {
      console.error("Error adding customer:", error);
      Alert.alert(
        'Error',
        'Failed to add customer. Please try again.'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Header
        title="Add Customer"
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
            <Text className="text-lg font-bold mb-4 text-gray-900">
              Basic Information
            </Text>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">
                Full Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className={`bg-gray-50 p-3 rounded-lg border ${errors.name ? 'border-red-500' : 'border-gray-200'}`}
                value={formData.name}
                onChangeText={(value) => handleChange("name", value)}
                placeholder="Enter customer name"
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
                placeholder="Enter email address"
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
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
              {errors.phone ? (
                <Text className="text-red-500 text-xs mt-1">{errors.phone}</Text>
              ) : null}
            </View>
          </View>

          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-4 text-gray-900">
              Address Information
            </Text>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Address</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.address}
                onChangeText={(value) => handleChange("address", value)}
                placeholder="Enter full address (street, city, state, zip)"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-4 text-gray-900">Notes</Text>

            <View className="mb-4">
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200 min-h-[100px]"
                value={formData.notes}
                onChangeText={(value) => handleChange("notes", value)}
                placeholder="Add any additional notes about this customer"
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          <TouchableOpacity
            className={`py-3 rounded-lg flex-row items-center justify-center mb-10 ${isSubmitting ? 'bg-blue-300' : 'bg-blue-500'}`}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Save size={20} color="#FFFFFF" />
            )}
            <Text className="text-white font-medium ml-2">
              {isSubmitting ? "Saving..." : "Save Customer"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
