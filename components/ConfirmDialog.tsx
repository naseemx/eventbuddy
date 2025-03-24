import React from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { AlertTriangle, Trash2, X } from 'lucide-react-native';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
  type?: 'danger' | 'warning' | 'info';
  icon?: React.ReactNode;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isProcessing = false,
  type = 'danger',
  icon,
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'bg-red-100',
          icon: icon || <Trash2 size={24} color="#dc2626" />,
          confirmBg: 'bg-red-600',
          confirmBgPressed: 'bg-red-700',
          confirmText: 'text-white',
        };
      case 'warning':
        return {
          iconBg: 'bg-yellow-100',
          icon: icon || <AlertTriangle size={24} color="#ca8a04" />,
          confirmBg: 'bg-yellow-600',
          confirmBgPressed: 'bg-yellow-700',
          confirmText: 'text-white',
        };
      case 'info':
      default:
        return {
          iconBg: 'bg-blue-100',
          icon: icon || <AlertTriangle size={24} color="#2563eb" />,
          confirmBg: 'bg-blue-600',
          confirmBgPressed: 'bg-blue-700',
          confirmText: 'text-white',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 justify-center items-center bg-black/50 p-5">
        <View className="bg-white rounded-xl w-full max-w-sm shadow-xl">
          <View className="p-5">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <View className={`${styles.iconBg} p-2 rounded-full mr-3`}>
                  {styles.icon}
                </View>
                <Text className="text-xl font-bold text-gray-900">{title}</Text>
              </View>
              <TouchableOpacity 
                onPress={onCancel}
                className="rounded-full p-1"
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <Text className="text-gray-600 mb-6">{message}</Text>
            
            <View className="flex-row justify-end">
              <TouchableOpacity
                onPress={onCancel}
                disabled={isProcessing}
                className="py-2.5 px-4 rounded-lg bg-gray-100 mr-3"
              >
                <Text className="font-medium text-gray-700">{cancelText}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={onConfirm}
                disabled={isProcessing}
                className={`py-2.5 px-5 rounded-lg ${styles.confirmBg} flex-row items-center justify-center ${isProcessing ? 'opacity-70' : ''}`}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" className="mr-2" />
                ) : null}
                <Text className={`font-medium ${styles.confirmText}`}>{confirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmDialog; 