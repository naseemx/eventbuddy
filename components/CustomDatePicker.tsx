import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Calendar } from 'lucide-react-native';

interface CustomDatePickerProps {
  date: Date;
  onDateChange: (date: Date) => void;
  label?: string;
  required?: boolean;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  date,
  onDateChange,
  label,
  required = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  // Generate years, months, and days
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 2 + i);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const [selectedYear, setSelectedYear] = useState(date.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(date.getMonth());
  const [selectedDay, setSelectedDay] = useState(date.getDate());
  
  const days = Array.from(
    { length: getDaysInMonth(selectedYear, selectedMonth) },
    (_, i) => i + 1
  );

  const confirmDate = () => {
    const newDate = new Date(selectedYear, selectedMonth, selectedDay);
    onDateChange(newDate);
    setModalVisible(false);
  };

  return (
    <View>
      {label && (
        <Text className="text-gray-600 mb-1">
          {label}{required && <Text className="text-red-500">*</Text>}
        </Text>
      )}
      
      <TouchableOpacity
        className="flex-row items-center border border-gray-300 p-2 rounded-lg"
        onPress={() => setModalVisible(true)}
      >
        <Calendar size={18} color="#6B7280" />
        <Text className="ml-2">{date.toLocaleDateString()}</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-xl p-4">
            <View className="flex-row justify-between items-center mb-4">
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text className="text-red-500 font-bold">Cancel</Text>
              </TouchableOpacity>
              <Text className="text-lg font-bold">Select Date</Text>
              <TouchableOpacity onPress={confirmDate}>
                <Text className="text-blue-500 font-bold">Confirm</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row mb-4">
              {/* Year Picker */}
              <View className="flex-1 mr-2">
                <Text className="text-gray-600 mb-1 text-center">Year</Text>
                <ScrollView className="border border-gray-300 rounded-lg h-40">
                  {years.map(year => (
                    <TouchableOpacity
                      key={year}
                      className={`p-3 ${selectedYear === year ? 'bg-blue-100' : ''}`}
                      onPress={() => setSelectedYear(year)}
                    >
                      <Text className={`text-center ${selectedYear === year ? 'font-bold text-blue-700' : ''}`}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Month Picker */}
              <View className="flex-1 mx-2">
                <Text className="text-gray-600 mb-1 text-center">Month</Text>
                <ScrollView className="border border-gray-300 rounded-lg h-40">
                  {months.map((month, index) => (
                    <TouchableOpacity
                      key={month}
                      className={`p-3 ${selectedMonth === index ? 'bg-blue-100' : ''}`}
                      onPress={() => {
                        setSelectedMonth(index);
                        // Adjust day if necessary
                        const daysInNewMonth = getDaysInMonth(selectedYear, index);
                        if (selectedDay > daysInNewMonth) {
                          setSelectedDay(daysInNewMonth);
                        }
                      }}
                    >
                      <Text className={`text-center ${selectedMonth === index ? 'font-bold text-blue-700' : ''}`}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Day Picker */}
              <View className="flex-1 ml-2">
                <Text className="text-gray-600 mb-1 text-center">Day</Text>
                <ScrollView className="border border-gray-300 rounded-lg h-40">
                  {days.map(day => (
                    <TouchableOpacity
                      key={day}
                      className={`p-3 ${selectedDay === day ? 'bg-blue-100' : ''}`}
                      onPress={() => setSelectedDay(day)}
                    >
                      <Text className={`text-center ${selectedDay === day ? 'font-bold text-blue-700' : ''}`}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CustomDatePicker; 