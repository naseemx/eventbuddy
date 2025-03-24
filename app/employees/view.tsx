import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  AlertTriangle,
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react-native";
import { EmployeeFormData, deleteEmployee, getEmployeeById } from "../../services/employeeService";
import DeleteConfirmation from "../../components/DeleteConfirmation";
import SuccessNotification from "../../components/SuccessNotification";

export default function EmployeeViewScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const employeeId = params.id as string;

  const [employee, setEmployee] = useState<EmployeeFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Delete confirmation state
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  
  // Success notification state
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

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
        const data = await getEmployeeById(employeeId);
        
        if (!data) {
          setError("Employee not found");
          return;
        }
        
        setEmployee(data);
      } catch (err: any) {
        console.error("Error fetching employee data:", err);
        setError(err?.message || "Failed to load employee details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchEmployeeData();
  }, [employeeId]);

  const getStatusColor = (status: string | undefined) => {
    if (!status) return "bg-gray-100 text-gray-800";
    
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "On Leave":
        return "bg-yellow-100 text-yellow-800";
      case "Unavailable":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDeleteEmployee = () => {
    // Show the custom delete confirmation modal
    setDeleteConfirmVisible(true);
  };
  
  const cancelDelete = () => {
    setDeleteConfirmVisible(false);
  };
  
  const confirmDelete = async () => {
    if (!employeeId || !employee) return;
    
    try {
      setIsDeleting(true);
      
      // Get employee name for success message
      const name = employee.name;
      
      // Call the delete function directly
      await deleteEmployee(employeeId);
      
      // Navigate back to employees list
      router.replace('/employees' as any);
      
      // Show success notification after navigation
      setTimeout(() => {
        // We could use global state management or context for this,
        // but for simplicity we'll just use Alert for now
        Alert.alert("Success", `${name} has been deleted successfully`);
      }, 300);
    } catch (error: any) {
      console.error("[VIEW] Error deleting employee:", error);
      setDeleteConfirmVisible(false);
      setIsDeleting(false);
      
      // Show error message
      const errorMessage = error?.message || "Failed to delete employee. Please try again.";
      Alert.alert("Error", errorMessage);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        {/* Header */}
        <View className="bg-white px-4 py-4 flex-row justify-between items-center shadow-sm">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ArrowLeft size={24} color="#4B5563" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">
            Employee Details
          </Text>
          <View style={{ width: 40 }} />
        </View>
        
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600">Loading employee details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !employee) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        {/* Header */}
        <View className="bg-white px-4 py-4 flex-row justify-between items-center shadow-sm">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ArrowLeft size={24} color="#4B5563" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">
            Employee Details
          </Text>
          <View style={{ width: 40 }} />
        </View>
        
        <View className="flex-1 justify-center items-center p-6">
          <AlertCircle size={40} color="#EF4444" />
          <Text className="mt-4 text-gray-800 font-medium text-center">{error || "Employee not found"}</Text>
          <TouchableOpacity 
            className="mt-4 bg-blue-500 px-4 py-2 rounded-lg"
            onPress={() => router.replace('/employees' as any)}
          >
            <Text className="text-white font-medium">Back to Employees</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-white px-4 py-4 flex-row justify-between items-center shadow-sm">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ArrowLeft size={24} color="#4B5563" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">
          Employee Details
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 20,
        }}
      >
        {/* Employee Status */}
        <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-row items-center">
              <User size={20} color="#4B5563" />
              <Text className="text-xl font-semibold ml-2">
                {employee.name}
              </Text>
            </View>
            <View
              className={`px-3 py-1 rounded-full ${getStatusColor(employee.status)}`}
            >
              <Text className="text-xs font-medium">{employee.status || "Unknown"}</Text>
            </View>
          </View>

          <View className="flex-row items-center mt-2">
            <Briefcase size={16} color="#6B7280" />
            <Text className="text-gray-700 ml-2">{employee.role}</Text>
          </View>

          {employee.startDate && (
            <View className="flex-row items-center mt-2">
              <Calendar size={16} color="#6B7280" />
              <Text className="text-gray-700 ml-2">
                Started {employee.startDate}
              </Text>
            </View>
          )}

          <View className="flex-row items-center mt-2">
            <Calendar size={16} color="#6B7280" />
            <Text className="text-gray-700 ml-2">
              0 assigned events
            </Text>
          </View>
        </View>

        {/* Contact Information */}
        <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
          <Text className="text-lg font-semibold mb-3">
            Contact Information
          </Text>

          <View className="mb-3">
            <View className="flex-row items-center mb-1">
              <Mail size={16} color="#6B7280" />
              <Text className="text-gray-700 font-medium ml-2">Email</Text>
            </View>
            <Text className="text-gray-900 ml-6">{employee.email}</Text>
          </View>

          <View className="mb-3">
            <View className="flex-row items-center mb-1">
              <Phone size={16} color="#6B7280" />
              <Text className="text-gray-700 font-medium ml-2">Phone</Text>
            </View>
            <Text className="text-gray-900 ml-6">{employee.phone}</Text>
          </View>

          {employee.address && (
            <View className="mb-3">
              <View className="flex-row items-center mb-1">
                <MapPin size={16} color="#6B7280" />
                <Text className="text-gray-700 font-medium ml-2">Address</Text>
              </View>
              <Text className="text-gray-900 ml-6">{employee.address}</Text>
            </View>
          )}

          {employee.emergencyContact && (
            <View>
              <View className="flex-row items-center mb-1">
                <AlertTriangle size={16} color="#6B7280" />
                <Text className="text-gray-700 font-medium ml-2">
                  Emergency Contact
                </Text>
              </View>
              <Text className="text-gray-900 ml-6">
                {employee.emergencyContact}
              </Text>
            </View>
          )}
        </View>

        {/* Employment Information */}
        <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
          <Text className="text-lg font-semibold mb-3">
            Employment Information
          </Text>

          <View className="mb-3">
            <View className="flex-row items-center mb-1">
              <Briefcase size={16} color="#6B7280" />
              <Text className="text-gray-700 font-medium ml-2">Position</Text>
            </View>
            <Text className="text-gray-900 ml-6">{employee.role}</Text>
          </View>

          <View className="mb-3">
            <View className="flex-row items-center mb-1">
              <DollarSign size={16} color="#6B7280" />
              <Text className="text-gray-700 font-medium ml-2">
                Monthly Salary
              </Text>
            </View>
            <Text className="text-gray-900 ml-6">${employee.salary}</Text>
          </View>

          {employee.startDate && (
            <View>
              <View className="flex-row items-center mb-1">
                <Calendar size={16} color="#6B7280" />
                <Text className="text-gray-700 font-medium ml-2">Start Date</Text>
              </View>
              <Text className="text-gray-900 ml-6">{employee.startDate}</Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {employee.notes && (
          <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
            <Text className="text-lg font-semibold mb-2">Notes</Text>
            <Text className="text-gray-700">{employee.notes}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row justify-between mb-4">
          <TouchableOpacity
            className="flex-1 bg-blue-500 py-3 rounded-lg flex-row justify-center items-center mr-2"
            onPress={() => router.push(`/employees/edit?id=${employeeId}` as any)}
            disabled={isDeleting}
          >
            <Edit size={18} color="#FFFFFF" />
            <Text className="text-white font-medium ml-2">Edit Employee</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 ${isDeleting ? 'bg-red-300' : 'bg-red-500'} py-3 rounded-lg flex-row justify-center items-center ml-2`}
            onPress={handleDeleteEmployee}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Trash2 size={18} color="#FFFFFF" />
            )}
            <Text className="text-white font-medium ml-2">
              {isDeleting ? "Deleting..." : "Delete Employee"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Custom delete confirmation */}
      <DeleteConfirmation 
        isVisible={deleteConfirmVisible}
        title="Delete Employee"
        message="Are you sure you want to delete"
        itemName={employee?.name}
        isLoading={isDeleting}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />
    </SafeAreaView>
  );
}
