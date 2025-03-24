import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeft, Save, Plus, X, Calendar, Clock, User, ChevronDown, Check } from "lucide-react-native";

import Header from "../../components/Header";
import { supabase } from "../../lib/supabase";

// Interfaces
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
}

// Form state interface to properly type the formData
interface EventFormData {
  title: string;
  date: string;
  time: string;  // Make this required (not nullable)
  venue: string;
  address: string;
  customer_id: string;
  customer_name: string;
  notes: string;
  status: string;
}

// Helper function to format dates without date-fns
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to format times without date-fns
const formatTime = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  // Ensure we always have a valid format: HH:MM
  const formattedTime = `${hours}:${minutes}`;
  console.log("Formatted time:", formattedTime);
  
  return formattedTime;
};

// Helper function to pad numbers with leading zeros
const padNumber = (num: number) => {
  return num.toString().padStart(2, '0');
};

// Add debugging function to help trace issues
const logEventData = (data: any, label: string) => {
  console.log(`--- ${label} ---`);
  console.log("Data:", JSON.stringify(data));
  if (data && data.time) {
    console.log("Time value:", data.time);
    console.log("Time type:", typeof data.time);
    console.log("Time length:", data.time.length);
    console.log("Time regex match:", /^\d{2}:\d{2}$/.test(data.time));
  } else {
    console.log("No time value found");
  }
  console.log(`--- End ${label} ---`);
};

