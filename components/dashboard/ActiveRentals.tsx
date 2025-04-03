import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Calendar, Clock, User, PackageCheck, CreditCard } from "lucide-react-native";
import { router } from "expo-router";
import { getActiveRentalsForDashboard } from "../../services/dashboardService";

interface RentalItem {
  id: string;
  customerName: string;
  items: string[];
  returnDate: string;
  daysRemaining: number;
  paymentStatus?: string;
}

interface ActiveRentalsProps {
  rentals?: RentalItem[];
  onViewRental?: (id: string) => void;
}

const ActiveRentals = ({
  rentals: propRentals,
  onViewRental = (id) => {
    router.push(`/orders/view?id=${id}`);
  },
}: ActiveRentalsProps) => {
  const [rentals, setRentals] = useState<RentalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If rentals are provided as props, use them
    if (propRentals && propRentals.length > 0) {
      setRentals(propRentals);
      setIsLoading(false);
      return;
    }

    // Otherwise fetch from Supabase
    const fetchRentals = async () => {
      try {
        setIsLoading(true);
        // Use the new dashboard service function
        const fetchedRentals = await getActiveRentalsForDashboard();
        setRentals(fetchedRentals);
      } catch (err) {
        console.error('Error fetching rentals:', err);
        setError('Failed to load rentals');
        // Don't use mock data, show empty state instead
        setRentals([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRentals();
  }, [propRentals]);

  return (
    <View className="bg-white p-4 rounded-lg shadow-sm">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-lg font-bold">Active Rentals</Text>
        <TouchableOpacity 
          onPress={() => router.push("/orders" as any)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text className="text-blue-500">View All</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="h-[180px] items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : error ? (
        <View className="h-[180px] items-center justify-center">
          <Text className="text-red-500">{error}</Text>
        </View>
      ) : rentals.length === 0 ? (
        <View className="h-[180px] items-center justify-center">
          <PackageCheck size={24} color="#9CA3AF" />
          <Text className="text-gray-500 mt-2">No active rentals</Text>
        </View>
      ) : (
        <ScrollView
          className="max-h-[180px]"
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
          nestedScrollEnabled={true}
          contentContainerStyle={{ paddingVertical: 2 }}
        >
          {rentals.map((rental) => (
            <TouchableOpacity
              key={rental.id}
              className={`p-3 mb-2 rounded-md border-l-4 ${rental.daysRemaining <= 2 ? "border-red-500 bg-red-50" : "border-green-500 bg-white"}`}
              onPress={() => onViewRental(rental.id)}
              activeOpacity={0.7}
              hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
              delayPressIn={200}
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-2">
                  <View className="flex-row items-center mb-1">
                    <User size={14} className="text-gray-600 mr-1" />
                    <Text className="font-semibold" numberOfLines={1} ellipsizeMode="tail">{rental.customerName}</Text>
                  </View>
                  <Text className="text-gray-600 text-sm mb-1" numberOfLines={1} ellipsizeMode="tail">
                    {rental.items.length > 1
                      ? `${rental.items[0]} +${rental.items.length - 1} more`
                      : rental.items[0]}
                  </Text>
                  <View className="flex-row items-center">
                    <Calendar size={14} className="text-gray-500 mr-1" />
                    <Text className="text-gray-500 text-xs" numberOfLines={1} ellipsizeMode="tail">
                      {rental.returnDate}
                    </Text>
                  </View>
                </View>
                <View>
                  <View className="flex items-center justify-center bg-gray-100 px-2 py-1 rounded mb-1">
                    <Clock size={12} className="text-gray-600 mb-1" />
                    <Text
                      className={`text-xs font-medium ${rental.daysRemaining <= 2 ? "text-red-600" : "text-gray-600"}`}
                    >
                      {rental.daysRemaining}{" "}
                      {rental.daysRemaining === 1 ? "day" : "days"}
                    </Text>
                  </View>
                  
                  {rental.paymentStatus && (
                    <View className="flex-row items-center justify-center bg-gray-100 px-2 py-1 rounded">
                      <CreditCard size={12} className={`mr-1 ${rental.paymentStatus === 'Paid' ? 'text-green-600' : 'text-amber-600'}`} />
                      <Text className={`text-xs font-medium ${rental.paymentStatus === 'Paid' ? 'text-green-600' : 'text-amber-600'}`}>
                        {rental.paymentStatus}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default ActiveRentals;
