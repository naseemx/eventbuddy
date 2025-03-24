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
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, Save, Camera, X } from "lucide-react-native";

import Header from "../../components/Header";

export default function CompanyInformationScreen() {
  const insets = useSafeAreaInsets();

  // Form state
  const [formData, setFormData] = useState({
    companyName: "Rental Pro Solutions",
    email: "info@rentalprosolutions.com",
    phone: "(555) 123-4567",
    address: "123 Business Ave, Suite 100",
    city: "Metropolis",
    state: "NY",
    zipCode: "10001",
    website: "www.rentalprosolutions.com",
    taxId: "12-3456789",
    logo: "https://api.dicebear.com/7.x/identicon/svg?seed=RentalPro",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // In a real app, you would save the company information
    console.log("Saving company information:", formData);
    router.back();
  };

  const handleImagePicker = () => {
    // In a real app, you would implement image picking functionality
    console.log("Opening image picker");
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Header
        title="Company Information"
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
          {/* Company Logo */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5 items-center">
            <Text className="text-lg font-bold mb-3 text-gray-900">
              Company Logo
            </Text>
            {formData.logo ? (
              <View className="relative">
                <Image
                  source={{ uri: formData.logo }}
                  className="w-32 h-32 rounded-lg"
                />
                <TouchableOpacity
                  className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full"
                  onPress={handleImagePicker}
                >
                  <Camera size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg items-center justify-center bg-gray-50"
                onPress={handleImagePicker}
              >
                <Camera size={24} color="#6B7280" />
                <Text className="text-gray-500 mt-2 text-xs">Add Logo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Basic Information */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-4 text-gray-900">
              Basic Information
            </Text>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">
                Company Name
              </Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.companyName}
                onChangeText={(value) => handleChange("companyName", value)}
                placeholder="Enter company name"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">
                Email Address
              </Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.email}
                onChangeText={(value) => handleChange("email", value)}
                placeholder="Enter company email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">
                Phone Number
              </Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.phone}
                onChangeText={(value) => handleChange("phone", value)}
                placeholder="Enter company phone"
                keyboardType="phone-pad"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Website</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.website}
                onChangeText={(value) => handleChange("website", value)}
                placeholder="Enter company website"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Address Information */}
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
                placeholder="Enter street address"
              />
            </View>

            <View className="flex-row mb-4">
              <View className="flex-1 mr-2">
                <Text className="text-gray-700 mb-2 font-medium">City</Text>
                <TextInput
                  className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                  value={formData.city}
                  onChangeText={(value) => handleChange("city", value)}
                  placeholder="City"
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 mb-2 font-medium">State</Text>
                <TextInput
                  className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                  value={formData.state}
                  onChangeText={(value) => handleChange("state", value)}
                  placeholder="State"
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Zip Code</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.zipCode}
                onChangeText={(value) => handleChange("zipCode", value)}
                placeholder="Enter zip code"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Tax Information */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-4 text-gray-900">
              Tax Information
            </Text>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">
                Tax ID / EIN
              </Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.taxId}
                onChangeText={(value) => handleChange("taxId", value)}
                placeholder="Enter tax ID number"
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
