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
import { ArrowLeft, Save, Camera } from "lucide-react-native";

import Header from "../../components/Header";

export default function CompanyEditScreen() {
  const insets = useSafeAreaInsets();

  // Mock company data
  const [formData, setFormData] = useState({
    name: "TechFlow Solutions",
    email: "info@techflow.com",
    phone: "(555) 987-6543",
    whatsapp: "(555) 123-4567",
    address: "456 Business Plaza, Enterprise City, USA",
    website: "www.techflow.com",
    logo: "https://api.dicebear.com/7.x/initials/svg?seed=TF",
    taxId: "TAX-12345678",
    foundedYear: "2015",
    instagram: "techflow_official",
    facebook: "TechFlowSolutions", 
    youtube: "TechFlowOfficial",
    twitter: "TechFlow"
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // In a real app, you would save the company data
    console.log("Saving company data:", formData);
    router.back();
  };

  const handleImagePicker = () => {
    // In a real app, you would implement image picking functionality
    console.log("Opening image picker");
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Header
        title="Edit Company"
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
                  className="w-24 h-24 rounded-full"
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
                className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-full items-center justify-center bg-gray-50"
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
              <Text className="text-gray-700 mb-2 font-medium">Company Name</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.name}
                onChangeText={(value) => handleChange("name", value)}
                placeholder="Enter company name"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Email</Text>
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
              <Text className="text-gray-700 mb-2 font-medium">Phone</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.phone}
                onChangeText={(value) => handleChange("phone", value)}
                placeholder="Enter company phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">WhatsApp Number</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.whatsapp}
                onChangeText={(value) => handleChange("whatsapp", value)}
                placeholder="Enter WhatsApp number"
                keyboardType="phone-pad"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Address</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.address}
                onChangeText={(value) => handleChange("address", value)}
                placeholder="Enter company address"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Website</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.website}
                onChangeText={(value) => handleChange("website", value)}
                placeholder="Enter company website"
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Tax ID</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.taxId}
                onChangeText={(value) => handleChange("taxId", value)}
                placeholder="Enter tax ID"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Founded Year</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.foundedYear}
                onChangeText={(value) => handleChange("foundedYear", value)}
                placeholder="Enter founding year"
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Social Media Information */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-4 text-gray-900">
              Social Media
            </Text>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Instagram</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.instagram}
                onChangeText={(value) => handleChange("instagram", value)}
                placeholder="Enter Instagram handle (without @)"
                autoCapitalize="none"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Facebook</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.facebook}
                onChangeText={(value) => handleChange("facebook", value)}
                placeholder="Enter Facebook username"
                autoCapitalize="none"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">YouTube</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.youtube}
                onChangeText={(value) => handleChange("youtube", value)}
                placeholder="Enter YouTube channel name"
                autoCapitalize="none"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Twitter</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.twitter}
                onChangeText={(value) => handleChange("twitter", value)}
                placeholder="Enter Twitter handle (without @)"
                autoCapitalize="none"
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
