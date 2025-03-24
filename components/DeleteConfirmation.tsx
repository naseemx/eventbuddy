import React from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { AlertTriangle, X } from 'lucide-react-native';

type DeleteConfirmationProps = {
  isVisible: boolean;
  title: string;
  message: string;
  itemName?: string;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const DeleteConfirmation = ({
  isVisible,
  title,
  message,
  itemName,
  isLoading = false,
  onCancel,
  onConfirm,
}: DeleteConfirmationProps) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onCancel}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white rounded-lg w-4/5 p-5 shadow-lg">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <AlertTriangle size={24} color="#EF4444" />
              <Text className="text-xl font-bold text-gray-800 ml-2">{title}</Text>
            </View>
            <TouchableOpacity onPress={onCancel} disabled={isLoading}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <Text className="text-gray-700 mb-6">
            {message}
            {itemName && <Text className="font-bold"> "{itemName}"</Text>}?
          </Text>
          
          <View className="flex-row justify-end">
            <TouchableOpacity
              className="py-2 px-4 rounded-lg bg-gray-200 mr-3"
              onPress={onCancel}
              disabled={isLoading}
            >
              <Text className="text-gray-800 font-medium">Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className={`py-2 px-4 rounded-lg ${isLoading ? 'bg-red-300' : 'bg-red-500'} flex-row items-center`}
              onPress={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" className="mr-2" />
              ) : null}
              <Text className="text-white font-medium">
                {isLoading ? 'Deleting...' : 'Delete'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DeleteConfirmation; 