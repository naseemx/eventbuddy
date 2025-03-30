import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Building,
  Bell,
  Database,
  HelpCircle,
  LogOut,
  ChevronRight,
  Info,
} from "lucide-react-native";
import { router } from "expo-router";
import Constants from "expo-constants";
import * as Notifications from 'expo-notifications';

import Header from "../../components/Header";
import BottomNavigation from "../../components/navigation/BottomNavigation";

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

const SettingsSection = ({ title, children }: SettingsSectionProps) => (
  <View className="mb-6">
    <Text className="text-sm font-medium text-gray-500 mb-2">{title}</Text>
    <View className="bg-white rounded-lg overflow-hidden">{children}</View>
  </View>
);

interface SettingsItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
}

const SettingsItem = ({
  icon,
  title,
  subtitle,
  rightElement,
  onPress,
  isLast = false,
}: SettingsItemProps) => (
  <TouchableOpacity
    onPress={onPress}
    className={`flex-row items-center p-4 ${!isLast ? "border-b border-gray-100" : ""}`}
  >
    <View className="mr-3">{icon}</View>
    <View className="flex-1">
      <Text className="font-medium text-gray-900">{title}</Text>
      {subtitle && <Text className="text-sm text-gray-500">{subtitle}</Text>}
    </View>
    {rightElement || <ChevronRight size={18} color="#9CA3AF" />}
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  
  // Get app version from expo constants
  const appVersion = Constants.expoConfig?.version || "1.0.0";
  const runtimeVersion = Constants.expoConfig?.runtimeVersion || "1.0.0";

  // Check notifications permission status
  useEffect(() => {
    checkNotificationPermission();
  }, []);

  const checkNotificationPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationsEnabled(status === 'granted');
  };

  // Toggle notifications
  const toggleNotifications = async (value: boolean) => {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        // Permission was denied
        setNotificationsEnabled(false);
        return;
      }
      setNotificationsEnabled(true);
    } else {
      // On Android, we can't programmatically revoke permissions
      // Just update the UI state and inform user to disable in system settings
      setNotificationsEnabled(false);
      // You could show an alert here instructing the user to disable in settings
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Header title="Settings" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 80,
        }}
      >
        {/* User Profile Section */}
        <View className="bg-white p-4 rounded-lg mb-6 items-center">
          <View className="w-20 h-20 rounded-full bg-blue-500 mb-3 items-center justify-center">
            <Text className="text-white text-2xl font-bold">TF</Text>
          </View>
          <Text className="text-xl font-bold">TechFlow Solutions</Text>
          <Text className="text-gray-500">Company Profile</Text>
          <TouchableOpacity 
            className="mt-3 bg-blue-50 px-4 py-2 rounded-full"
            onPress={() => router.push("/profile/edit")}
          >
            <Text className="text-blue-600 font-medium">Edit Company</Text>
          </TouchableOpacity>
        </View>

        {/* Account Settings */}
        <SettingsSection title="ACCOUNT SETTINGS">
          <SettingsItem
            icon={<Building size={20} color="#4B5563" />}
            title="Company Information"
            subtitle="Update your company details"
            onPress={() => router.push("/settings/company-information")}
          />
          <SettingsItem
            icon={<Bell size={20} color="#4B5563" />}
            title="Notifications"
            subtitle="Manage notification preferences"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: "#D1D5DB", true: "#BFDBFE" }}
                thumbColor={notificationsEnabled ? "#3B82F6" : "#9CA3AF"}
              />
            }
            isLast
          />
        </SettingsSection>

        {/* Data Backup and Storage Settings */}
        <SettingsSection title="DATA BACKUP AND STORAGE SETTINGS">
          <SettingsItem
            icon={<Database size={20} color="#4B5563" />}
            title="Data Backup"
            subtitle="Backup and restore your data"
            onPress={() => router.push("/settings/data-backup")}
            isLast
          />
        </SettingsSection>

        {/* Support */}
        <SettingsSection title="SUPPORT">
          <SettingsItem
            icon={<HelpCircle size={20} color="#4B5563" />}
            title="Help & Support"
            subtitle="Get help with using the app"
            onPress={() => router.push("/settings/help-support")}
            isLast
          />
        </SettingsSection>

        {/* App Information */}
        <SettingsSection title="APP INFORMATION">
          <SettingsItem
            icon={<Info size={20} color="#4B5563" />}
            title="App Version"
            subtitle={`${appVersion} (Runtime ${runtimeVersion})`}
            rightElement={<View />}
            isLast
          />
        </SettingsSection>

        {/* Logout */}
        <TouchableOpacity
          className="bg-red-50 p-4 rounded-lg flex-row items-center justify-center mt-4"
          onPress={() => console.log("Logout pressed")}
        >
          <LogOut size={20} color="#EF4444" />
          <Text className="text-red-600 font-medium ml-2">Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0">
        <BottomNavigation activeTab="dashboard" />
      </View>
    </SafeAreaView>
  );
}
