import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  FlatList,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Shield,
  Edit,
  Trash2,
  Plus,
  Search,
} from "lucide-react-native";

import Header from "../../components/Header";

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: "Active" | "Inactive";
}

export default function EmployeeManagementScreen() {
  const insets = useSafeAreaInsets();

  // Mock employees data
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: "1",
      name: "David Miller",
      email: "david.miller@example.com",
      phone: "(555) 123-7890",
      role: "Admin",
      status: "Active",
    },
    {
      id: "2",
      name: "Jessica Taylor",
      email: "jessica.taylor@example.com",
      phone: "(555) 456-7891",
      role: "Manager",
      status: "Active",
    },
    {
      id: "3",
      name: "Ryan Cooper",
      email: "ryan.cooper@example.com",
      phone: "(555) 789-1234",
      role: "Technician",
      status: "Active",
    },
    {
      id: "4",
      name: "Amanda Wilson",
      email: "amanda.wilson@example.com",
      phone: "(555) 234-5678",
      role: "Staff",
      status: "Inactive",
    },
    {
      id: "5",
      name: "Mark Johnson",
      email: "mark.johnson@example.com",
      phone: "(555) 567-8901",
      role: "Staff",
      status: "Active",
    },
  ]);

  const handleAddEmployee = () => {
    router.push("/employees/add");
  };

  const handleEditEmployee = (id: string) => {
    router.push(`/employees/edit?id=${id}`);
  };

  const handleDeleteEmployee = (id: string) => {
    Alert.alert(
      "Delete Employee",
      "Are you sure you want to delete this employee?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // In a real app, you would delete the employee from the database
            setEmployees(employees.filter((employee) => employee.id !== id));
          },
        },
      ],
    );
  };

  const renderEmployeeItem = ({ item }: { item: Employee }) => {
    return (
      <View className="bg-white p-4 rounded-lg mb-3 shadow-sm border border-gray-100">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900">
              {item.name}
            </Text>
            <View className="flex-row items-center mt-1">
              <Mail size={14} color="#6B7280" />
              <Text className="text-gray-500 text-sm ml-1">{item.email}</Text>
            </View>
            <View className="flex-row items-center mt-1">
              <Phone size={14} color="#6B7280" />
              <Text className="text-gray-500 text-sm ml-1">{item.phone}</Text>
            </View>
            <View className="flex-row items-center mt-1">
              <Shield size={14} color="#6B7280" />
              <Text className="text-gray-500 text-sm ml-1">{item.role}</Text>
            </View>
          </View>
          <View
            className={`px-2 py-1 rounded-full ${item.status === "Active" ? "bg-green-100" : "bg-gray-100"}`}
          >
            <Text
              className={`text-xs font-medium ${item.status === "Active" ? "text-green-800" : "text-gray-800"}`}
            >
              {item.status}
            </Text>
          </View>
        </View>
        <View className="flex-row mt-3 pt-3 border-t border-gray-100">
          <TouchableOpacity
            className="bg-blue-50 px-3 py-1.5 rounded-lg flex-row items-center mr-2"
            onPress={() => handleEditEmployee(item.id)}
          >
            <Edit size={14} color="#3B82F6" />
            <Text className="text-blue-600 font-medium ml-1">Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-red-50 px-3 py-1.5 rounded-lg flex-row items-center"
            onPress={() => handleDeleteEmployee(item.id)}
          >
            <Trash2 size={14} color="#EF4444" />
            <Text className="text-red-600 font-medium ml-1">Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Header
        title="Employee Management"
        leftIcon={<ArrowLeft size={24} color="#000" />}
        onLeftPress={() => router.back()}
      />

      <View className="flex-1 px-4 pt-4">
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity className="bg-white p-2.5 rounded-lg flex-1 mr-3 shadow-sm flex-row items-center">
            <Search size={20} color="#6B7280" />
            <Text className="text-gray-400 ml-2">Search employees...</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-blue-500 px-3 py-2.5 rounded-lg flex-row items-center"
            onPress={handleAddEmployee}
          >
            <Plus size={18} color="#FFFFFF" />
            <Text className="text-white font-medium ml-1">Add</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={employees}
          renderItem={renderEmployeeItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom }}
        />
      </View>
    </SafeAreaView>
  );
}
