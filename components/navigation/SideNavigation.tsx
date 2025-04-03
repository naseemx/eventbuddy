import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  StyleSheet,
  Platform,
  StatusBar,
  Easing,
} from "react-native";
import { useRouter } from "expo-router";
import {
  User,
  Settings,
  Users,
  LogOut,
  X,
  Home,
  ShoppingBag,
  CalendarDays,
  BarChart3,
  ShoppingCart,
  FileText,
  HelpCircle,
  MessageSquare,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SideNavigationProps {
  onClose: () => void;
}

// Define the supported route types to match expo-router expectations
type AppRoute = 
  | "/"
  | "/products"
  | "/customers" 
  | "/orders" 
  | "/events" 
  | "/finances" 
  | "/invoices" 
  | "/employees" 
  | "/profile" 
  | "/settings" 
  | "/login";

const SideNavigation = ({ onClose }: SideNavigationProps) => {
  const router = useRouter();
  const { height, width } = Dimensions.get("window");
  const insets = useSafeAreaInsets();
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Animate closing
  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -width * 0.8,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const navigateTo = (route: AppRoute) => {
    // Start closing animation and then navigate
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -width * 0.8,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
    router.push(route);
    onClose();
    });
  };

  const navigationItems = [
    { key: "home", label: "Dashboard", icon: Home, route: "/" as AppRoute },
    {
      key: "products",
      label: "Products",
      icon: ShoppingBag,
      route: "/products" as AppRoute,
    },
    { key: "customers", label: "Customers", icon: Users, route: "/customers" as AppRoute },
    { key: "orders", label: "Orders", icon: ShoppingCart, route: "/orders" as AppRoute },
    { key: "events", label: "Events", icon: CalendarDays, route: "/events" as AppRoute },
    { key: "finances", label: "Finances", icon: BarChart3, route: "/finances" as AppRoute },
    { key: "invoices", label: "Invoices", icon: FileText, route: "/invoices" as AppRoute },
    { key: "employees", label: "Employees", icon: Users, route: "/employees" as AppRoute },
  ];

  const accountItems = [
    { key: "profile", label: "Company Profile", icon: User, route: "/profile" as AppRoute },
    { key: "settings", label: "Settings", icon: Settings, route: "/settings" as AppRoute },
    { key: "help", label: "Help & Support", icon: HelpCircle, route: "/settings" as AppRoute },
    { key: "logout", label: "Logout", icon: LogOut, route: "/login" as AppRoute },
  ];

  // Calculate status bar height for proper spacing
  const statusBarHeight = Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight || 0;

  return (
    <View style={styles.overlay}>
      <Animated.View 
        style={[
          styles.backdrop, 
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={handleClose}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.container, 
          { 
            height: '100%',
            paddingTop: statusBarHeight,
            transform: [{ translateX: slideAnim }] 
          }
        ]}
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

          <TouchableOpacity 
            onPress={handleClose} 
            className="p-2"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color="#4b5563" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-4">
            <Text className="text-gray-500 font-medium mb-2 text-xs uppercase tracking-wider">
              Main Navigation
            </Text>
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <TouchableOpacity
                  key={item.key}
                  className="flex-row items-center py-3.5 px-3 rounded-lg mb-1 active:bg-gray-100"
                  onPress={() => navigateTo(item.route)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                >
                  <View className="w-8 items-center">
                    <IconComponent size={20} color="#4b5563" />
                  </View>
                  <Text className="text-gray-800 font-medium ml-3">
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View className="p-4 border-t border-gray-200 mb-4">
            <Text className="text-gray-500 font-medium mb-2 text-xs uppercase tracking-wider">
              Account
            </Text>
            {accountItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <TouchableOpacity
                  key={item.key}
                  className="flex-row items-center py-3.5 px-3 rounded-lg mb-1 active:bg-gray-100"
                  onPress={() => navigateTo(item.route)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                >
                  <View className="w-8 items-center">
                    <IconComponent size={20} color="#4b5563" />
                  </View>
                  <Text className="text-gray-800 font-medium ml-3">
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
        
        <View className="p-4 border-t border-gray-200">
          <Text className="text-gray-500 text-sm text-center">
            Version 1.0.0
          </Text>
      </View>
      </Animated.View>
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
