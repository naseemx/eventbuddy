import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, Save, Calendar as CalendarIcon, CheckCircle, X } from "lucide-react-native";
import { createEmployee, EmployeeFormData } from "../../services/employeeService";
import { SafeAreaView } from "react-native-safe-area-context";
import DatePicker from 'react-native-date-picker';

// Success message component with Tailwind styling
interface SuccessMessageProps {
  visible: boolean;
  message: string;
  onDismiss: () => void;
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({ visible, message, onDismiss }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  
  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Auto dismiss after 3 seconds
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => onDismiss());
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [visible, fadeAnim, onDismiss]);
  
  if (!visible) return null;
  
  return (
    <Animated.View 
      style={{ opacity: fadeAnim }}
      className="absolute top-10 left-5 right-5 bg-green-100 border border-green-300 rounded-lg p-4 flex-row items-center shadow-md z-50"
    >
      <CheckCircle size={24} color="#10B981" />
      <Text className="ml-2 flex-1 text-green-800 font-medium">{message}</Text>
      <TouchableOpacity onPress={onDismiss}>
        <X size={20} color="#10B981" />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function AddEmployeeScreen() {
  const insets = useSafeAreaInsets();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Omit<EmployeeFormData, 'id' | 'created_at' | 'updated_at'>>({
    name: "",
    email: "",
    phone: "",
    role: "",
    salary: "",
    startDate: "",
    address: "",
    notes: "",
    status: "Active" as "Active" | "On Leave" | "Unavailable",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());
  
  // Success message state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (field: string, value: string) => {
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      });
    }
    
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    if (!formData.role.trim()) {
      newErrors.role = 'Role is required';
    }
    
    if (!formData.salary.trim()) {
      newErrors.salary = 'Salary is required';
    } else if (isNaN(Number(formData.salary))) {
      newErrors.salary = 'Salary must be a number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showSuccessNotification = (message: string) => {
    setSuccessMessage(message);
    setShowSuccess(true);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log("Submitting employee data:", formData);
      
      // The conversion to proper DB format is handled by the createEmployee function
      const result = await createEmployee(formData);
      
      if (result) {
        console.log("Employee created successfully with ID:", result.id);
        
        // Show success message with Tailwind
        showSuccessNotification('Employee added successfully');
        
        // Navigate back after a short delay
        setTimeout(() => {
          router.back();
        }, 1500);
      }
    } catch (error) {
      console.error("Error adding employee:", error);
      Alert.alert(
        'Error',
        `Failed to add employee: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to open date picker with correct initialization
  const openDatePicker = () => {
    if (formData.startDate) {
      // If we already have a date, parse it and use it
      const parts = formData.startDate.split('/');
      if (parts.length === 3) {
        const month = parseInt(parts[0], 10) - 1;
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        
        const parsedDate = new Date(year, month, day);
        if (!isNaN(parsedDate.getTime())) {
          setDate(parsedDate);
        }
      }
    }
    
    setShowDatePicker(true);
  };
  
  // Handle date selection from the date picker
  const handleDateConfirm = (selectedDate: Date) => {
    setShowDatePicker(false);
    setDate(selectedDate);
    
    // Format date as MM/DD/YYYY
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
    const day = selectedDate.getDate().toString().padStart(2, '0');
    const year = selectedDate.getFullYear();
    const formattedDate = `${month}/${day}/${year}`;
    
    setFormData(prev => ({
      ...prev,
      startDate: formattedDate
    }));
  };

  return (
    // Use SafeAreaView from react-native-safe-area-context with proper configuration
    <SafeAreaView 
      className="flex-1 bg-gray-100" 
      edges={['right', 'left', 'bottom']}
      style={{ paddingTop: 0 }} // Override default padding for top edge
    >
      {/* Success notification */}
      <SuccessMessage
        visible={showSuccess}
        message={successMessage}
        onDismiss={() => setShowSuccess(false)}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={insets.top}
      >
        {/* Header with manual top inset adjustment */}
        <View 
          className="bg-white px-4 py-4 flex-row justify-between items-center shadow-sm" 
          style={{ paddingTop: insets.top }}
        >
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ArrowLeft size={24} color="#4B5563" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Add Employee</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSubmitting}
            className={`${isSubmitting ? 'bg-blue-300' : 'bg-blue-500'} px-4 py-2 rounded-lg flex-row items-center`}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Save size={18} color="#FFFFFF" />
            )}
            <Text className="text-white font-medium ml-1">
              {isSubmitting ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1 px-4 pt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
          {/* Personal Information */}
          <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
            <Text className="text-lg font-semibold mb-4">
              Personal Information
            </Text>

            <View className="mb-4">
              <Text className="text-gray-700 mb-1">Full Name *</Text>
              <TextInput
                className={`bg-gray-50 p-3 rounded-lg border ${errors.name ? 'border-red-500' : 'border-gray-200'}`}
                placeholder="Enter full name"
                value={formData.name}
                onChangeText={(text) => handleChange("name", text)}
              />
              {errors.name ? (
                <Text className="text-red-500 text-xs mt-1">{errors.name}</Text>
              ) : null}
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-1">Email *</Text>
              <TextInput
                className={`bg-gray-50 p-3 rounded-lg border ${errors.email ? 'border-red-500' : 'border-gray-200'}`}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(text) => handleChange("email", text)}
              />
              {errors.email ? (
                <Text className="text-red-500 text-xs mt-1">{errors.email}</Text>
              ) : null}
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-1">Phone Number *</Text>
              <TextInput
                className={`bg-gray-50 p-3 rounded-lg border ${errors.phone ? 'border-red-500' : 'border-gray-200'}`}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={(text) => handleChange("phone", text)}
              />
              {errors.phone ? (
                <Text className="text-red-500 text-xs mt-1">{errors.phone}</Text>
              ) : null}
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-1">Address</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                placeholder="Enter address"
                multiline
                numberOfLines={3}
                value={formData.address}
                onChangeText={(text) => handleChange("address", text)}
              />
            </View>
            
            <View className="mb-4">
              <Text className="text-gray-700 mb-1">Status</Text>
              <View className="flex-row mt-2">
                {["Active", "On Leave", "Unavailable"].map((status) => (
                  <TouchableOpacity
                    key={status}
                    className={`mr-3 px-4 py-2 rounded-lg ${formData.status === status ? "bg-blue-500" : "bg-gray-200"}`}
                    onPress={() => handleChange("status", status as "Active" | "On Leave" | "Unavailable")}
                  >
                    <Text
                      className={`${formData.status === status ? "text-white" : "text-gray-800"}`}
                    >
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Employment Information */}
          <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
            <Text className="text-lg font-semibold mb-4">
              Employment Information
            </Text>

            <View className="mb-4">
              <Text className="text-gray-700 mb-1">Role/Position *</Text>
              <TextInput
                className={`bg-gray-50 p-3 rounded-lg border ${errors.role ? 'border-red-500' : 'border-gray-200'}`}
                placeholder="Enter role or position"
                value={formData.role}
                onChangeText={(text) => handleChange("role", text)}
              />
              {errors.role ? (
                <Text className="text-red-500 text-xs mt-1">{errors.role}</Text>
              ) : null}
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-1">Salary ($/month) *</Text>
              <TextInput
                className={`bg-gray-50 p-3 rounded-lg border ${errors.salary ? 'border-red-500' : 'border-gray-200'}`}
                placeholder="Enter monthly salary"
                keyboardType="numeric"
                value={formData.salary}
                onChangeText={(text) => handleChange("salary", text)}
              />
              {errors.salary ? (
                <Text className="text-red-500 text-xs mt-1">{errors.salary}</Text>
              ) : null}
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-1">Start Date</Text>
              <TouchableOpacity 
                className="flex-row items-center bg-gray-50 p-3 rounded-lg border border-gray-200"
                onPress={openDatePicker}
              >
                <CalendarIcon size={20} color="#6B7280" className="mr-2" />
                <Text className={formData.startDate ? "text-gray-900" : "text-gray-400"}>
                  {formData.startDate || "Select start date"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Additional Notes */}
          <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
            <Text className="text-lg font-semibold mb-4">Additional Notes</Text>

            <View className="mb-4">
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                placeholder="Enter any additional notes"
                multiline
                numberOfLines={4}
                value={formData.notes}
                onChangeText={(text) => handleChange("notes", text)}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* React Native Date Picker */}
      {showDatePicker && (
        <DatePicker
          modal
          open={showDatePicker}
          date={date}
          onConfirm={handleDateConfirm}
          onCancel={() => setShowDatePicker(false)}
          mode="date"
          title="Select Start Date"
          confirmText="Confirm"
          cancelText="Cancel"
          maximumDate={new Date()}
        />
      )}
    </SafeAreaView>
  );
}