export default function EventAddScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isEditMode = !!id;

  // Form state
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    date: "",
    time: "",  // Initialize as empty string
    venue: "",
    address: "",
    customer_id: "",
    customer_name: "",
    notes: "",
    status: "Upcoming",
  });

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(isEditMode);
  
  // Customer selection states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  
  // Employee selection states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  
  // Date and time picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Date picker state
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [day, setDay] = useState(new Date().getDate());
  
  // Time picker state
  const [hour, setHour] = useState(new Date().getHours());
  const [minute, setMinute] = useState(new Date().getMinutes());
  
  // Generate arrays for picker options
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);
  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  
  // Fetch event data for edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchEventData();
    }
  }, [id]);
  
  // Load customers and employees on mount
  useEffect(() => {
    fetchCustomers();
    fetchEmployees();
  }, []);

  // Fetch event data for editing
  const fetchEventData = async () => {
    try {
      setIsFetchingData(true);
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          customers:customer_id (name),
          event_staff (employee_id)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        // Ensure time is always a string, not null
        let timeValue = data.time || "";
        if (timeValue) {
          console.log("Found time in event data:", timeValue);
        } else {
          console.log("No time in event data, using empty string");
        }
        
        setFormData({
          title: data.title || "",
          date: data.date || "",
          time: timeValue,
          venue: data.venue || "",
          address: data.address || "",
          customer_id: data.customer_id || "",
          customer_name: data.customers?.name || "",
          notes: data.notes || "",
          status: data.status || "Upcoming",
        });
        
        // Set date from the stored date if available
        if (data.date) {
          const [yearStr, monthStr, dayStr] = data.date.split('-').map(Number);
          setYear(yearStr);
          setMonth(monthStr - 1); // Month is 0-indexed in JS
          setDay(dayStr);
          
          // If time is available, set it
          if (data.time) {
            const [hourStr, minuteStr] = data.time.split(':').map(Number);
            setHour(hourStr);
            setMinute(minuteStr);
          }
          
          const date = new Date(yearStr, monthStr - 1, dayStr);
          if (data.time) {
            const [hours, minutes] = data.time.split(':').map(Number);
            date.setHours(hours, minutes);
          }
          setSelectedDate(date);
        }
        
        // Set selected employees
        if (data.event_staff && Array.isArray(data.event_staff)) {
          const staffIds = data.event_staff.map((staff: any) => staff.employee_id);
          setSelectedEmployees(staffIds);
        }
      }
    } catch (error) {
      console.error('Error fetching event data:', error);
    } finally {
      setIsFetchingData(false);
    }
  };

  // Fetch customers from the database
  const fetchCustomers = async () => {
    try {
      setIsLoadingCustomers(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoadingCustomers(false);
    }
  };
  
  // Fetch employees from the database
  const fetchEmployees = async () => {
    try {
      setIsLoadingEmployees(true);
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const handleChange = (field: keyof EventFormData, value: string) => {
    console.log(`Setting ${field} to:`, value, typeof value);
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    if (selectedEmployees.includes(employeeId)) {
      setSelectedEmployees(selectedEmployees.filter((id) => id !== employeeId));
    } else {
      setSelectedEmployees([...selectedEmployees, employeeId]);
    }
  };

  const selectCustomer = (customer: Customer) => {
    handleChange('customer_id', customer.id);
    handleChange('customer_name', customer.name);
    setShowCustomerModal(false);
  };

  // Open date picker 
  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  // Open time picker
  const openTimePicker = () => {
    setShowTimePicker(true);
  };

  // Handle date selection and confirm
  const handleDateConfirm = () => {
    // Create new date with selected values
    const newDate = new Date(year, month, day);
    setSelectedDate(newDate);
    
    // Format and update form
    const formattedDate = formatDate(newDate);
    handleChange('date', formattedDate);
    
    // Close modal
    setShowDatePicker(false);
  };
  
  // Handle time selection and confirm
  const handleTimeConfirm = () => {
    // Create new date with selected time values
    const newDate = new Date(selectedDate);
    newDate.setHours(hour);
    newDate.setMinutes(minute);
    setSelectedDate(newDate);
    
    // Format time as HH:MM with leading zeros
    const formattedTime = formatTime(newDate);
    console.log("Setting formatted time:", formattedTime);
    handleChange('time', formattedTime);
    
    // Close modal
    setShowTimePicker(false);
  };

  const handleAddNewCustomer = () => {
    setShowCustomerModal(false);
    router.push('/customers/add?returnTo=events/add');
  };

  const handleSave = async () => {
    if (!formData.title || !formData.date || !formData.customer_id || !formData.time) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Debug time field value
      console.log("Time field before processing:", formData.time, typeof formData.time);
      
      // Ensure time is properly formatted as HH:MM
      let timeValue = formData.time;
      if (!timeValue || timeValue.trim() === "") {
        alert('Please select a time');
        setIsLoading(false);
        return;
      }
      
      // Check if time is in correct format (HH:MM)
      if (!/^\d{2}:\d{2}$/.test(timeValue)) {
        console.error("Invalid time format:", timeValue);
        alert('Time must be in format HH:MM');
        setIsLoading(false);
        return;
      }
      
      // Prepare event data - time is now required so no need for null handling
      const eventData = {
        title: formData.title,
        date: formData.date,
        time: timeValue,
        venue: formData.venue,
        address: formData.address,
        customer_id: formData.customer_id,
        notes: formData.notes,
        status: formData.status,
      };
      
      // Log the final event data being sent
      logEventData(eventData, "Event Data Before Insert");
      
      let eventId = id;
      
      if (isEditMode) {
        // Update existing event with more detailed error handling
        try {
          const { error } = await supabase
            .from('events')
            .update(eventData)
            .eq('id', id);
          
          if (error) {
            console.error("Error updating event:", error);
            throw error;
          }
          console.log("Event updated successfully");
        } catch (error) {
          console.error("Update failed with error:", error);
          throw error;
        }
      } else {
        // Create new event with more detailed error handling
        try {
          console.log("Inserting new event with data:", JSON.stringify(eventData));
          
          // Ensure we're using proper PostgreSQL time format
          const insertData = {
            ...eventData,
            time: eventData.time ? eventData.time.trim() : null
          };
          
          // Use RPC call as an alternative method that might handle time better
          const { data, error } = await supabase
            .from('events')
            .insert(insertData)
            .select('id')
            .single();
          
          if (error) {
            console.error("Error inserting event:", error);
            throw error;
          }
          
          if (!data || !data.id) {
            throw new Error("No data returned from event insert");
          }
          
          console.log("Event created successfully with ID:", data.id);
          eventId = data.id;
        } catch (error) {
          console.error("Insert failed with error:", error);
          throw error;
        }
      }
      
      // Handle staff assignment
      if (eventId) {
        // First, remove existing staff assignments (for edit mode)
        if (isEditMode) {
          await supabase
            .from('event_staff')
            .delete()
            .eq('event_id', eventId);
        }
        
        // Then add new staff assignments
        if (selectedEmployees.length > 0) {
          const staffAssignments = selectedEmployees.map(employeeId => ({
            event_id: eventId,
            employee_id: employeeId
          }));
          
          const { error } = await supabase
            .from('event_staff')
            .insert(staffAssignments);
          
          if (error) throw error;
        }
      }
      
    router.back();
    } catch (error: any) {
      console.error('Error saving event:', error);
      let errorMessage = 'Failed to save event';
      
      // Try to extract more useful error information
      if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      if (error.code) {
        errorMessage += ` (Code: ${error.code})`;
      }
      
      // Show a more detailed error message
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Render loading screen while fetching data for edit mode
  if (isFetchingData) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading event data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Header
        title={isEditMode ? "Edit Event" : "Add Event"}
        leftIcon={<ArrowLeft size={24} color="#000" />}
        onLeftPress={() => router.back()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom }}
        >
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">
                Event Title <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.title}
                onChangeText={(value) => handleChange("title", value)}
                placeholder="Enter event title"
              />
            </View>

            <View className="flex-row mb-4">
              <View className="flex-1 mr-2">
                <Text className="text-gray-700 mb-2 font-medium">
                  Date <Text className="text-red-500">*</Text>
                </Text>
                <TouchableOpacity
                  className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex-row justify-between items-center"
                  onPress={openDatePicker}
                >
                  <Text className={formData.date ? "text-gray-900" : "text-gray-400"}>
                    {formData.date ? formData.date : "Select date"}
                  </Text>
                  <Calendar size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 mb-2 font-medium">
                  Time <Text className="text-red-500">*</Text>
                </Text>
                <TouchableOpacity
                  className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex-row justify-between items-center"
                  onPress={openTimePicker}
                >
                  <Text className={formData.time ? "text-gray-900" : "text-gray-400"}>
                    {formData.time || "Select time"}
                  </Text>
                  <Clock size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Venue</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.venue}
                onChangeText={(value) => handleChange("venue", value)}
                placeholder="Enter venue name"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Address</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.address}
                onChangeText={(value) => handleChange("address", value)}
                placeholder="Enter venue address"
              />
            </View>

            <View className="mb-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-700 font-medium">
                  Customer <Text className="text-red-500">*</Text>
                </Text>
                <TouchableOpacity
                  className="p-1 bg-blue-50 rounded-md"
                  onPress={handleAddNewCustomer}
                >
                  <Text className="text-blue-600 text-sm">+ Add New</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex-row justify-between items-center"
                onPress={() => setShowCustomerModal(true)}
              >
                <Text className={formData.customer_name ? "text-gray-900" : "text-gray-400"}>
                  {formData.customer_name || "Select customer"}
                </Text>
                <ChevronDown size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Notes</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200 min-h-[100px]"
                value={formData.notes}
                onChangeText={(value) => handleChange("notes", value)}
                placeholder="Additional notes"
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Staff Assignment */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-bold text-gray-900">
              Assign Staff
            </Text>
              <TouchableOpacity
                className="p-2"
                onPress={() => setShowEmployeeModal(true)}
              >
                <Text className="text-blue-600 font-medium">Select Staff</Text>
              </TouchableOpacity>
          </View>

            {selectedEmployees.length === 0 ? (
              <Text className="text-gray-500 italic">No staff assigned</Text>
            ) : (
              employees
                .filter(emp => selectedEmployees.includes(emp.id))
                .map(employee => (
                  <View
                    key={employee.id}
                    className="flex-row justify-between items-center p-3 mb-2 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <View>
                      <Text className="font-medium text-gray-900">
                        {employee.name}
                      </Text>
                      <Text className="text-sm text-gray-500">Staff</Text>
                    </View>
                    <TouchableOpacity
                      className="p-2"
                      onPress={() => toggleEmployeeSelection(employee.id)}
                    >
                      <X size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))
            )}
          </View>

          <TouchableOpacity
            className="bg-blue-500 py-3 rounded-lg flex-row items-center justify-center mb-10"
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
            <Save size={20} color="#FFFFFF" />
            <Text className="text-white font-medium ml-2">
                  {isEditMode ? "Update Event" : "Create Event"}
            </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-xl">
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <Text className="text-xl font-bold">Select Date</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                className="p-2"
              >
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <View className="p-4">
              <View className="flex-row mb-6">
                {/* Month Picker */}
                <View className="flex-1 mr-2">
                  <Text className="text-gray-700 mb-2 font-medium">Month</Text>
                  <View className="bg-gray-50 rounded-lg border border-gray-200">
                    <ScrollView className="h-40">
                      {months.map((monthName, index) => (
                        <TouchableOpacity
                          key={monthName}
                          className={`p-3 ${month === index ? 'bg-blue-100' : ''}`}
                          onPress={() => setMonth(index)}
                        >
                          <Text className={`${month === index ? 'text-blue-700 font-bold' : 'text-gray-700'}`}>
                            {monthName}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
                
                {/* Day Picker */}
                <View className="flex-1 mr-2">
                  <Text className="text-gray-700 mb-2 font-medium">Day</Text>
                  <View className="bg-gray-50 rounded-lg border border-gray-200">
                    <ScrollView className="h-40">
                      {days.map((dayNum) => (
                        <TouchableOpacity
                          key={dayNum}
                          className={`p-3 ${day === dayNum ? 'bg-blue-100' : ''}`}
                          onPress={() => setDay(dayNum)}
                        >
                          <Text className={`${day === dayNum ? 'text-blue-700 font-bold' : 'text-gray-700'}`}>
                            {dayNum}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
                
                {/* Year Picker */}
                <View className="flex-1">
                  <Text className="text-gray-700 mb-2 font-medium">Year</Text>
                  <View className="bg-gray-50 rounded-lg border border-gray-200">
                    <ScrollView className="h-40">
                      {years.map((yearNum) => (
                        <TouchableOpacity
                          key={yearNum}
                          className={`p-3 ${year === yearNum ? 'bg-blue-100' : ''}`}
                          onPress={() => setYear(yearNum)}
                        >
                          <Text className={`${year === yearNum ? 'text-blue-700 font-bold' : 'text-gray-700'}`}>
                            {yearNum}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </View>
              
              <View className="flex-row">
                <TouchableOpacity
                  className="flex-1 bg-gray-200 p-3 rounded-lg mr-2 items-center"
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text className="font-medium text-gray-700">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-blue-500 p-3 rounded-lg items-center"
                  onPress={handleDateConfirm}
                >
                  <Text className="font-medium text-white">Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-xl">
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <Text className="text-xl font-bold">Select Time</Text>
              <TouchableOpacity
                onPress={() => setShowTimePicker(false)}
                className="p-2"
              >
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <View className="p-4">
              <View className="flex-row mb-6">
                {/* Hour Picker */}
                <View className="flex-1 mr-4">
                  <Text className="text-gray-700 mb-2 font-medium">Hour</Text>
                  <View className="bg-gray-50 rounded-lg border border-gray-200">
                    <ScrollView className="h-40">
                      {hours.map((hourNum) => (
                        <TouchableOpacity
                          key={hourNum}
                          className={`p-3 ${hour === hourNum ? 'bg-blue-100' : ''}`}
                          onPress={() => setHour(hourNum)}
                        >
                          <Text className={`${hour === hourNum ? 'text-blue-700 font-bold' : 'text-gray-700'}`}>
                            {padNumber(hourNum)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
                
                {/* Minute Picker */}
                <View className="flex-1">
                  <Text className="text-gray-700 mb-2 font-medium">Minute</Text>
                  <View className="bg-gray-50 rounded-lg border border-gray-200">
                    <ScrollView className="h-40">
                      {minutes.map((minuteNum) => (
                        <TouchableOpacity
                          key={minuteNum}
                          className={`p-3 ${minute === minuteNum ? 'bg-blue-100' : ''}`}
                          onPress={() => setMinute(minuteNum)}
                        >
                          <Text className={`${minute === minuteNum ? 'text-blue-700 font-bold' : 'text-gray-700'}`}>
                            {padNumber(minuteNum)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </View>
              
              <View className="flex-row">
                <TouchableOpacity
                  className="flex-1 bg-gray-200 p-3 rounded-lg mr-2 items-center"
                  onPress={() => setShowTimePicker(false)}
                >
                  <Text className="font-medium text-gray-700">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-blue-500 p-3 rounded-lg items-center"
                  onPress={handleTimeConfirm}
                >
                  <Text className="font-medium text-white">Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Customer Selection Modal */}
      <Modal
        visible={showCustomerModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCustomerModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-xl h-4/5">
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <Text className="text-xl font-bold">Select Customer</Text>
              <TouchableOpacity
                onPress={() => setShowCustomerModal(false)}
                className="p-2"
              >
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className="flex-row items-center p-4 border-b border-gray-100 bg-blue-50"
              onPress={handleAddNewCustomer}
            >
              <Plus size={20} color="#3B82F6" />
              <Text className="text-blue-600 font-medium ml-2">
                Add New Customer
              </Text>
            </TouchableOpacity>

            {isLoadingCustomers ? (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#3B82F6" />
              </View>
            ) : (
              <FlatList
                data={customers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="p-4 border-b border-gray-100"
                    onPress={() => selectCustomer(item)}
                  >
                    <Text className="font-medium text-gray-900">{item.name}</Text>
                    <Text className="text-gray-500">{item.phone}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Employee Selection Modal */}
      <Modal
        visible={showEmployeeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEmployeeModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-xl h-4/5">
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <Text className="text-xl font-bold">Select Staff</Text>
              <TouchableOpacity
                onPress={() => setShowEmployeeModal(false)}
                className="p-2"
              >
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {isLoadingEmployees ? (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#3B82F6" />
              </View>
            ) : (
              <FlatList
                data={employees}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className={`p-4 border-b border-gray-100 flex-row justify-between items-center ${
                      selectedEmployees.includes(item.id) ? "bg-blue-50" : ""
                    }`}
                    onPress={() => toggleEmployeeSelection(item.id)}
                  >
                    <View className="flex-1">
                      <Text className="font-medium text-gray-900">{item.name}</Text>
                      <Text className="text-gray-500">Staff</Text>
                    </View>
                    {selectedEmployees.includes(item.id) && (
                      <Check size={20} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}

            <View className="p-4 border-t border-gray-200">
              <TouchableOpacity
                className="bg-blue-500 p-3 rounded-lg items-center"
                onPress={() => setShowEmployeeModal(false)}
              >
                <Text className="text-white font-medium">Confirm Selection</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
