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
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Save, AlertCircle } from "lucide-react-native";
import { EmployeeFormData, getEmployeeById, updateEmployee } from "../../services/employeeService";

export default function EditEmployeeScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const employeeId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<EmployeeFormData>({
    id: employeeId,
    name: "",
    email: "",
    phone: "",
    role: "",
    salary: "",
    startDate: "",
    address: "",
    emergencyContact: "",
    notes: "",
    status: "Active",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!employeeId) {
      setError("No employee ID provided");
      setIsLoading(false);
      return;
    }

    async function fetchEmployeeData() {
      try {
        setIsLoading(true);
        setError(null);
        const employeeData = await getEmployeeById(employeeId);
        
        if (!employeeData) {
          setError("Employee not found");
          return;
        }
        
        setFormData({
          ...employeeData,
          // Ensure all form fields are present, even if empty
          address: employeeData.address || "",
          notes: employeeData.notes || "",
          emergencyContact: employeeData.emergencyContact || "",
          startDate: employeeData.startDate || "",
        });
      } catch (err: any) {
        console.error("Error fetching employee data:", err);
        setError(err?.message || "Failed to load employee data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchEmployeeData();
  }, [employeeId]);

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

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("Updating employee with data:", formData);
      
      // Create a clean employee object without any undefined fields
      const employeeData = {
        id: formData.id,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: formData.role.trim(),
        salary: formData.salary.trim(),
        status: formData.status,
        startDate: (formData.startDate || "").trim(),
        address: (formData.address || "").trim(),
        emergencyContact: (formData.emergencyContact || "").trim(),
        notes: (formData.notes || "").trim()
      };
      
      await updateEmployee(employeeId, employeeData);
      
      // Navigate back immediately
      router.back();
      
      // Show success alert after navigation
      setTimeout(() => {
        Alert.alert('Success', 'Employee updated successfully');
      }, 300);
    } catch (error: any) {
      console.error("Error updating employee:", error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to update employee. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <View className="bg-white px-4 py-4 flex-row justify-between items-center shadow-sm">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ArrowLeft size={24} color="#4B5563" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Edit Employee</Text>
          <View style={{ width: 80 }} />
        </View>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600">Loading employee data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <View className="bg-white px-4 py-4 flex-row justify-between items-center shadow-sm">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ArrowLeft size={24} color="#4B5563" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Edit Employee</Text>
          <View style={{ width: 80 }} />
        </View>
        <View className="flex-1 justify-center items-center p-6">
          <AlertCircle size={40} color="#EF4444" />
          <Text className="mt-4 text-gray-800 font-medium text-center">{error}</Text>
          <TouchableOpacity 
            className="mt-4 bg-blue-500 px-4 py-2 rounded-lg"
            onPress={() => router.back()}
          >
            <Text className="text-white font-medium">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="bg-white px-4 py-4 flex-row justify-between items-center shadow-sm">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ArrowLeft size={24} color="#4B5563" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Edit Employee</Text>
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
              <Text className="text-gray-700 mb-1">Emergency Contact</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                placeholder="Enter emergency contact"
                value={formData.emergencyContact}
                onChangeText={(text) => handleChange("emergencyContact", text)}
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
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                placeholder="MM/DD/YYYY"
                value={formData.startDate}
                onChangeText={(text) => handleChange("startDate", text)}
              />
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
    </SafeAreaView>
  );
}
