import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  StatusBar,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Building,
  Mail,
  Phone,
  MapPin,
  Globe,
  Edit,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  MessageCircle,
} from "lucide-react-native";
import Animated, { FadeIn } from 'react-native-reanimated';

import Header from "../../components/Header";
import OptimizedImage from "../../components/OptimizedImage";
import { useCompany } from "../../services/companyContext";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { companyData, loading, error, refreshCompanyData } = useCompany();

  // Refresh on mount just in case
  React.useEffect(() => {
    console.log("ProfileScreen: Refreshing company data on mount");
    refreshCompanyData();
  }, []);

  const handleEditCompany = () => {
    router.push("/profile/edit");
  };

  const openLink = (url: string) => {
    // Add http:// if not already present
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    Linking.openURL(url);
  };

  const openWhatsApp = (number: string) => {
    if (!number) return;
    Linking.openURL(`whatsapp://send?phone=${number.replace(/[^0-9]/g, '')}`);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f9fafb' }} className="items-center justify-center">
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-4 text-gray-600">Loading company profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f9fafb' }} className="items-center justify-center">
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <Text className="text-red-500 mb-4">{error}</Text>
        <TouchableOpacity 
          className="bg-blue-500 px-4 py-2 rounded-lg"
          onPress={() => refreshCompanyData()}
        >
          <Text className="text-white">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // If no company data, show setup screen
  if (!companyData) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <Header title="Company Profile" />
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-xl font-semibold text-gray-800 mb-4">
            No Company Profile Found
          </Text>
          <Text className="text-gray-600 text-center mb-8">
            Set up your company profile to display your business information.
          </Text>
          <TouchableOpacity
            className="bg-blue-500 px-6 py-3 rounded-lg flex-row items-center"
            onPress={handleEditCompany}
          >
            <Edit size={20} color="#FFFFFF" />
            <Text className="text-white font-medium ml-2">Set Up Company Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Header title="Company Profile" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom }}
      >
        {/* Company Header */}
        <Animated.View 
          className="bg-white p-5 rounded-xl shadow-sm mb-5 items-center"
          entering={FadeIn.duration(400)}
        >
          <OptimizedImage
            source={companyData.logo}
            style={{ width: 96, height: 96, borderRadius: 48 }}
            showPlaceholder={true}
            placeholderText={companyData.name?.charAt(0) || "C"}
          />
          <Text className="text-2xl font-bold text-gray-900 mt-4" numberOfLines={1} ellipsizeMode="tail">{companyData.name}</Text>
          {companyData.foundedYear && (
            <Text className="text-gray-600 mb-2">Since {companyData.foundedYear}</Text>
          )}
          <TouchableOpacity
            className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center mt-2"
            onPress={handleEditCompany}
            activeOpacity={0.7}
          >
            <Edit size={16} color="#FFFFFF" />
            <Text className="text-white font-medium ml-2">Edit Company</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Contact Information */}
        <Animated.View 
          className="bg-white p-5 rounded-xl shadow-sm mb-5"
          entering={FadeIn.duration(400).delay(100)}
        >
          <Text className="text-lg font-bold mb-4 text-gray-900">
            Contact Information
          </Text>

          {companyData.email && (
          <View className="flex-row items-center mb-3">
            <View className="w-8 items-center">
              <Mail size={20} color="#4B5563" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-gray-500 text-sm">Email</Text>
              <Text className="text-gray-800 font-medium" numberOfLines={1} ellipsizeMode="tail">{companyData.email}</Text>
            </View>
          </View>
          )}

          {companyData.phone && (
          <View className="flex-row items-center mb-3">
            <View className="w-8 items-center">
              <Phone size={20} color="#4B5563" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-gray-500 text-sm">Phone</Text>
              <Text className="text-gray-800 font-medium">{companyData.phone}</Text>
            </View>
          </View>
          )}

          {companyData.whatsapp && (
          <View className="flex-row items-center mb-3">
            <View className="w-8 items-center">
              <MessageCircle size={20} color="#25D366" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-gray-500 text-sm">WhatsApp</Text>
              <TouchableOpacity onPress={() => openWhatsApp(companyData.whatsapp!)}>
                <Text className="text-green-600 font-medium">{companyData.whatsapp}</Text>
              </TouchableOpacity>
            </View>
          </View>
          )}

          {companyData.address && (
          <View className="flex-row items-center mb-3">
            <View className="w-8 items-center">
              <MapPin size={20} color="#4B5563" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-gray-500 text-sm">Address</Text>
              <Text className="text-gray-800 font-medium" numberOfLines={2} ellipsizeMode="tail">{companyData.address}</Text>
            </View>
          </View>
          )}

          {companyData.website && (
          <View className="flex-row items-center mb-3">
            <View className="w-8 items-center">
              <Globe size={20} color="#4B5563" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-gray-500 text-sm">Website</Text>
              <TouchableOpacity onPress={() => openLink(companyData.website!)}>
                <Text className="text-blue-600 font-medium" numberOfLines={1} ellipsizeMode="tail">{companyData.website}</Text>
              </TouchableOpacity>
            </View>
          </View>
          )}

          {companyData.taxId && (
          <View className="flex-row items-center">
            <View className="w-8 items-center">
              <Building size={20} color="#4B5563" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-gray-500 text-sm">Tax ID</Text>
              <Text className="text-gray-800 font-medium">{companyData.taxId}</Text>
            </View>
          </View>
          )}
        </Animated.View>

        {/* Social Media */}
        <Animated.View 
          className="bg-white p-5 rounded-xl shadow-sm mb-5"
          entering={FadeIn.duration(400).delay(200)}
        >
          <Text className="text-lg font-bold mb-4 text-gray-900">
            Social Media
          </Text>

          {companyData.instagram && (
          <View className="flex-row items-center mb-3">
            <View className="w-8 items-center">
              <Instagram size={20} color="#E1306C" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-gray-500 text-sm">Instagram</Text>
              <TouchableOpacity onPress={() => openLink(`https://instagram.com/${companyData.instagram}`)}>
                <Text className="text-pink-600 font-medium">@{companyData.instagram}</Text>
              </TouchableOpacity>
            </View>
          </View>
          )}

          {companyData.facebook && (
          <View className="flex-row items-center mb-3">
            <View className="w-8 items-center">
              <Facebook size={20} color="#1877F2" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-gray-500 text-sm">Facebook</Text>
              <TouchableOpacity onPress={() => openLink(`https://facebook.com/${companyData.facebook}`)}>
                <Text className="text-blue-600 font-medium">@{companyData.facebook}</Text>
              </TouchableOpacity>
            </View>
          </View>
          )}

          {companyData.youtube && (
          <View className="flex-row items-center mb-3">
            <View className="w-8 items-center">
              <Youtube size={20} color="#FF0000" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-gray-500 text-sm">YouTube</Text>
              <TouchableOpacity onPress={() => openLink(`https://youtube.com/@${companyData.youtube}`)}>
                <Text className="text-red-600 font-medium">@{companyData.youtube}</Text>
              </TouchableOpacity>
            </View>
          </View>
          )}

          {companyData.twitter && (
          <View className="flex-row items-center">
            <View className="w-8 items-center">
              <Twitter size={20} color="#1DA1F2" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-gray-500 text-sm">Twitter</Text>
              <TouchableOpacity onPress={() => openLink(`https://twitter.com/${companyData.twitter}`)}>
                <Text className="text-blue-400 font-medium">@{companyData.twitter}</Text>
              </TouchableOpacity>
            </View>
          </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}
