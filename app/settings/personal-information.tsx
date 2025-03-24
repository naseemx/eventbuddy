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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, Save } from "lucide-react-native";

import Header from "../../components/Header";

export default function PersonalInformationScreen() {
  const insets = useSafeAreaInsets();

  // Form state
  const [formData, setFormData] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "(555) 123-4567",
    address: "123 Main St, Anytown, USA",
    dateOfBirth: "01/15/1985",
    emergencyContact: "Jane Doe",
    emergencyPhone: "(555) 987-6543",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // In a real app, you would save the personal information
    console.log("Saving personal information:", formData);
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Header
        title="Personal Information"
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
              <Text className="text-gray-700 mb-2 font-medium">Full Name</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.name}
                onChangeText={(value) => handleChange("name", value)}
                placeholder="Enter your full name"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Email</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.email}
                onChangeText={(value) => handleChange("email", value)}
                placeholder="Enter your email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Phone</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.phone}
                onChangeText={(value) => handleChange("phone", value)}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Address</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.address}
                onChangeText={(value) => handleChange("address", value)}
                placeholder="Enter your address"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">
                Date of Birth
              </Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.dateOfBirth}
                onChangeText={(value) => handleChange("dateOfBirth", value)}
                placeholder="MM/DD/YYYY"
              />
            </View>
          </View>

          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-4 text-gray-900">
              Emergency Contact
            </Text>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">
                Emergency Contact Name
              </Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.emergencyContact}
                onChangeText={(value) =>
                  handleChange("emergencyContact", value)
                }
                placeholder="Enter emergency contact name"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">
                Emergency Contact Phone
              </Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.emergencyPhone}
                onChangeText={(value) => handleChange("emergencyPhone", value)}
                placeholder="Enter emergency contact phone"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <TouchableOpacity
            className="bg-blue-500 py-3 rounded-lg flex-row items-center justify-center mb-10"
            onPress={handleSave}
          >
            <Save size={20} color="#FFFFFF" />
            <Text className="text-white font-medium ml-2">Save Changes</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
