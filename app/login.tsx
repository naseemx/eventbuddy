import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Lock, Mail, Eye, EyeOff } from "lucide-react-native";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    // In a real app, you would validate credentials here
    console.log("Login with", { email, password });
    router.replace("/");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-8">
          {/* Logo and Title */}
          <View className="items-center mb-10">
            <View className="w-20 h-20 rounded-full bg-blue-500 mb-4 items-center justify-center">
              <Text className="text-white text-3xl font-bold">R</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-800">
              Rental Manager
            </Text>
            <Text className="text-gray-500 text-center mt-2">
              Sign in to manage your rental business
            </Text>
          </View>

          {/* Login Form */}
          <View className="space-y-4">
            {/* Email Input */}
            <View className="bg-gray-50 rounded-lg px-4 py-3 flex-row items-center border border-gray-200">
              <Mail size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-gray-800"
                placeholder="Email Address"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password Input */}
            <View className="bg-gray-50 rounded-lg px-4 py-3 flex-row items-center border border-gray-200">
              <Lock size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-gray-800"
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity className="items-end">
              <Text className="text-blue-600 font-medium">
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              className="bg-blue-600 py-4 rounded-lg items-center mt-4"
              onPress={handleLogin}
            >
              <Text className="text-white font-bold text-lg">Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Create Account */}
          <View className="flex-row justify-center mt-8">
            <Text className="text-gray-600">Don't have an account? </Text>
            <TouchableOpacity>
              <Text className="text-blue-600 font-medium">Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
