import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  StatusBar,
  Animated as RNAnimated,
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
import Animated, { FadeInDown } from 'react-native-reanimated';

import Header from "../../components/Header";
import BottomNavigation from "../../components/navigation/BottomNavigation";
import OptimizedImage from "../../components/OptimizedImage";
import { useCompany } from "../../services/companyContext";
import SafeScreenContainer from "../../components/layout/SafeScreenContainer";

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

const SettingsSection = ({ title, children }: SettingsSectionProps) => (
  <Animated.View 
    className="mb-6"
    entering={FadeInDown.duration(400).springify()}
  >
    <Text className="text-sm font-medium text-gray-500 mb-2">{title}</Text>
    <View className="bg-white rounded-lg overflow-hidden shadow-sm">{children}</View>
  </Animated.View>
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
    activeOpacity={0.7}
    hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
  >
    <View className="mr-3 w-8 items-center">{icon}</View>
    <View className="flex-1">
      <Text className="font-medium text-gray-900" numberOfLines={1} ellipsizeMode="tail">{title}</Text>
      {subtitle && <Text className="text-sm text-gray-500" numberOfLines={1} ellipsizeMode="tail">{subtitle}</Text>}
    </View>
    {rightElement || <ChevronRight size={18} color="#9CA3AF" />}
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const { companyData, loading } = useCompany();
  
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
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
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
        <Animated.View 
          className="bg-white p-4 rounded-lg mb-6 items-center shadow-sm"
          entering={FadeInDown.duration(400).springify()}
        >
          <View className="relative">
            {companyData?.logo ? (
              <OptimizedImage
                source={companyData.logo}
                style={{ width: 80, height: 80, borderRadius: 40 }}
                resizeMode="cover"
                showPlaceholder={true}
                placeholderText={companyData.name?.charAt(0) || "C"}
              />
            ) : (
              <View className="w-20 h-20 rounded-full bg-blue-500 items-center justify-center">
                <Text className="text-white text-2xl font-bold">
                  {companyData?.name?.charAt(0) || "C"}
                </Text>
              </View>
            )}
          </View>
          <Text className="text-xl font-bold mt-3" numberOfLines={1} ellipsizeMode="tail">{companyData?.name || "Company Name"}</Text>
          <Text className="text-gray-500">Company Profile</Text>
          <TouchableOpacity 
            className="mt-3 bg-blue-50 px-4 py-2 rounded-full"
            onPress={() => router.push("/profile")}
            activeOpacity={0.7}
          >
            <Text className="text-blue-600 font-medium">View Company Profile</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Account Settings */}
        <SettingsSection title="ACCOUNT SETTINGS">
          <SettingsItem
            icon={<Building size={20} color="#4B5563" />}
            title="Company Profile"
            subtitle="View and edit your company details"
            onPress={() => router.push("/profile")}
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
        <Animated.View entering={FadeInDown.duration(400).delay(300).springify()}>
          <TouchableOpacity
            className="bg-red-50 p-4 rounded-lg flex-row items-center justify-center mt-4 border border-red-100"
            onPress={() => router.push("/login")}
            activeOpacity={0.7}
          >
            <LogOut size={20} color="#EF4444" />
            <Text className="text-red-600 font-medium ml-2">Logout</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0">
        <BottomNavigation activeTab="dashboard" />
      </View>
    </View>
  );
}
