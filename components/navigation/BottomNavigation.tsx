import React from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  CalendarDays,
  BarChart3,
} from "lucide-react-native";

interface BottomNavigationProps {
  activeTab?: string;
}

// Define the supported route types to match expo-router expectations
type AppRoute = 
  | "/"
  | "/products"
  | "/customers" 
  | "/events" 
  | "/finances";

const BottomNavigation = ({
  activeTab = "dashboard",
}: BottomNavigationProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const currentPath = activeTab || pathname.split("/")[1] || "dashboard";

  const navigationItems = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, route: "/" as AppRoute },
    {
      key: "products",
      label: "Products",
      icon: ShoppingBag,
      route: "/products" as AppRoute,
    },
    { key: "customers", label: "Customers", icon: Users, route: "/customers" as AppRoute },
    { key: "events", label: "Events", icon: CalendarDays, route: "/events" as AppRoute },
    {
      key: "finances",
      label: "Finances",
      icon: BarChart3,
      route: "/finances" as AppRoute,
    },
  ];

  const handleNavigation = (route: AppRoute) => {
    router.push(route);
  };

  // Calculate bottom padding based on safe area
  const bottomPadding = Platform.OS === 'ios' ? insets.bottom : 8;

  return (
    <View 
      className="flex-row justify-between items-center bg-white border-t border-gray-100 shadow-md"
      style={{ 
        paddingTop: 8,
        paddingBottom: bottomPadding,
        paddingHorizontal: 8
      }}
    >
      {navigationItems.map((item) => {
        const isActive = currentPath === item.key;
        const IconComponent = item.icon;

        return (
          <TouchableOpacity
            key={item.key}
            className={`flex-1 items-center justify-center py-2 mx-1 ${isActive ? "bg-indigo-50 rounded-xl" : ""}`}
            onPress={() => handleNavigation(item.route)}
            accessibilityLabel={item.label}
            accessibilityRole="button"
          >
            <IconComponent
              size={22}
              color={isActive ? "#6366f1" : "#94a3b8"}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <Text
              className={`text-xs mt-1 ${isActive ? "text-indigo-600 font-medium" : "text-slate-500"}`}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default BottomNavigation;
