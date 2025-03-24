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

export default function ProfileEditScreen() {
  const insets = useSafeAreaInsets();

  // Mock user data
  const [formData, setFormData] = useState({
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    phone: "(555) 123-4567",
    address: "123 Main St, Anytown, USA",
    role: "Admin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // In a real app, you would save the profile data
    console.log("Saving profile data:", formData);
    router.back();
  };

  const handleImagePicker = () => {
    // In a real app, you would implement image picking functionality
    console.log("Opening image picker");
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Header
        title="Edit Profile"
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
          {/* Profile Image */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5 items-center">
            <Text className="text-lg font-bold mb-3 text-gray-900">
              Profile Image
            </Text>
            {formData.avatar ? (
              <View className="relative">
                <Image
                  source={{ uri: formData.avatar }}
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
                <Text className="text-gray-500 mt-2 text-xs">Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Personal Information */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-4 text-gray-900">
              Personal Information
            </Text>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Full Name</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.name}
                onChangeText={(value) => handleChange("name", value)}
                placeholder="Enter your name"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Email</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.email}
                onChangeText={(value) => handleChange("email", value)}
                placeholder="Enter your email"
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
              <Text className="text-gray-700 mb-2 font-medium">Role</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.role}
                onChangeText={(value) => handleChange("role", value)}
                placeholder="Enter your role"
                editable={false}
              />
            </View>
          </View>

          {/* Password Change */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-4 text-gray-900">
              Change Password
            </Text>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">
                Current Password
              </Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                placeholder="Enter current password"
                secureTextEntry
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">
                New Password
              </Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                placeholder="Enter new password"
                secureTextEntry
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">
                Confirm New Password
              </Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                placeholder="Confirm new password"
                secureTextEntry
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
