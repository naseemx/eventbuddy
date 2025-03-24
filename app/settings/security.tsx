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
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, Save, Shield, Bell, Lock } from "lucide-react-native";

import Header from "../../components/Header";

export default function SecurityScreen() {
  const insets = useSafeAreaInsets();

  // Form state
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Security settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginNotifications, setLoginNotifications] = useState(true);
  const [rememberDevice, setRememberDevice] = useState(true);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // In a real app, you would save the security settings
    console.log("Saving security settings:", {
      ...formData,
      twoFactorEnabled,
      loginNotifications,
      rememberDevice,
    });
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Header
        title="Security Settings"
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
              Change Password
            </Text>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">
                Current Password
              </Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.currentPassword}
                onChangeText={(value) => handleChange("currentPassword", value)}
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
                value={formData.newPassword}
                onChangeText={(value) => handleChange("newPassword", value)}
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
                value={formData.confirmPassword}
                onChangeText={(value) => handleChange("confirmPassword", value)}
                placeholder="Confirm new password"
                secureTextEntry
              />
            </View>
          </View>

          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-4 text-gray-900">
              Security Options
            </Text>

            <View className="flex-row justify-between items-center mb-4 py-2">
              <View className="flex-row items-center">
                <Shield size={20} color="#4B5563" />
                <View className="ml-3">
                  <Text className="font-medium text-gray-800">
                    Two-Factor Authentication
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Add an extra layer of security
                  </Text>
                </View>
              </View>
              <Switch
                value={twoFactorEnabled}
                onValueChange={setTwoFactorEnabled}
                trackColor={{ false: "#D1D5DB", true: "#BFDBFE" }}
                thumbColor={twoFactorEnabled ? "#3B82F6" : "#9CA3AF"}
              />
            </View>

            <View className="flex-row justify-between items-center mb-4 py-2">
              <View className="flex-row items-center">
                <Bell size={20} color="#4B5563" />
                <View className="ml-3">
                  <Text className="font-medium text-gray-800">
                    Login Notifications
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Get notified of new logins
                  </Text>
                </View>
              </View>
              <Switch
                value={loginNotifications}
                onValueChange={setLoginNotifications}
                trackColor={{ false: "#D1D5DB", true: "#BFDBFE" }}
                thumbColor={loginNotifications ? "#3B82F6" : "#9CA3AF"}
              />
            </View>

            <View className="flex-row justify-between items-center py-2">
              <View className="flex-row items-center">
                <Lock size={20} color="#4B5563" />
                <View className="ml-3">
                  <Text className="font-medium text-gray-800">
                    Remember This Device
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Stay logged in on this device
                  </Text>
                </View>
              </View>
              <Switch
                value={rememberDevice}
                onValueChange={setRememberDevice}
                trackColor={{ false: "#D1D5DB", true: "#BFDBFE" }}
                thumbColor={rememberDevice ? "#3B82F6" : "#9CA3AF"}
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
