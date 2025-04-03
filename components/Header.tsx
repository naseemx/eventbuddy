import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Platform, StatusBar } from "react-native";
import { Bell, ShoppingCart, Menu } from "lucide-react-native";
import { useRouter } from "expo-router";
import SideNavigation from "./navigation/SideNavigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getUnreadNotificationCount } from "../services/notificationService";
import { getActiveOrdersCount } from "../services/orderService";

interface HeaderProps {
  title?: string;
  notificationCount?: number;
  orderCount?: number;
  onNotificationPress?: () => void;
  onOrderPress?: () => void;
  leftIcon?: React.ReactNode;
  onLeftPress?: () => void;
}

const Header = ({
  title = "Rental Manager",
  notificationCount: propNotificationCount,
  orderCount: propOrderCount,
  onNotificationPress,
  onOrderPress,
  leftIcon,
  onLeftPress,
}: HeaderProps) => {
  const router = useRouter();
  const [sideNavVisible, setSideNavVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const [notificationCount, setNotificationCount] = useState(propNotificationCount || 0);
  const [orderCount, setOrderCount] = useState(propOrderCount || 0);

  useEffect(() => {
    // If counts were provided as props, use those values
    if (propNotificationCount !== undefined) {
      setNotificationCount(propNotificationCount);
    } else {
      fetchNotificationCount();
    }
    
    if (propOrderCount !== undefined) {
      setOrderCount(propOrderCount);
    } else {
      fetchOrderCount();
    }
  }, [propNotificationCount, propOrderCount]);

  const fetchNotificationCount = async () => {
    try {
      const count = await getUnreadNotificationCount();
      setNotificationCount(count);
    } catch (error) {
      console.error("Error fetching notification count:", error);
    }
  };

  const fetchOrderCount = async () => {
    try {
      const count = await getActiveOrdersCount();
      setOrderCount(count);
    } catch (error) {
      console.error("Error fetching order count:", error);
    }
  };

  const toggleSideNav = () => {
    setSideNavVisible(!sideNavVisible);
  };

  const handleNotificationPress =
    onNotificationPress ||
    (() => {
      router.push("/notifications");
    });

  const handleOrderPress =
    onOrderPress ||
    (() => {
      router.push("/orders");
    });

  // Calculate the status bar height based on platform
  const statusBarHeight = Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight || 0;

  return (
    <>
      <View 
        style={{ 
          paddingTop: statusBarHeight + (Platform.OS === 'ios' ? 12 : 10),
          paddingBottom: Platform.OS === 'ios' ? 12 : 10,
          paddingHorizontal: 16 
        }}
        className="w-full flex-row items-center justify-between bg-white border-b border-gray-200"
      >
        <View className="flex-row items-center flex-1">
          {leftIcon ? (
            <TouchableOpacity
              onPress={onLeftPress}
              className="mr-3 p-1"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Back"
            >
              {leftIcon}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={toggleSideNav}
              className="mr-3 p-1"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Open menu"
            >
              <Menu size={22} color="#4b5563" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => router.push("/")}
            className="flex-row items-center flex-1"
          >
            <View className="w-8 h-8 rounded-full bg-blue-500 mr-2 items-center justify-center flex-shrink-0">
              <Text className="text-white font-bold">R</Text>
            </View>
            <Text 
              className="text-lg font-bold text-gray-800" 
              numberOfLines={1} 
              ellipsizeMode="tail"
            >
              {title}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={handleOrderPress}
            className="relative p-2 mr-1"
            hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
            accessibilityLabel="View orders"
          >
            <ShoppingCart size={22} color="#4b5563" />
            {orderCount > 0 && (
              <View className="absolute top-0 right-0 bg-blue-500 rounded-full items-center justify-center" 
                style={{ minWidth: 18, height: 18, paddingHorizontal: 2 }}
              >
                <Text className="text-white text-xs font-bold">
                  {orderCount > 9 ? "9+" : orderCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNotificationPress}
            className="relative p-2"
            hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
            accessibilityLabel="View notifications"
          >
            <Bell size={22} color="#4b5563" />
            {notificationCount > 0 && (
              <View className="absolute top-0 right-0 bg-red-500 rounded-full items-center justify-center"
                style={{ minWidth: 18, height: 18, paddingHorizontal: 2 }}
              >
                <Text className="text-white text-xs font-bold">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {sideNavVisible && <SideNavigation onClose={toggleSideNav} />}
    </>
  );
};

export default Header;
