import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Bell, ShoppingCart, Menu } from "lucide-react-native";
import { useRouter } from "expo-router";
import SideNavigation from "./navigation/SideNavigation";

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
  notificationCount = 3,
  orderCount = 2,
  onNotificationPress,
  onOrderPress,
  leftIcon,
  onLeftPress,
}: HeaderProps) => {
  const router = useRouter();
  const [sideNavVisible, setSideNavVisible] = useState(false);

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

  return (
    <>
      <View className="w-full h-16 px-4 flex-row items-center justify-between bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          {leftIcon ? (
            <TouchableOpacity
              onPress={onLeftPress}
              className="mr-3"
              accessibilityLabel="Back"
            >
              {leftIcon}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={toggleSideNav}
              className="mr-3"
              accessibilityLabel="Open menu"
            >
              <Menu size={24} color="#4b5563" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => router.push("/")}
            className="flex-row items-center"
          >
            <View className="w-8 h-8 rounded-full bg-blue-500 mr-2 items-center justify-center">
              <Text className="text-white font-bold">R</Text>
            </View>
            <Text className="text-lg font-bold text-gray-800">{title}</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={handleOrderPress}
            className="relative p-2 mr-2"
            accessibilityLabel="View orders"
          >
            <ShoppingCart size={24} color="#4b5563" />
            {orderCount > 0 && (
              <View className="absolute top-0 right-0 bg-blue-500 rounded-full w-5 h-5 items-center justify-center">
                <Text className="text-white text-xs font-bold">
                  {orderCount > 9 ? "9+" : orderCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNotificationPress}
            className="relative p-2"
            accessibilityLabel="View notifications"
          >
            <Bell size={24} color="#4b5563" />
            {notificationCount > 0 && (
              <View className="absolute top-0 right-0 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
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
