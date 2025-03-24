import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react-native';

export interface NotificationProps {
  visible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onDismiss: () => void;
  autoClose?: number;
  showDismissButton?: boolean;
}

const Notification: React.FC<NotificationProps> = ({
  visible,
  type,
  message,
  onDismiss,
  autoClose = 3000,  // Default auto-dismiss after 3 seconds
  showDismissButton = true,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss timer
      if (autoClose > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, autoClose);
        return () => clearTimeout(timer);
      }
    }
  }, [visible]);

  const handleDismiss = () => {
    // Hide animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  // Configure styles based on notification type
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-100',
          border: 'border-green-400',
          textColor: 'text-green-800',
          icon: <CheckCircle2 size={22} color="#15803d" />,
        };
      case 'error':
        return {
          bg: 'bg-red-100',
          border: 'border-red-400',
          textColor: 'text-red-800',
          icon: <XCircle size={22} color="#b91c1c" />,
        };
      case 'warning':
        return {
          bg: 'bg-yellow-100',
          border: 'border-yellow-400',
          textColor: 'text-yellow-800',
          icon: <AlertCircle size={22} color="#854d0e" />,
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-100',
          border: 'border-blue-400',
          textColor: 'text-blue-800',
          icon: <Info size={22} color="#1e40af" />,
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <Animated.View
      className={`absolute top-2 left-4 right-4 ${styles.bg} border ${styles.border} rounded-lg shadow-md z-50`}
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <View className="flex-row items-center justify-between p-3">
        <View className="flex-row items-center flex-1">
          <View className="mr-3">{styles.icon}</View>
          <Text className={`${styles.textColor} flex-1 font-medium`}>{message}</Text>
        </View>
        
        {showDismissButton && (
          <TouchableOpacity
            onPress={handleDismiss}
            className="p-1 rounded-full"
          >
            <X size={18} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

export default Notification; 