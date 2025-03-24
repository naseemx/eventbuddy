import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ArrowLeft,
  HelpCircle,
  Mail,
  Phone,
  MessageSquare,
  FileText,
  Send,
  ExternalLink,
  BookOpen,
  Video,
  MessageCircle,
} from "lucide-react-native";

import Header from "../../components/Header";

export default function HelpSupportScreen() {
  const insets = useSafeAreaInsets();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = () => {
    if (!subject.trim()) {
      Alert.alert("Error", "Please enter a subject for your message");
      return;
    }

    if (!message.trim()) {
      Alert.alert("Error", "Please enter your message");
      return;
    }

    setIsSending(true);
    // Simulate sending message
    setTimeout(() => {
      setIsSending(false);
      setSubject("");
      setMessage("");
      Alert.alert(
        "Message Sent",
        "Your message has been sent. We'll get back to you soon!",
      );
    }, 1500);
  };

  const handleOpenEmail = () => {
    Linking.openURL("mailto:support@rentalprosolutions.com");
  };

  const handleOpenPhone = () => {
    Linking.openURL("tel:+15551234567");
  };

  const handleOpenWebsite = () => {
    Linking.openURL("https://www.rentalprosolutions.com/support");
  };

  const handleOpenFAQ = () => {
    Linking.openURL("https://www.rentalprosolutions.com/faq");
  };

  const handleOpenTutorials = () => {
    Linking.openURL("https://www.rentalprosolutions.com/tutorials");
  };

  const handleOpenChat = () => {
    Alert.alert(
      "Live Chat",
      "Would you like to start a live chat with our support team?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start Chat",
          onPress: () => {
            Alert.alert(
              "Live Chat",
              "Live chat feature will be available in the next update.",
            );
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Header
        title="Help & Support"
        leftIcon={<ArrowLeft size={24} color="#000" />}
        onLeftPress={() => router.back()}
      />

      <ScrollView
        className="flex-1 px-4 py-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
      >
        <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
          <View className="flex-row items-center mb-4">
            <HelpCircle size={24} color="#4B5563" />
            <Text className="text-xl font-bold ml-2 text-gray-800">
              How can we help you?
            </Text>
          </View>

          <Text className="text-gray-600 mb-4">
            Our support team is ready to assist you with any questions or issues
            you may have with the rental management system.
          </Text>

          <View className="bg-blue-50 p-4 rounded-lg mb-4">
            <Text className="text-blue-800 font-medium mb-2">
              Support Hours
            </Text>
            <Text className="text-blue-700">
              Monday - Friday: 9:00 AM - 6:00 PM EST
            </Text>
            <Text className="text-blue-700">
              Saturday: 10:00 AM - 2:00 PM EST
            </Text>
            <Text className="text-blue-700">Sunday: Closed</Text>
          </View>
        </View>

        {/* Self-Help Resources */}
        <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
          <Text className="text-lg font-bold mb-4 text-gray-800">
            Self-Help Resources
          </Text>

          <TouchableOpacity
            className="flex-row items-center p-4 bg-gray-50 rounded-lg mb-3"
            onPress={handleOpenFAQ}
          >
            <View className="w-10 h-10 bg-amber-100 rounded-full items-center justify-center mr-3">
              <BookOpen size={20} color="#F59E0B" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-800 font-medium">FAQ</Text>
              <Text className="text-gray-500 text-sm">
                Browse frequently asked questions
              </Text>
            </View>
            <ExternalLink size={18} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center p-4 bg-gray-50 rounded-lg mb-3"
            onPress={handleOpenTutorials}
          >
            <View className="w-10 h-10 bg-indigo-100 rounded-full items-center justify-center mr-3">
              <Video size={20} color="#6366F1" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-800 font-medium">Video Tutorials</Text>
              <Text className="text-gray-500 text-sm">
                Watch step-by-step guides
              </Text>
            </View>
            <ExternalLink size={18} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center p-4 bg-gray-50 rounded-lg"
            onPress={handleOpenChat}
          >
            <View className="w-10 h-10 bg-pink-100 rounded-full items-center justify-center mr-3">
              <MessageCircle size={20} color="#EC4899" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-800 font-medium">Live Chat</Text>
              <Text className="text-gray-500 text-sm">
                Chat with our support team
              </Text>
            </View>
            <ExternalLink size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Contact Us */}
        <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
          <Text className="text-lg font-bold mb-4 text-gray-800">
            Contact Us
          </Text>

          <TouchableOpacity
            className="flex-row items-center p-4 bg-gray-50 rounded-lg mb-3"
            onPress={handleOpenEmail}
          >
            <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
              <Mail size={20} color="#3B82F6" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-800 font-medium">Email Support</Text>
              <Text className="text-gray-500 text-sm">
                support@rentalprosolutions.com
              </Text>
            </View>
            <ExternalLink size={18} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center p-4 bg-gray-50 rounded-lg mb-3"
            onPress={handleOpenPhone}
          >
            <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
              <Phone size={20} color="#10B981" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-800 font-medium">Phone Support</Text>
              <Text className="text-gray-500 text-sm">+1 (555) 123-4567</Text>
            </View>
            <ExternalLink size={18} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center p-4 bg-gray-50 rounded-lg"
            onPress={handleOpenWebsite}
          >
            <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-3">
              <FileText size={20} color="#8B5CF6" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-800 font-medium">Knowledge Base</Text>
              <Text className="text-gray-500 text-sm">
                Visit our support website
              </Text>
            </View>
            <ExternalLink size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Send a Message */}
        <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
          <Text className="text-lg font-bold mb-4 text-gray-800">
            Send a Message
          </Text>

          <View className="mb-4">
            <Text className="text-gray-700 mb-2 font-medium">Subject</Text>
            <TextInput
              className="bg-gray-50 p-3 rounded-lg border border-gray-200"
              placeholder="What's your question about?"
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 mb-2 font-medium">Message</Text>
            <TextInput
              className="bg-gray-50 p-3 rounded-lg border border-gray-200 min-h-[120px]"
              placeholder="Describe your issue or question"
              multiline
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
            />
          </View>

          <TouchableOpacity
            className="bg-blue-500 py-3 rounded-lg flex-row items-center justify-center"
            onPress={handleSendMessage}
            disabled={isSending}
          >
            {isSending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Send size={20} color="#FFFFFF" />
                <Text className="text-white font-medium ml-2">
                  Send Message
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
