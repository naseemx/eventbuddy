import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
  initialDate?: Date;
  title?: string;
}

const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  onClose,
  onSelectDate,
  initialDate = new Date(),
  title = 'Select Date',
}) => {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [calendarMonth, setCalendarMonth] = useState(initialDate.getMonth());
  const [calendarYear, setCalendarYear] = useState(initialDate.getFullYear());

  // Array of month names
  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Get days in a month
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get day of week for the first day of month
  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Handle selecting a date from the calendar
  const handleSelectDate = (day: number) => {
    const newDate = new Date(calendarYear, calendarMonth, day);
    setSelectedDate(newDate);
  };

  // Previous month
  const prevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };

  // Next month
  const nextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };

  // Confirm selected date
  const confirmDate = () => {
    onSelectDate(selectedDate);
    onClose();
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(calendarMonth, calendarYear);
    const firstDay = getFirstDayOfMonth(calendarMonth, calendarYear);
    
    const days = [];
    
    // Empty spaces for days before the 1st of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  // Calculate the grid columns (7 days per week)
  const calendarDays = generateCalendarDays();

  // Format date as MM/DD/YYYY
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white rounded-xl p-4 w-11/12 max-w-md">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-800">{title}</Text>
            <TouchableOpacity 
              onPress={onClose}
              className="p-2"
            >
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          {/* Month and Year Selector */}
          <View className="flex-row justify-between items-center mb-4">
            <TouchableOpacity 
              onPress={prevMonth}
              className="p-2"
            >
              <ChevronLeft size={20} color="#3B82F6" />
            </TouchableOpacity>
            
            <View className="flex-row items-center">
              <Text className="text-lg font-medium text-gray-800 mr-2">
                {MONTHS[calendarMonth]}
              </Text>
              <Text className="text-lg font-medium text-gray-800">
                {calendarYear}
              </Text>
            </View>
            
            <TouchableOpacity 
              onPress={nextMonth}
              className="p-2"
            >
              <ChevronRight size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>
          
          {/* Day of Week Headers */}
          <View className="flex-row mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <View key={index} className="flex-1 items-center">
                <Text className="text-gray-500 font-medium">{day}</Text>
              </View>
            ))}
          </View>
          
          {/* Calendar Grid */}
          <View className="flex-row flex-wrap">
            {calendarDays.map((day, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => day && handleSelectDate(day)}
                className={`w-1/7 aspect-square items-center justify-center p-1`}
                disabled={!day}
              >
                {day ? (
                  <View 
                    className={`w-10 h-10 rounded-full items-center justify-center
                      ${selectedDate.getDate() === day && 
                        selectedDate.getMonth() === calendarMonth && 
                        selectedDate.getFullYear() === calendarYear 
                          ? 'bg-blue-500' : 'bg-gray-100'}`
                    }
                  >
                    <Text 
                      className={`text-base ${
                        selectedDate.getDate() === day && 
                        selectedDate.getMonth() === calendarMonth && 
                        selectedDate.getFullYear() === calendarYear 
                          ? 'text-white font-medium' 
                          : 'text-gray-800'
                      }`}
                    >
                      {day}
                    </Text>
                  </View>
                ) : (
                  <View className="w-10 h-10" />
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Selected Date Display */}
          <View className="mt-4 mb-4 p-3 bg-blue-50 rounded-lg">
            <Text className="text-center text-blue-800 font-medium">
              Selected: {formatDate(selectedDate)}
            </Text>
          </View>
          
          {/* Cancel/Confirm Buttons */}
          <View className="flex-row justify-end">
            <TouchableOpacity
              onPress={onClose}
              className="px-4 py-2 mr-2 rounded-lg bg-gray-200"
            >
              <Text className="text-gray-800 font-medium">Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={confirmDate}
              className="px-4 py-2 rounded-lg bg-blue-500"
            >
              <Text className="text-white font-medium">Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DatePickerModal; 