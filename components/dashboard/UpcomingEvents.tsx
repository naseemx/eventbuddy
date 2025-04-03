import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Calendar, Users, ChevronRight } from "lucide-react-native";
import { router } from "expo-router";
import { getUpcomingEventsForDashboard } from "../../services/dashboardService";
import { Event } from "../../types";

interface EventProps {
  id: string;
  title: string;
  date: string;
  location: string;
  staffCount: number;
  onPress?: () => void;
}

interface UpcomingEventsProps {
  events?: EventProps[];
  onViewAll?: () => void;
}

const EventItem = ({
  id,
  title,
  date,
  location,
  staffCount,
  onPress = () => router.push(`/events/view?id=${id}`),
}: EventProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center p-3 mb-2 bg-white rounded-lg shadow-sm border border-gray-100"
      activeOpacity={0.7}
      hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
      delayPressIn={200}
    >
      <View className="h-10 w-10 rounded-full bg-blue-100 items-center justify-center mr-3">
        <Calendar size={20} color="#3b82f6" />
      </View>
      <View className="flex-1 mr-2">
        <Text className="font-medium text-gray-900" numberOfLines={1} ellipsizeMode="tail">{title}</Text>
        <Text className="text-sm text-gray-500" numberOfLines={1} ellipsizeMode="tail">
          {date} • {location}
        </Text>
      </View>
      <View className="flex-row items-center">
        <Users size={16} color="#6b7280" />
        <Text className="ml-1 mr-2 text-gray-500">{staffCount}</Text>
        <ChevronRight size={16} color="#9ca3af" />
      </View>
    </TouchableOpacity>
  );
};

const UpcomingEvents = ({
  events: propEvents,
  onViewAll = () => router.push('/events'),
}: UpcomingEventsProps) => {
  const [events, setEvents] = useState<EventProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If events are provided via props, use them
    if (propEvents && propEvents.length > 0) {
      console.log('Using provided events:', propEvents);
      setEvents(propEvents);
      setIsLoading(false);
      return;
    }

    // Otherwise fetch from Supabase
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching upcoming events for dashboard...');
        const fetchedEvents = await getUpcomingEventsForDashboard();
        console.log(`Successfully fetched ${fetchedEvents.length} events:`, fetchedEvents);
        setEvents(fetchedEvents);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events');
        
        // Don't use mock data, show empty state instead
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [propEvents]);

  return (
    <View className="bg-gray-50 p-4 rounded-xl">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-lg font-semibold text-gray-900">
          Upcoming Events
        </Text>
        <TouchableOpacity 
          onPress={onViewAll}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text className="text-blue-600 font-medium">View All</Text>
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
      ) : events.length === 0 ? (
        <View className="h-[180px] items-center justify-center">
          <Calendar size={24} color="#9CA3AF" />
          <Text className="text-gray-500 mt-2">No upcoming events</Text>
        </View>
      ) : (
        <ScrollView
          className="max-h-[180px]"
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
          nestedScrollEnabled={true}
          contentContainerStyle={{ paddingVertical: 2 }}
        >
          {events.map((event) => (
            <EventItem key={event.id} {...event} />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default UpcomingEvents;
