import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Linking,
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

import Header from "../../components/Header";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  // Mock company data
  const company = {
    id: "1",
    name: "TechFlow Solutions",
    email: "info@techflow.com",
    phone: "(555) 987-6543",
    whatsapp: "(555) 123-4567",
    address: "456 Business Plaza, Enterprise City, USA",
    website: "www.techflow.com",
    logo: "https://api.dicebear.com/7.x/initials/svg?seed=TF",
    taxId: "TAX-12345678",
    foundedYear: "2015",
    socialMedia: {
      instagram: "techflow_official",
      facebook: "TechFlowSolutions",
      youtube: "TechFlowOfficial",
      twitter: "TechFlow"
    }
  };

  const handleEditCompany = () => {
    router.push("/profile/edit");
  };

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  const openWhatsApp = (number: string) => {
    Linking.openURL(`whatsapp://send?phone=${number.replace(/[^0-9]/g, '')}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Header title="Company Profile" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom }}
      >
        {/* Company Header */}
        <View className="bg-white p-5 rounded-xl shadow-sm mb-5 items-center">
          <Image
            source={{ uri: company.logo }}
            className="w-24 h-24 rounded-full mb-4"
          />
          <Text className="text-2xl font-bold text-gray-900">{company.name}</Text>
          <Text className="text-gray-600 mb-2">Since {company.foundedYear}</Text>
          <TouchableOpacity
            className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center mt-2"
            onPress={handleEditCompany}
          >
            <Edit size={16} color="#FFFFFF" />
            <Text className="text-white font-medium ml-2">Edit Company</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Information */}
        <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
          <Text className="text-lg font-bold mb-4 text-gray-900">
            Contact Information
          </Text>

          <View className="flex-row items-center mb-3">
            <Mail size={20} color="#4B5563" className="mr-3" />
            <View>
              <Text className="text-gray-500 text-sm">Email</Text>
              <Text className="text-gray-800 font-medium">{company.email}</Text>
            </View>
          </View>

          <View className="flex-row items-center mb-3">
            <Phone size={20} color="#4B5563" className="mr-3" />
            <View>
              <Text className="text-gray-500 text-sm">Phone</Text>
              <Text className="text-gray-800 font-medium">{company.phone}</Text>
            </View>
          </View>

          <View className="flex-row items-center mb-3">
            <MessageCircle size={20} color="#25D366" className="mr-3" />
            <View>
              <Text className="text-gray-500 text-sm">WhatsApp</Text>
              <TouchableOpacity onPress={() => openWhatsApp(company.whatsapp)}>
                <Text className="text-green-600 font-medium">{company.whatsapp}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row items-center mb-3">
            <MapPin size={20} color="#4B5563" className="mr-3" />
            <View>
              <Text className="text-gray-500 text-sm">Address</Text>
              <Text className="text-gray-800 font-medium">{company.address}</Text>
            </View>
          </View>

          <View className="flex-row items-center mb-3">
            <Globe size={20} color="#4B5563" className="mr-3" />
            <View>
              <Text className="text-gray-500 text-sm">Website</Text>
              <TouchableOpacity onPress={() => openLink(`https://${company.website}`)}>
                <Text className="text-blue-600 font-medium">{company.website}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row items-center">
            <Building size={20} color="#4B5563" className="mr-3" />
            <View>
              <Text className="text-gray-500 text-sm">Tax ID</Text>
              <Text className="text-gray-800 font-medium">{company.taxId}</Text>
            </View>
          </View>
        </View>

        {/* Social Media */}
        <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
          <Text className="text-lg font-bold mb-4 text-gray-900">
            Social Media
          </Text>

          <View className="flex-row items-center mb-3">
            <Instagram size={20} color="#E1306C" className="mr-3" />
            <View>
              <Text className="text-gray-500 text-sm">Instagram</Text>
              <TouchableOpacity onPress={() => openLink(`https://instagram.com/${company.socialMedia.instagram}`)}>
                <Text className="text-pink-600 font-medium">@{company.socialMedia.instagram}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row items-center mb-3">
            <Facebook size={20} color="#1877F2" className="mr-3" />
            <View>
              <Text className="text-gray-500 text-sm">Facebook</Text>
              <TouchableOpacity onPress={() => openLink(`https://facebook.com/${company.socialMedia.facebook}`)}>
                <Text className="text-blue-600 font-medium">@{company.socialMedia.facebook}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row items-center mb-3">
            <Youtube size={20} color="#FF0000" className="mr-3" />
            <View>
              <Text className="text-gray-500 text-sm">YouTube</Text>
              <TouchableOpacity onPress={() => openLink(`https://youtube.com/@${company.socialMedia.youtube}`)}>
                <Text className="text-red-600 font-medium">@{company.socialMedia.youtube}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row items-center">
            <Twitter size={20} color="#1DA1F2" className="mr-3" />
            <View>
              <Text className="text-gray-500 text-sm">Twitter</Text>
              <TouchableOpacity onPress={() => openLink(`https://twitter.com/${company.socialMedia.twitter}`)}>
                <Text className="text-blue-400 font-medium">@{company.socialMedia.twitter}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
