import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import {
  TrendingUp,
  Calendar,
  DollarSign,
  PackageCheck,
  AlertCircle,
} from "lucide-react-native";
import { getDashboardSummary } from "../../services/dashboardService";

interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

const SummaryCard = ({
  title = "Metric",
  value = "0",
  icon = <TrendingUp size={20} color="#4F46E5" />,
  trend = "+0%",
  trendUp = true,
}: SummaryCardProps) => {
  return (
    <View className="bg-white rounded-xl p-4 shadow-sm mr-3 w-[160px]">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-gray-500 text-xs font-medium flex-1" numberOfLines={1} ellipsizeMode="tail">{title}</Text>
        <View className="bg-indigo-100 p-1.5 rounded-full">{icon}</View>
      </View>
      <Text className="text-xl font-bold mb-1" numberOfLines={1} ellipsizeMode="tail">{value}</Text>
      <View className="flex-row items-center">
        <Text
          className={`text-xs font-medium ${trendUp ? "text-green-600" : "text-red-600"}`}
        >
          {trend}
        </Text>
        <Text className="text-xs text-gray-500 ml-1" numberOfLines={1} ellipsizeMode="tail">vs last month</Text>
      </View>
    </View>
  );
};

interface DashboardSummaryProps {
  monthlyRevenue?: number;
  upcomingEvents?: number;
  activeRentals?: number;
  pendingReturns?: number;
}

const DashboardSummary = ({
  monthlyRevenue: propMonthlyRevenue,
  upcomingEvents: propUpcomingEvents,
  activeRentals: propActiveRentals,
  pendingReturns: propPendingReturns,
}: DashboardSummaryProps) => {
  const [summaryData, setSummaryData] = useState({
    monthlyRevenue: propMonthlyRevenue || 0,
    upcomingEvents: propUpcomingEvents || 0,
    activeRentals: propActiveRentals || 0,
    pendingReturns: propPendingReturns || 0,
    trends: {
      monthlyRevenue: "+0%",
      upcomingEvents: "+0%",
      activeRentals: "+0%",
      pendingReturns: "+0%"
    },
    trendsUp: {
      monthlyRevenue: true,
      upcomingEvents: true,
      activeRentals: true,
      pendingReturns: true
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from API if props are not provided
  useEffect(() => {
    // If all props are provided, don't fetch
    if (propMonthlyRevenue && propUpcomingEvents && propActiveRentals && propPendingReturns) {
      setIsLoading(false);
      return;
    }

    const fetchSummaryData = async () => {
      try {
        setIsLoading(true);
        const data = await getDashboardSummary();
        
        // Create default trends data since API doesn't provide it
        const defaultTrends = {
          monthlyRevenue: "+0%",
          upcomingEvents: "+0%",
          activeRentals: "+0%",
          pendingReturns: "+0%"
        };

        // Create default trendsUp data since API doesn't provide it
        const defaultTrendsUp = {
          monthlyRevenue: true,
          upcomingEvents: true,
          activeRentals: true,
          pendingReturns: true
        };
        
        setSummaryData({
          monthlyRevenue: data.monthlyRevenue || 0,
          upcomingEvents: data.upcomingEventsCount || 0,
          activeRentals: data.activeRentalsCount || 0,
          pendingReturns: data.pendingReturns || 0,
          trends: defaultTrends,
          trendsUp: defaultTrendsUp
        });
      } catch (err) {
        console.error('Error fetching dashboard summary:', err);
        setError('Failed to load summary data');
        
        // Use zero values rather than mock data
        setSummaryData({
          monthlyRevenue: 0,
          upcomingEvents: 0,
          activeRentals: 0,
          pendingReturns: 0,
          trends: {
            monthlyRevenue: "+0%",
            upcomingEvents: "+0%",
            activeRentals: "+0%",
            pendingReturns: "+0%"
          },
          trendsUp: {
            monthlyRevenue: true,
            upcomingEvents: true,
            activeRentals: true,
            pendingReturns: true
          }
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummaryData();
  }, [propMonthlyRevenue, propUpcomingEvents, propActiveRentals, propPendingReturns]);

  if (isLoading) {
    return (
      <View className="bg-gray-50 p-4 rounded-lg">
        <Text className="text-lg font-bold mb-3">Business Overview</Text>
        <View className="items-center justify-center py-6">
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="bg-gray-50 p-4 rounded-lg">
        <Text className="text-lg font-bold mb-3">Business Overview</Text>
        <View className="items-center justify-center py-6">
          <AlertCircle size={24} color="#EF4444" />
          <Text className="text-red-500 mt-2">{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-gray-50 p-4 rounded-lg">
      <Text className="text-lg font-bold mb-3">Business Overview</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-1 px-3.5"
        contentContainerStyle={{ paddingRight: 16 }}
      >
        <SummaryCard
          title="Monthly Revenue"
          value={`$${summaryData.monthlyRevenue.toLocaleString()}`}
          icon={<DollarSign size={20} color="#4F46E5" />}
          trend={summaryData.trends.monthlyRevenue}
          trendUp={summaryData.trendsUp.monthlyRevenue}
        />
        <SummaryCard
          title="Upcoming Events"
          value={summaryData.upcomingEvents.toString()}
          icon={<Calendar size={20} color="#4F46E5" />}
          trend={summaryData.trends.upcomingEvents}
          trendUp={summaryData.trendsUp.upcomingEvents}
        />
        <SummaryCard
          title="Active Rentals"
          value={summaryData.activeRentals.toString()}
          icon={<PackageCheck size={20} color="#4F46E5" />}
          trend={summaryData.trends.activeRentals}
          trendUp={summaryData.trendsUp.activeRentals}
        />
        <SummaryCard
          title="Pending Returns"
          value={summaryData.pendingReturns.toString()}
          icon={<AlertCircle size={20} color="#4F46E5" />}
          trend={summaryData.trends.pendingReturns}
          trendUp={summaryData.trendsUp.pendingReturns}
        />
      </ScrollView>
    </View>
  );
};

export default DashboardSummary;
