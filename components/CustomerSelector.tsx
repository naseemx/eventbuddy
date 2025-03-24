import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, FlatList, ActivityIndicator } from 'react-native';
import { Search, UserPlus, User, X, Check } from 'lucide-react-native';
import { getAllCustomers, Customer } from '../services/customerService';

interface CustomerSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
  onCreateNewCustomer: (customerData: { name: string; email?: string; phone?: string }) => void;
}

const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  visible,
  onClose,
  onSelectCustomer,
  onCreateNewCustomer,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  
  // New customer form state
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
  });

  // Load customers
  useEffect(() => {
    if (visible) {
      fetchCustomers();
    }
  }, [visible]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await getAllCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.phone && customer.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateNewCustomer = () => {
    if (!newCustomer.name.trim()) return;
    
    onCreateNewCustomer(newCustomer);
    setNewCustomer({ name: '', email: '', phone: '' });
    setShowNewCustomerForm(false);
  };

  const renderCustomerItem = ({ item }: { item: Customer }) => (
    <TouchableOpacity
      className="flex-row items-center p-3 border-b border-gray-100"
      onPress={() => onSelectCustomer(item)}
    >
      <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
        <User size={20} color="#3B82F6" />
      </View>
      <View className="flex-1">
        <Text className="text-gray-800 font-medium">{item.name}</Text>
        {item.email && <Text className="text-gray-500 text-sm">{item.email}</Text>}
        {item.phone && <Text className="text-gray-500 text-sm">{item.phone}</Text>}
      </View>
      <TouchableOpacity
        className="bg-blue-50 p-2 rounded-full"
        onPress={() => onSelectCustomer(item)}
      >
        <Check size={18} color="#3B82F6" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-xl h-5/6">
          {/* Header */}
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
            <Text className="text-xl font-bold text-gray-800">
              {showNewCustomerForm ? 'Add New Customer' : 'Select Customer'}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="p-2 rounded-full"
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {showNewCustomerForm ? (
            <View className="p-4">
              <View className="mb-4">
                <Text className="text-gray-700 mb-1 font-medium">Customer Name *</Text>
                <TextInput
                  className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                  placeholder="Enter customer name"
                  value={newCustomer.name}
                  onChangeText={(text) => setNewCustomer(prev => ({ ...prev, name: text }))}
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray-700 mb-1 font-medium">Email</Text>
                <TextInput
                  className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  value={newCustomer.email}
                  onChangeText={(text) => setNewCustomer(prev => ({ ...prev, email: text }))}
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray-700 mb-1 font-medium">Phone Number</Text>
                <TextInput
                  className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                  value={newCustomer.phone}
                  onChangeText={(text) => setNewCustomer(prev => ({ ...prev, phone: text }))}
                />
              </View>

              <View className="flex-row mt-4">
                <TouchableOpacity
                  className="flex-1 bg-gray-200 p-3 rounded-lg mr-3 items-center"
                  onPress={() => setShowNewCustomerForm(false)}
                >
                  <Text className="font-medium text-gray-700">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 p-3 rounded-lg items-center ${
                    !newCustomer.name.trim() ? 'bg-blue-300' : 'bg-blue-500'
                  }`}
                  onPress={handleCreateNewCustomer}
                  disabled={!newCustomer.name.trim()}
                >
                  <Text className="font-medium text-white">Save Customer</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              {/* Search and Add New */}
              <View className="p-4">
                <View className="flex-row mb-4">
                  <View className="flex-1 flex-row items-center bg-gray-100 px-3 py-2 rounded-lg mr-2">
                    <Search size={20} color="#6B7280" />
                    <TextInput
                      className="flex-1 ml-2 text-gray-800"
                      placeholder="Search customers..."
                      value={searchTerm}
                      onChangeText={setSearchTerm}
                    />
                  </View>
                  <TouchableOpacity
                    className="bg-blue-500 px-3 py-2 rounded-lg items-center justify-center"
                    onPress={() => setShowNewCustomerForm(true)}
                  >
                    <UserPlus size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Customer List */}
              {loading ? (
                <View className="flex-1 justify-center items-center">
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text className="mt-2 text-gray-600">Loading customers...</Text>
                </View>
              ) : filteredCustomers.length === 0 ? (
                <View className="flex-1 justify-center items-center p-4">
                  <User size={48} color="#9CA3AF" />
                  <Text className="mt-4 text-gray-500 text-center">
                    {searchTerm
                      ? `No customers found matching "${searchTerm}"`
                      : 'No customers found. Add your first customer.'}
                  </Text>
                  <TouchableOpacity
                    className="mt-4 bg-blue-500 px-4 py-2 rounded-lg"
                    onPress={() => setShowNewCustomerForm(true)}
                  >
                    <Text className="text-white font-medium">Add New Customer</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={filteredCustomers}
                  renderItem={renderCustomerItem}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={{ padding: 8 }}
                />
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default CustomerSelector; 