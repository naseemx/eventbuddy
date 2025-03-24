import React, { useEffect } from 'react';
import { View, Text, Animated, TouchableOpacity } from 'react-native';
import { CheckCircle, X } from 'lucide-react-native';

type SuccessNotificationProps = {
  visible: boolean;
  message: string;
  onDismiss: () => void;
  duration?: number;
};

const SuccessNotification = ({
  visible,
  message,
  onDismiss,
  duration = 3000,
}: SuccessNotificationProps) => {
  const translateY = new Animated.Value(-100);
  
  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 9,
      }).start();
      
      // Auto dismiss after duration
      const timer = setTimeout(() => {
        dismissNotification();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [visible]);
  
  const dismissNotification = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };
  
  if (!visible) return null;
  
  return (
    <Animated.View 
      className="absolute top-0 left-0 right-0 z-50"
      style={{ transform: [{ translateY }] }}
    >
      <View className="mx-4 mt-2 bg-green-500 rounded-lg p-4 shadow-md">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <CheckCircle size={20} color="white" />
            <Text className="text-white font-medium ml-2 flex-1">{message}</Text>
          </View>
          
          <TouchableOpacity onPress={dismissNotification}>
            <X size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

export default SuccessNotification; 