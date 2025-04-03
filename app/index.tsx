import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, View, ScrollView, Text, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

// Import components
import Header from "../components/Header";
import BottomNavigation from "../components/navigation/BottomNavigation";
import DashboardSummary from "../components/dashboard/DashboardSummary";
import ActiveRentals from "../components/dashboard/ActiveRentals";
import UpcomingEvents from "../components/dashboard/UpcomingEvents";
import NotificationCenter from "../components/dashboard/NotificationCenter";

// Import API
import api from "../services/api";
import { getDashboardData, getUpcomingEventsForDashboard, getActiveRentalsForDashboard } from "../services/dashboardService";

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Handle notification press
  const handleNotificationPress = () => {
    router.push("/notifications" as any);
  };
  
  // Handle view rental press
  const handleViewRental = (id: string) => {
    router.push(`/orders/view?id=${id}` as any);
  };
  
  // Handle view all events
  const handleViewAllEvents = () => {
    router.push("/events" as any);
  };

  const [dashboardData, setDashboardData] = useState<{
    monthlyRevenue: number;
    activeRentalsCount: number;
    upcomingEventsCount: number;
    pendingReturns: number;
    activeRentals: any[];
    upcomingEvents: any[];
    notifications: any[];
  }>({
    monthlyRevenue: 0,
    activeRentalsCount: 0,
    upcomingEventsCount: 0,
    pendingReturns: 0,
    activeRentals: [],
    upcomingEvents: [],
    notifications: []
  });

  // Add error handling script for Tempo
  useEffect(() => {
    if (typeof document !== "undefined" && process.env.EXPO_PUBLIC_TEMPO) {
      const script = document.createElement("script");
      script.src =
        "https://api.tempolabs.ai/proxy-asset?url=https://storage.googleapis.com/tempo-public-assets/error-handling.js";
      document.head.appendChild(script);
    }
  }, []);

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const data = await getDashboardData();
        
        // Fetch upcoming events directly to ensure latest data
        const events = await getUpcomingEventsForDashboard();
        
        setDashboardData({
          ...data,
          upcomingEvents: events,
          upcomingEventsCount: events.length
        });
        
        setError(null);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please check your connection and try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <StatusBar style="dark" />
      <Header title="Dashboard" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-600 mt-4">Loading dashboard...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-red-500 text-center px-4">{error}</Text>
          </View>
        ) : (
          <View className="p-4 space-y-4">
            <DashboardSummary
              activeRentals={dashboardData.activeRentalsCount}
              upcomingEvents={dashboardData.upcomingEventsCount}
              monthlyRevenue={dashboardData.monthlyRevenue}
              pendingReturns={dashboardData.pendingReturns}
            />

            <ActiveRentals 
              rentals={dashboardData.activeRentals} 
              onViewRental={handleViewRental} 
            />

            <UpcomingEvents 
              events={dashboardData.upcomingEvents} 
              onViewAll={handleViewAllEvents} 
            />

            <NotificationCenter
              notifications={dashboardData.notifications}
            />
          </View>
        )}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0">
        <BottomNavigation activeTab="dashboard" />
      </View>
    </View>
  );
}
