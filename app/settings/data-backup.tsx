import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ArrowLeft,
  Download,
  Upload,
  Clock,
  CheckCircle,
  AlertCircle,
  Database,
  RefreshCw,
  HardDrive,
  Smartphone,
  Save,
} from "lucide-react-native";

import Header from "../../components/Header";

export default function DataBackupScreen() {
  const insets = useSafeAreaInsets();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Mock backup history
  const backupHistory = [
    {
      id: "1",
      date: "Jun 15, 2023 - 10:30 AM",
      size: "24.5 MB",
      status: "success",
    },
    {
      id: "2",
      date: "Jun 10, 2023 - 09:15 AM",
      size: "23.8 MB",
      status: "success",
    },
    {
      id: "3",
      date: "Jun 05, 2023 - 11:45 AM",
      size: "22.3 MB",
      status: "failed",
    },
  ];

  const handleBackup = () => {
    setIsBackingUp(true);
    // Simulate backup process with MongoDB Atlas
    setTimeout(() => {
      setIsBackingUp(false);
      Alert.alert(
        "Backup Complete",
        "All your data including server data from MongoDB Atlas has been successfully backed up to local storage.",
        [{ text: "OK" }],
      );
    }, 2000);
  };

  const handleRestore = (backupId: string) => {
    Alert.alert(
      "Restore Data",
      "Are you sure you want to restore data from this backup? This will replace your current data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          style: "destructive",
          onPress: () => {
            setIsRestoring(true);
            // Simulate restore process
            setTimeout(() => {
              setIsRestoring(false);
              Alert.alert(
                "Restore Complete",
                "Your data has been successfully restored.",
                [{ text: "OK" }],
              );
            }, 2000);
          },
        },
      ],
    );
  };

  const handleImportBackup = () => {
    Alert.alert(
      "Import Backup",
      "This will allow you to select a backup file from your local storage and restore it to MongoDB Atlas.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Select File",
          onPress: () => {
            setIsImporting(true);
            // Simulate import process with MongoDB Atlas
            setTimeout(() => {
              setIsImporting(false);
              Alert.alert(
                "Import Complete",
                "Your backup file has been successfully imported from local storage and restored to MongoDB Atlas.",
                [{ text: "OK" }],
              );
            }, 2000);
          },
        },
      ],
    );
  };

  const handleExportToDevice = () => {
    Alert.alert(
      "Export to Device",
      "This will save a backup file to your device's local storage.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Export",
          onPress: () => {
            // Simulate export process
            setTimeout(() => {
              Alert.alert(
                "Export Complete",
                `Backup file has been saved to ${Platform.OS === "ios" ? "Files app" : "Downloads folder"}.`,
                [{ text: "OK" }],
              );
            }, 1500);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Header
        title="Data Backup"
        leftIcon={<ArrowLeft size={24} color="#000" />}
        onLeftPress={() => router.back()}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom }}
      >
        {/* Backup Status */}
        <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
          <Text className="text-lg font-bold mb-3 text-gray-900">
            Backup Status
          </Text>
          <View className="flex-row items-center justify-between bg-blue-50 p-4 rounded-lg">
            <View className="flex-row items-center">
              <Clock size={20} color="#3B82F6" />
              <View className="ml-3">
                <Text className="font-medium text-gray-800">
                  Last Backup: Jun 15, 2023 - 10:30 AM
                </Text>
                <Text className="text-sm text-gray-600">Size: 24.5 MB</Text>
              </View>
            </View>
            <CheckCircle size={20} color="#10B981" />
          </View>
        </View>

        {/* Backup Actions */}
        <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
          <Text className="text-lg font-bold mb-3 text-gray-900">
            Backup Actions
          </Text>

          <TouchableOpacity
            className="flex-row items-center justify-between bg-blue-500 p-4 rounded-lg mb-3"
            onPress={handleBackup}
            disabled={isBackingUp}
          >
            {isBackingUp ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text className="text-white font-medium ml-3">
                  Backing up...
                </Text>
              </View>
            ) : (
              <>
                <View className="flex-row items-center">
                  <Download size={20} color="#FFFFFF" />
                  <Text className="text-white font-medium ml-3">
                    Backup Now
                  </Text>
                </View>
                <ArrowLeft size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between bg-amber-500 p-4 rounded-lg mb-3"
            onPress={handleImportBackup}
            disabled={isImporting}
          >
            {isImporting ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text className="text-white font-medium ml-3">
                  Importing...
                </Text>
              </View>
            ) : (
              <>
                <View className="flex-row items-center">
                  <Upload size={20} color="#FFFFFF" />
                  <Text className="text-white font-medium ml-3">
                    Import Backup
                  </Text>
                </View>
                <ArrowLeft size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between bg-green-500 p-4 rounded-lg"
            onPress={handleExportToDevice}
          >
            <View className="flex-row items-center">
              <Smartphone size={20} color="#FFFFFF" />
              <Text className="text-white font-medium ml-3">
                Export to Device
              </Text>
            </View>
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Auto Backup Settings */}
        <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
          <Text className="text-lg font-bold mb-3 text-gray-900">
            Auto Backup Settings
          </Text>

          <TouchableOpacity className="flex-row items-center justify-between p-3 mb-2 bg-gray-50 rounded-lg">
            <View className="flex-row items-center">
              <RefreshCw size={20} color="#4B5563" />
              <Text className="font-medium text-gray-800 ml-3">
                Backup Frequency
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-gray-600 mr-2">Daily</Text>
              <ArrowLeft size={16} color="#4B5563" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between p-3 mb-2 bg-gray-50 rounded-lg">
            <View className="flex-row items-center">
              <Database size={20} color="#4B5563" />
              <Text className="font-medium text-gray-800 ml-3">
                Cloud Backup
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-gray-600 mr-2">Enabled</Text>
              <ArrowLeft size={16} color="#4B5563" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between p-3 mb-2 bg-gray-50 rounded-lg">
            <View className="flex-row items-center">
              <HardDrive size={20} color="#4B5563" />
              <Text className="font-medium text-gray-800 ml-3">
                Local Backup
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-gray-600 mr-2">Enabled</Text>
              <ArrowLeft size={16} color="#4B5563" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg">
            <View className="flex-row items-center">
              <Clock size={20} color="#4B5563" />
              <Text className="font-medium text-gray-800 ml-3">
                Retention Period
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-gray-600 mr-2">30 Days</Text>
              <ArrowLeft size={16} color="#4B5563" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity className="bg-blue-500 py-3 rounded-lg flex-row items-center justify-center mt-4">
            <Save size={20} color="#FFFFFF" />
            <Text className="text-white font-medium ml-2">Save Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Backup History */}
        <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
          <Text className="text-lg font-bold mb-3 text-gray-900">
            Backup History
          </Text>

          {backupHistory.map((backup) => (
            <TouchableOpacity
              key={backup.id}
              className="flex-row justify-between items-center p-3 mb-2 bg-gray-50 rounded-lg"
              onPress={() => handleRestore(backup.id)}
            >
              <View className="flex-row items-center">
                {backup.status === "success" ? (
                  <CheckCircle size={16} color="#10B981" />
                ) : (
                  <AlertCircle size={16} color="#EF4444" />
                )}
                <View className="ml-3">
                  <Text className="font-medium text-gray-800">
                    {backup.date}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Size: {backup.size}
                  </Text>
                </View>
              </View>
              <View className="flex-row">
                <TouchableOpacity
                  className="bg-blue-100 p-2 rounded-lg mr-2"
                  onPress={() => handleRestore(backup.id)}
                >
                  <Upload size={16} color="#3B82F6" />
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-blue-100 p-2 rounded-lg"
                  onPress={handleExportToDevice}
                >
                  <Download size={16} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
