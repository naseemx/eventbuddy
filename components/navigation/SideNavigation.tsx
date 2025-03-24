import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import {
  User,
  Settings,
  Users,
  LogOut,
  ClipboardList,
  X,
  Home,
  ShoppingBag,
  CalendarDays,
  BarChart3,
  ShoppingCart,
  FileText,
} from "lucide-react-native";

interface SideNavigationProps {
  onClose: () => void;
}

const SideNavigation = ({ onClose }: SideNavigationProps) => {
  const router = useRouter();
  const { height } = Dimensions.get("window");

  const navigateTo = (route: string) => {
    router.push(route);
    onClose();
  };

  const navigationItems = [
    { key: "home", label: "Dashboard", icon: Home, route: "/" },
    {
      key: "products",
      label: "Products",
      icon: ShoppingBag,
      route: "/products",
    },
    { key: "customers", label: "Customers", icon: Users, route: "/customers" },
    { key: "orders", label: "Orders", icon: ShoppingCart, route: "/orders" },
    { key: "events", label: "Events", icon: CalendarDays, route: "/events" },
    { key: "finances", label: "Finances", icon: BarChart3, route: "/finances" },
    { key: "invoices", label: "Invoices", icon: FileText, route: "/invoices" },
    { key: "employees", label: "Employees", icon: Users, route: "/employees" },
  ];

  const accountItems = [
    { key: "profile", label: "My Profile", icon: User, route: "/profile" },
    { key: "settings", label: "Settings", icon: Settings, route: "/settings" },
    {
      key: "logs",
      label: "Activity Logs",
      icon: ClipboardList,
      route: "/logs",
    },
    { key: "logout", label: "Logout", icon: LogOut, route: "/login" },
  ];

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} />

      <View
        style={[styles.container, { height }]}
        className="bg-white w-4/5 max-w-xs shadow-xl"
      >
        <View className="p-4 border-b border-gray-200 flex-row justify-between items-center">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-blue-500 mr-3 items-center justify-center">
              <Text className="text-white font-bold text-lg">R</Text>
            </View>
            <Text className="text-xl font-bold text-gray-800">
              Rental Manager
            </Text>
          </View>

          <TouchableOpacity onPress={onClose} className="p-2">
            <X size={24} color="#4b5563" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1">
          <View className="p-4">
            <Text className="text-gray-500 font-medium mb-2 text-xs uppercase tracking-wider">
              Main Navigation
            </Text>
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <TouchableOpacity
                  key={item.key}
                  className="flex-row items-center py-3 px-2 rounded-lg mb-1 hover:bg-gray-100"
                  onPress={() => navigateTo(item.route)}
                >
                  <IconComponent size={20} color="#4b5563" className="mr-3" />
                  <Text className="text-gray-800 font-medium">
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View className="p-4 border-t border-gray-200">
            <Text className="text-gray-500 font-medium mb-2 text-xs uppercase tracking-wider">
              Account
            </Text>
            {accountItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <TouchableOpacity
                  key={item.key}
                  className="flex-row items-center py-3 px-2 rounded-lg mb-1 hover:bg-gray-100"
                  onPress={() => navigateTo(item.route)}
                >
                  <IconComponent size={20} color="#4b5563" className="mr-3" />
                  <Text className="text-gray-800 font-medium">
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    flexDirection: "row",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  container: {
    position: "relative",
    zIndex: 1001,
  },
});

export default SideNavigation;
