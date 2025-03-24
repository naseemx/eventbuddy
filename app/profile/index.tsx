import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Settings,
  LogOut,
} from "lucide-react-native";

import Header from "../../components/Header";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  // Mock user data
  const user = {
    id: "1",
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    phone: "(555) 123-4567",
    address: "123 Main St, Anytown, USA",
    role: "Admin",
    joinDate: "Jan 15, 2022",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
  };

  const handleEditProfile = () => {
    router.push("/profile/edit");
  };

  const handleLogout = () => {
    router.push("/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Header title="My Profile" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom }}
      >
        {/* Profile Header */}
        <View className="bg-white p-5 rounded-xl shadow-sm mb-5 items-center">
          <Image
            source={{ uri: user.avatar }}
            className="w-24 h-24 rounded-full mb-4"
          />
          <Text className="text-2xl font-bold text-gray-900">{user.name}</Text>
          <Text className="text-gray-600 mb-2">{user.role}</Text>
          <TouchableOpacity
            className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center mt-2"
            onPress={handleEditProfile}
          >
            <Edit size={16} color="#FFFFFF" />
            <Text className="text-white font-medium ml-2">Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Information */}
        <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
          <Text className="text-lg font-bold mb-4 text-gray-900">
            Contact Information
          </Text>

          <View className="flex-row items-center mb-3">
            <Mail size={20} color="#4B5563" className="mr-3" />
            <View>
              <Text className="text-gray-500 text-sm">Email</Text>
              <Text className="text-gray-800 font-medium">{user.email}</Text>
            </View>
          </View>

          <View className="flex-row items-center mb-3">
            <Phone size={20} color="#4B5563" className="mr-3" />
            <View>
              <Text className="text-gray-500 text-sm">Phone</Text>
              <Text className="text-gray-800 font-medium">{user.phone}</Text>
            </View>
          </View>

          <View className="flex-row items-center mb-3">
            <MapPin size={20} color="#4B5563" className="mr-3" />
            <View>
              <Text className="text-gray-500 text-sm">Address</Text>
              <Text className="text-gray-800 font-medium">{user.address}</Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <Calendar size={20} color="#4B5563" className="mr-3" />
            <View>
              <Text className="text-gray-500 text-sm">Joined</Text>
              <Text className="text-gray-800 font-medium">{user.joinDate}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
          <Text className="text-lg font-bold mb-4 text-gray-900">
            Quick Actions
          </Text>

          <TouchableOpacity
            className="flex-row items-center py-3 border-b border-gray-100"
            onPress={() => router.push("/settings")}
          >
            <Settings size={20} color="#4B5563" className="mr-3" />
            <Text className="text-gray-800 font-medium">Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center py-3 border-b border-gray-100"
            onPress={() => router.push("/logs")}
          >
            <Settings size={20} color="#4B5563" className="mr-3" />
            <Text className="text-gray-800 font-medium">Activity Logs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center py-3"
            onPress={handleLogout}
          >
            <LogOut size={20} color="#EF4444" className="mr-3" />
            <Text className="text-red-500 font-medium">Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
