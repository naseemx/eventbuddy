import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import {
  ArrowLeft,
  Search,
  Filter,
  Plus,
  X,
  DollarSign,
  CreditCard,
  Calendar,
  FileText,
} from "lucide-react-native";
import { getTransactions, Transaction } from "../../services/transactionService";
import Header from "../../components/Header";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterType, setFilterType] = useState<'income' | 'expense' | null>(null);

  // Fetch transactions from API
  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getTransactions();
      setTransactions(data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and refresh on focus
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [fetchTransactions])
  );

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  }, [fetchTransactions]);

  // Apply search and filters
  const filteredTransactions = transactions.filter(transaction => {
    // Apply type filter if set
    if (filterType && transaction.type !== filterType) return false;
    
    // Apply search filter if text is entered
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      return (
        (transaction.description?.toLowerCase().includes(searchLower) || false) ||
        (transaction.category?.toLowerCase().includes(searchLower) || false) ||
        (transaction.amount.toString().includes(searchLower))
      );
    }
    
    return true;
  });

  // Clear all filters
  const clearFilters = () => {
    setFilterType(null);
    setSearchText("");
    setShowFilterMenu(false);
  };

  // Render a transaction item
  const renderTransactionItem = ({ item, index }: { item: Transaction; index: number }) => {
    const isIncome = item.type === 'income';
    const amount = parseFloat(item.amount.toString());
    const formattedAmount = `${isIncome ? '+' : '-'} ₹${amount.toFixed(2)}`;
    
    // Format date
    const date = item.transaction_date ? 
      new Date(item.transaction_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short', 
        day: 'numeric'
      }) : 'No date';

    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 50).springify()}
        className="bg-white p-4 rounded-lg mb-3 shadow-sm"
      >
        <TouchableOpacity
          onPress={() => router.push(`/finances/transaction-details?id=${item.id}`)}
          activeOpacity={0.7}
        >
          <View className="flex-row justify-between items-start">
            <View className="flex-row items-center flex-1">
              <View className={`w-10 h-10 rounded-full ${isIncome ? 'bg-green-100' : 'bg-red-100'} items-center justify-center mr-3`}>
                <DollarSign size={18} color={isIncome ? '#10B981' : '#EF4444'} />
              </View>
              <View className="flex-1">
                <Text className="font-medium text-gray-900" numberOfLines={1} ellipsizeMode="tail">
                  {item.description || `${isIncome ? 'Income' : 'Expense'}`}
                </Text>
                <View className="flex-row items-center mt-1">
                  <FileText size={14} color="#6B7280" className="mr-1" />
                  <Text className="text-gray-500 text-sm">
                    {item.category || 'Uncategorized'}
                  </Text>
                </View>
                <View className="flex-row items-center mt-1">
                  <Calendar size={14} color="#6B7280" className="mr-1" />
                  <Text className="text-gray-500 text-sm">{date}</Text>
                </View>
              </View>
            </View>
            <Text className={`font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
              {formattedAmount}
            </Text>
          </View>
          {item.payment_method && (
            <View className="mt-2 flex-row items-center">
              <CreditCard size={14} color="#6B7280" />
              <Text className="text-xs text-gray-500 ml-1">
                Paid via {item.payment_method}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Header 
        title="Transactions" 
        leftIcon={<ArrowLeft size={24} color="#000" />}
        onLeftPress={() => router.back()}
      />

      <View className="flex-1 p-4">
        <View className="flex-row space-x-3 mb-4">
          <View className="flex-1 bg-white border border-gray-200 rounded-lg p-2 flex-row items-center">
            <Search size={18} color="#6B7280" />
            <TextInput
              placeholder="Search transactions..."
              className="ml-2 flex-1"
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText ? (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <X size={16} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity 
            className={`bg-white border ${showFilterMenu ? 'border-blue-500' : 'border-gray-200'} rounded-lg p-2 flex-row justify-center items-center px-4`}
            onPress={() => setShowFilterMenu(!showFilterMenu)}
          >
            <Filter size={18} color={showFilterMenu ? "#3B82F6" : "#6B7280"} />
            <Text className={`ml-2 ${showFilterMenu ? 'text-blue-500' : 'text-gray-500'}`}>Filter</Text>
          </TouchableOpacity>
        </View>
        
        {showFilterMenu && (
          <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <Text className="font-medium mb-2">Filter by Type</Text>
            <View className="flex-row mb-2">
              <TouchableOpacity
                className={`mr-2 py-1 px-3 rounded-full ${filterType === 'income' ? 'bg-green-100 border border-green-500' : 'bg-gray-100'}`}
                onPress={() => setFilterType(filterType === 'income' ? null : 'income')}
              >
                <Text className={filterType === 'income' ? 'text-green-700' : 'text-gray-700'}>Income</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`mr-2 py-1 px-3 rounded-full ${filterType === 'expense' ? 'bg-red-100 border border-red-500' : 'bg-gray-100'}`}
                onPress={() => setFilterType(filterType === 'expense' ? null : 'expense')}
              >
                <Text className={filterType === 'expense' ? 'text-red-700' : 'text-gray-700'}>Expense</Text>
              </TouchableOpacity>
              
              {(filterType !== null || searchText !== '') && (
                <TouchableOpacity
                  className="ml-auto bg-gray-200 py-1 px-3 rounded-full"
                  onPress={clearFilters}
                >
                  <Text className="text-gray-700">Clear All</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-semibold">
            All Transactions ({filteredTransactions.length})
          </Text>
          <TouchableOpacity
            className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center"
            onPress={() => router.push("/finances/add-expense" as any)}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text className="text-white font-medium ml-1">Add New</Text>
          </TouchableOpacity>
        </View>

        {isLoading && !refreshing ? (
          <View className="items-center justify-center py-8">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-500 mt-2">Loading transactions...</Text>
          </View>
        ) : error ? (
          <View className="items-center justify-center py-8">
            <Text className="text-red-500">{error}</Text>
            <TouchableOpacity 
              className="mt-4 bg-blue-500 px-4 py-2 rounded-lg"
              onPress={fetchTransactions}
            >
              <Text className="text-white">Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredTransactions.length === 0 ? (
          <View className="items-center justify-center py-8">
            <Text className="text-gray-500">
              {searchText || filterType ? "No matching transactions found" : "No transactions found"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredTransactions}
            renderItem={renderTransactionItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
} 