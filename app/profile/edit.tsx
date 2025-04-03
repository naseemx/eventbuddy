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
import { router } from "expo-router";
import { ArrowLeft, Save, Camera } from "lucide-react-native";
import * as ExpoImagePicker from 'expo-image-picker';

import Header from "../../components/Header";
import OptimizedImage from "../../components/OptimizedImage";
import { uploadCompanyLogo, CompanyFormData, createCompanyLogosBucket } from "../../services/companyService";
import { useCompany } from "../../services/companyContext";

export default function CompanyEditScreen() {
  const insets = useSafeAreaInsets();
  const { companyData, loading: contextLoading, updateCompany, refreshCompanyData } = useCompany();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newLogoSelected, setNewLogoSelected] = useState(false);

  // Form state with null handling
  const [formData, setFormData] = useState<CompanyFormData>({
    name: "Company Name",
    email: null,
    phone: null,
    whatsapp: null,
    address: null,
    website: null,
    logo: null,
    taxId: null,
    foundedYear: null,
    instagram: null,
    facebook: null,
    youtube: null,
    twitter: null
  });

  // Initialize form data from context
  useEffect(() => {
    const initForm = async () => {
      try {
        // Make sure bucket exists
        await createCompanyLogosBucket();
        
        // Use company data from context
        if (companyData) {
          setFormData(companyData);
        }
      } catch (error) {
        console.error("Error initializing form data:", error);
        Alert.alert(
          "Error",
          "Failed to initialize form data. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };
    
    initForm();
  }, [companyData]);

  const handleChange = (field: string, value: string | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validate required fields
      if (!formData.name || formData.name.trim() === "") {
        Alert.alert("Error", "Company name is required");
        setSaving(false);
        return;
      }
      
      let updatedFormData = { ...formData };
      
      // Upload new logo if selected
      if (newLogoSelected && formData.logo) {
        const logoUrl = await uploadCompanyLogo(formData.logo);
        if (logoUrl) {
          updatedFormData = { ...updatedFormData, logo: logoUrl };
        } else {
          // Continue even if logo upload fails
          console.warn("Logo upload failed, continuing with save");
        }
      }
      
      // Save company data using context
      const result = await updateCompany(updatedFormData);
      if (result) {
        setSaving(false); // Set saving to false before alert
        
        // Success! Show message and navigate to profile
        Alert.alert(
          "Success", 
          "Company profile updated successfully",
          [{ 
            text: "OK", 
            onPress: () => {
              console.log("Navigating back to profile page");
              // Force navigation to profile page
              router.replace("/profile");
            } 
          }]
        );
      } else {
        Alert.alert("Error", "Failed to update company profile");
      }
    } catch (error) {
      console.error("Error saving company data:", error);
      Alert.alert(
        "Error",
        "An error occurred while saving. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      const imagePerm = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
      if (!imagePerm.granted) {
        Alert.alert("Permission Required", "You need to enable permission to access the photo library");
        return;
      }

      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1.0,
        base64: true,
        exif: false,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const image = result.assets[0];
        
        // Check if base64 data exists
        if (!image.base64) {
          console.warn("Image is missing base64 data, using URI directly");
          setFormData(prev => ({ ...prev, logo: image.uri }));
        } else {
          setFormData(prev => ({ ...prev, logo: `data:image/jpeg;base64,${image.base64}` }));
        }
        setNewLogoSelected(true);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "There was an error selecting the image.");
    }
  };

  if (loading || contextLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-4 text-gray-600">Loading company data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Header
        title="Edit Company"
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
          {/* Company Logo */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5 items-center">
            <Text className="text-lg font-bold mb-3 text-gray-900">
              Company Logo
            </Text>
            {formData.logo ? (
              <View className="relative">
                <OptimizedImage
                  source={formData.logo}
                  style={{ width: 96, height: 96, borderRadius: 48 }}
                  resizeMode="cover"
                  showPlaceholder={true}
                  placeholderText="Company Logo"
                />
                <TouchableOpacity
                  className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full"
                  onPress={handleImagePicker}
                >
                  <Camera size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-full items-center justify-center bg-gray-50"
                onPress={handleImagePicker}
              >
                <Camera size={24} color="#6B7280" />
                <Text className="text-gray-500 mt-2 text-xs">Add Logo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Basic Information */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-4 text-gray-900">
              Basic Information
            </Text>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Company Name <Text className="text-red-500">*</Text></Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.name}
                onChangeText={(value) => handleChange("name", value)}
                placeholder="Enter company name"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Email</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.email || ""}
                onChangeText={(value) => handleChange("email", value || null)}
                placeholder="Enter company email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Phone</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.phone || ""}
                onChangeText={(value) => handleChange("phone", value || null)}
                placeholder="Enter company phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">WhatsApp Number</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.whatsapp || ""}
                onChangeText={(value) => handleChange("whatsapp", value || null)}
                placeholder="Enter WhatsApp number"
                keyboardType="phone-pad"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Address</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.address || ""}
                onChangeText={(value) => handleChange("address", value || null)}
                placeholder="Enter company address"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Website</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.website || ""}
                onChangeText={(value) => handleChange("website", value || null)}
                placeholder="Enter company website"
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Tax ID</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.taxId || ""}
                onChangeText={(value) => handleChange("taxId", value || null)}
                placeholder="Enter tax ID"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Founded Year</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.foundedYear || ""}
                onChangeText={(value) => handleChange("foundedYear", value || null)}
                placeholder="Enter founding year"
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Social Media Information */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-4 text-gray-900">
              Social Media
            </Text>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Instagram</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.instagram || ""}
                onChangeText={(value) => handleChange("instagram", value || null)}
                placeholder="Enter Instagram handle (without @)"
                autoCapitalize="none"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Facebook</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.facebook || ""}
                onChangeText={(value) => handleChange("facebook", value || null)}
                placeholder="Enter Facebook username"
                autoCapitalize="none"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">YouTube</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.youtube || ""}
                onChangeText={(value) => handleChange("youtube", value || null)}
                placeholder="Enter YouTube channel name"
                autoCapitalize="none"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Twitter</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.twitter || ""}
                onChangeText={(value) => handleChange("twitter", value || null)}
                placeholder="Enter Twitter handle (without @)"
                autoCapitalize="none"
              />
            </View>
          </View>

          <TouchableOpacity
            className={`py-3 rounded-lg flex-row items-center justify-center mb-10 ${saving ? 'bg-gray-400' : 'bg-blue-500'}`}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text className="text-white font-medium ml-2">Saving...</Text>
              </>
            ) : (
              <>
            <Save size={20} color="#FFFFFF" />
            <Text className="text-white font-medium ml-2">Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
