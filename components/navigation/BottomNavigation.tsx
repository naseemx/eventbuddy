import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter, usePathname } from "expo-router";
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

const BottomNavigation = ({
  activeTab = "dashboard",
}: BottomNavigationProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = activeTab || pathname.split("/")[1] || "dashboard";

  const navigationItems = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, route: "/" },
    {
      key: "products",
      label: "Products",
      icon: ShoppingBag,
      route: "/products",
    },
    { key: "customers", label: "Customers", icon: Users, route: "/customers" },
    { key: "events", label: "Events", icon: CalendarDays, route: "/events" },
    {
      key: "finances",
      label: "Finances",
      icon: BarChart3,
      route: "/finances",
    },
  ];

  const handleNavigation = (route: string) => {
    router.push(route);
  };

  return (
    <View className="flex-row justify-between items-center bg-white border-t border-gray-100 h-[70px] px-2 pt-1 pb-2 shadow-md">
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
