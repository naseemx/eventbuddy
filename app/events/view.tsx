import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import PageTransition from "../../components/animations/PageTransition";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Clock,
  Edit,
  Trash2,
  User,
  AlertCircle,
  FileText,
  XCircle,
  Check,
  ChevronDown,
} from "lucide-react-native";

import Header from "../../components/Header";
import { supabase } from "../../lib/supabase";

interface EventDetails {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string;
  status: "Upcoming" | "Ended" | "Cancelled";
  created_at: string;
  updated_at: string;
}

interface StaffMember {
  id: string;
  name: string;
  position: string;
  phone: string;
  email: string;
}

export default function EventViewScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [assignedStaff, setAssignedStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEventDetails();
    }
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch event details with customer information
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select(`
          *,
          customers:customer_id (
            name,
            email,
            phone
          )
        `)
        .eq('id', id)
        .single();
      
      if (eventError) throw eventError;
      
      if (eventData) {
        // Format the event data
        setEvent({
          id: eventData.id,
          title: eventData.title,
          date: eventData.date,
          time: eventData.time || '',
          venue: eventData.venue || '',
          address: eventData.address || '',
          customer_id: eventData.customer_id,
          customer_name: eventData.customers?.name || 'Unknown Customer',
          customer_email: eventData.customers?.email || '',
          customer_phone: eventData.customers?.phone || '',
          notes: eventData.notes || '',
          status: eventData.status || 'Upcoming',
          created_at: eventData.created_at,
          updated_at: eventData.updated_at
        });
        
        // Fetch assigned staff
        const { data: staffData, error: staffError } = await supabase
          .from('event_staff')
          .select(`
            employees:employee_id (
              id,
              name,
              email,
              phone
            )
          `)
          .eq('event_id', id);
        
        if (staffError) throw staffError;
        
        // Format staff data
        if (staffData && staffData.length > 0) {
          const formattedStaff = staffData
            .map(item => {
              if (item.employees) {
                // Use type assertion to handle the employees object properly
                const employee = item.employees as any;
                return {
                  id: employee.id,
                  name: employee.name,
                  position: 'Staff', // Default position since it doesn't exist in the database
                  phone: employee.phone || '',
                  email: employee.email || ''
                };
              }
              return null;
            })
            .filter(Boolean) as StaffMember[];
          
          setAssignedStaff(formattedStaff);
        }
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
      setError('Failed to load event details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditEvent = () => {
    router.push(`/events/add?id=${id}`);
  };

  const handleDeleteEvent = () => {
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      
      // First delete related records from event_staff
      await supabase
        .from('event_staff')
        .delete()
        .eq('event_id', id);
      
      // Then delete the event
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setShowDeleteConfirmation(false);
      // Always navigate to events index page after successful deletion
      router.replace('/events');
    } catch (error) {
      console.error('Error deleting event:', error);
      Alert.alert('Error', 'Failed to delete event. Please try again.');
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
  };
  
  const handleStatusChange = async (newStatus: "Upcoming" | "Ended" | "Cancelled") => {
    if (!event) return;
    
    try {
      setIsUpdatingStatus(true);
      
      const { error } = await supabase
        .from('events')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state with new status
      setEvent({ ...event, status: newStatus });
      
      // Close the modal
      setShowStatusModal(false);
      
      // Show success message
      Alert.alert('Success', `Event status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating event status:', error);
      Alert.alert('Error', 'Failed to update event status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Upcoming":
        return "bg-blue-100 text-blue-800";
      case "Ended":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading event details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !event) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 justify-center items-center p-6">
        <AlertCircle size={40} color="#EF4444" />
        <Text className="mt-4 text-gray-800 font-medium text-center">
          {error || "Event not found"}
        </Text>
        <TouchableOpacity 
          className="mt-4 bg-blue-500 px-4 py-2 rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-white font-medium">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <PageTransition type="slide">
      <SafeAreaView className="flex-1 bg-gray-100">
        <Header
          title="Event Details"
          leftIcon={<ArrowLeft size={24} color="#000" />}
          onLeftPress={() => router.back()}
        />

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom }}
        >
          {/* Event Info Card */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-900">
                  {event.title}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowStatusModal(true)}
                className={`px-3 py-1.5 rounded-full ${getStatusColor(event.status)}`}
              >
                <View className="flex-row items-center">
                  <Text className="text-xs font-medium">{event.status}</Text>
                  <ChevronDown size={12} className="ml-1" color={event.status === "Upcoming" ? "#1E40AF" : event.status === "Ended" ? "#065F46" : "#991B1B"} />
                </View>
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <View className="flex-row items-center mb-2">
                <Calendar size={16} color="#6B7280" />
                <Text className="text-gray-700 ml-2">
                  {event.date}
                </Text>
              </View>
              
              {event.time && (
                <View className="flex-row items-center mb-2">
                  <Clock size={16} color="#6B7280" />
                  <Text className="text-gray-700 ml-2">
                    {event.time}
                  </Text>
                </View>
              )}
              
              {event.venue && (
                <View className="flex-row items-center mb-2">
                  <MapPin size={16} color="#6B7280" />
                  <Text className="text-gray-700 ml-2">
                    {event.venue}
                </Text>
                </View>
              )}
              
              {event.address && (
                <View className="flex-row">
                  <Text className="text-gray-500 ml-6">
                    {event.address}
                </Text>
              </View>
              )}
            </View>

            <View className="flex-row justify-between mt-2">
              <TouchableOpacity
                className="flex-row items-center bg-blue-50 px-4 py-2.5 rounded-xl"
                onPress={handleEditEvent}
              >
                <Edit size={16} color="#3B82F6" />
                <Text className="text-blue-600 font-medium ml-2">Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-row items-center bg-red-50 px-4 py-2.5 rounded-xl"
                onPress={handleDeleteEvent}
              >
                <Trash2 size={16} color="#EF4444" />
                <Text className="text-red-600 font-medium ml-2">Delete</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Customer Info */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-3 text-gray-900">
              Customer Information
            </Text>
            <TouchableOpacity
              className="flex-row items-center mb-2"
              onPress={() => router.push(`/customers/view?id=${event.customer_id}`)}
            >
              <User size={16} color="#6B7280" />
              <Text className="text-blue-600 font-medium ml-2">
                {event.customer_name}
              </Text>
            </TouchableOpacity>
            {event.customer_email && (
            <Text className="text-gray-600 ml-6 mb-1">
                {event.customer_email}
              </Text>
            )}
            {event.customer_phone && (
              <Text className="text-gray-600 ml-6">
                {event.customer_phone}
            </Text>
            )}
          </View>

          {/* Notes Section */}
          {event.notes && (
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
              <View className="flex-row items-center mb-3">
                <FileText size={18} color="#4B5563" />
                <Text className="text-lg font-bold ml-2 text-gray-900">
                  Notes
                </Text>
              </View>
              <Text className="text-gray-700">{event.notes}</Text>
          </View>
          )}

          {/* Assigned Staff */}
          {assignedStaff.length > 0 && (
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
              <View className="flex-row items-center mb-3">
                <Users size={18} color="#4B5563" />
                <Text className="text-lg font-bold ml-2 text-gray-900">
              Assigned Staff
            </Text>
              </View>
            {assignedStaff.map((staff) => (
              <TouchableOpacity
                key={staff.id}
                className="flex-row justify-between items-center p-3 mb-2 bg-gray-50 rounded-lg"
                onPress={() => router.push(`/employees/view?id=${staff.id}`)}
              >
                <View>
                  <Text className="font-medium text-gray-900">
                    {staff.name}
                  </Text>
                    <Text className="text-sm text-gray-500">{staff.position}</Text>
                </View>
                  {staff.phone && (
                <Text className="text-gray-600">{staff.phone}</Text>
                  )}
              </TouchableOpacity>
            ))}
          </View>
          )}
        </ScrollView>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={showDeleteConfirmation}
          transparent={true}
          animationType="fade"
          onRequestClose={cancelDelete}
        >
          <View className="flex-1 bg-black/50 justify-center items-center p-5">
            <View className="bg-white rounded-xl w-full p-5">
              <View className="items-center mb-4">
                <AlertCircle size={40} color="#EF4444" />
              </View>
              
              <Text className="text-xl font-bold text-center mb-2">Delete Event</Text>
              <Text className="text-gray-600 text-center mb-5">
                Are you sure you want to delete this event? This action cannot be undone.
              </Text>
              
              <View className="flex-row justify-center">
                <TouchableOpacity 
                  className="bg-gray-200 rounded-lg px-5 py-3 mr-3 flex-row items-center"
                  onPress={cancelDelete}
                  disabled={isDeleting}
                >
                  <XCircle size={18} color="#4B5563" />
                  <Text className="text-gray-700 font-medium ml-2">Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  className="bg-red-500 rounded-lg px-5 py-3 flex-row items-center"
                  onPress={confirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Trash2 size={18} color="#FFFFFF" />
                      <Text className="text-white font-medium ml-2">Delete</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Status Change Modal */}
        <Modal
          visible={showStatusModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowStatusModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center p-5">
            <View className="bg-white rounded-xl w-full p-5">
              <View className="items-center mb-4">
                <Calendar size={40} color="#4B5563" />
              </View>
              
              <Text className="text-xl font-bold text-center mb-2">Change Event Status</Text>
              <Text className="text-gray-600 text-center mb-5">
                Select a new status for this event
              </Text>
              
              <View className="mb-5">
                <TouchableOpacity 
                  className={`p-3 mb-2 rounded-lg flex-row justify-between items-center ${
                    event.status === "Upcoming" ? "bg-blue-50 border border-blue-300" : "bg-gray-50"
                  }`}
                  onPress={() => handleStatusChange("Upcoming")}
                  disabled={isUpdatingStatus}
                >
                  <Text className={`font-medium ${
                    event.status === "Upcoming" ? "text-blue-700" : "text-gray-700"
                  }`}>Upcoming</Text>
                  {event.status === "Upcoming" && (
                    <Check size={18} color="#1E40AF" />
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  className={`p-3 mb-2 rounded-lg flex-row justify-between items-center ${
                    event.status === "Ended" ? "bg-green-50 border border-green-300" : "bg-gray-50"
                  }`}
                  onPress={() => handleStatusChange("Ended")}
                  disabled={isUpdatingStatus}
                >
                  <Text className={`font-medium ${
                    event.status === "Ended" ? "text-green-700" : "text-gray-700"
                  }`}>Ended</Text>
                  {event.status === "Ended" && (
                    <Check size={18} color="#065F46" />
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  className={`p-3 rounded-lg flex-row justify-between items-center ${
                    event.status === "Cancelled" ? "bg-red-50 border border-red-300" : "bg-gray-50"
                  }`}
                  onPress={() => handleStatusChange("Cancelled")}
                  disabled={isUpdatingStatus}
                >
                  <Text className={`font-medium ${
                    event.status === "Cancelled" ? "text-red-700" : "text-gray-700"
                  }`}>Cancelled</Text>
                  {event.status === "Cancelled" && (
                    <Check size={18} color="#991B1B" />
                  )}
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                className="bg-gray-200 rounded-lg p-3 flex-row justify-center items-center"
                onPress={() => setShowStatusModal(false)}
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? (
                  <ActivityIndicator size="small" color="#4B5563" />
                ) : (
                  <Text className="text-gray-700 font-medium">Cancel</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </PageTransition>
  );
}
