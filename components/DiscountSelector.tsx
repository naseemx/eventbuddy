import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';

interface DiscountSelectorProps {
  discountType: 'none' | 'percentage' | 'amount';
  discountPercentage: string;
  discountAmount: string;
  onDiscountTypeChange: (type: 'none' | 'percentage' | 'amount') => void;
  onDiscountPercentageChange: (value: string) => void;
  onDiscountAmountChange: (value: string) => void;
  subtotal: number;
  discountValue: number;
  currencySymbol?: string;
}

export default function DiscountSelector({
  discountType,
  discountPercentage,
  discountAmount,
  onDiscountTypeChange,
  onDiscountPercentageChange,
  onDiscountAmountChange,
  subtotal,
  discountValue,
  currencySymbol = '₹'
}: DiscountSelectorProps) {
  return (
    <View className="mb-3">
      <Text className="font-medium text-gray-700">Discount</Text>
      <View className="mt-2 flex-row flex-wrap">
        <TouchableOpacity
          className={`mr-2 mb-2 px-3 py-1 rounded-lg ${discountType === 'none' ? 'bg-blue-500' : 'bg-gray-200'}`}
          onPress={() => onDiscountTypeChange('none')}
        >
          <Text className={`${discountType === 'none' ? 'text-white' : 'text-gray-800'}`}>None</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`mr-2 mb-2 px-3 py-1 rounded-lg ${discountType === 'percentage' ? 'bg-blue-500' : 'bg-gray-200'}`}
          onPress={() => onDiscountTypeChange('percentage')}
        >
          <Text className={`${discountType === 'percentage' ? 'text-white' : 'text-gray-800'}`}>Percentage</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`mb-2 px-3 py-1 rounded-lg ${discountType === 'amount' ? 'bg-blue-500' : 'bg-gray-200'}`}
          onPress={() => onDiscountTypeChange('amount')}
        >
          <Text className={`${discountType === 'amount' ? 'text-white' : 'text-gray-800'}`}>Fixed Amount</Text>
        </TouchableOpacity>
      </View>
      
      {discountType === 'percentage' && (
        <View className="mt-2 flex-row items-center">
          <TextInput
            className="border border-gray-300 rounded-lg p-2 w-20 mr-2"
            keyboardType="numeric"
            value={discountPercentage}
            onChangeText={onDiscountPercentageChange}
            placeholder="0"
          />
          <Text className="text-gray-800">% off</Text>
        </View>
      )}
      
      {discountType === 'amount' && (
        <View className="mt-2 flex-row items-center">
          <Text className="mr-2">{currencySymbol}</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-2 w-24"
            keyboardType="numeric"
            value={discountAmount}
            onChangeText={onDiscountAmountChange}
            placeholder="0.00"
          />
        </View>
      )}
      
      {discountType !== 'none' && discountValue > 0 && (
        <View className="mt-2 flex-row justify-between">
          <Text className="text-gray-700">Discount:</Text>
          <Text className="text-red-500 font-medium">-{currencySymbol}{discountValue.toFixed(2)}</Text>
        </View>
      )}
    </View>
  );
} 