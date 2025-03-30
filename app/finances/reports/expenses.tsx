import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Download, Filter } from 'lucide-react-native';
import { getTransactionsByType, Transaction } from '../../../services/transactionService';

// Helper function to group transactions by category
const groupTransactionsByCategory = (transactions: Transaction[]) => {
  const grouped: { [key: string]: number } = {};
  
  transactions.forEach(transaction => {
    const category = transaction.category || 'Uncategorized';
    
    if (!grouped[category]) {
      grouped[category] = 0;
    }
    
    grouped[category] += Number(transaction.amount);
  });
  
  return Object.entries(grouped)
    .map(([category, amount]) => ({
      category,
      amount,
    }))
    .sort((a, b) => b.amount - a.amount); // Sort by amount in descending order
};

// Helper function to group transactions by month
const groupTransactionsByMonth = (transactions: Transaction[]) => {
  const grouped: { [key: string]: number } = {};
  
  transactions.forEach(transaction => {
    const date = new Date(transaction.transaction_date || new Date());
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!grouped[monthYear]) {
      grouped[monthYear] = 0;
    }
    
    grouped[monthYear] += Number(transaction.amount);
  });
  
  return Object.entries(grouped)
    .map(([monthYear, amount]) => ({
      monthYear,
      amount,
      // Extract year and month for sorting
      year: parseInt(monthYear.split('-')[0]),
      month: parseInt(monthYear.split('-')[1])
    }))
    .sort((a, b) => {
      // Sort by year and month in descending order (most recent first)
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
};

// Format month name
const getMonthName = (monthYear: string) => {
  const [year, month] = monthYear.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

export default function ExpenseReport() {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'month' | 'year' | 'custom'>('month');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Get only expense transactions
      const expenseTransactions = await getTransactionsByType('expense');
      setTransactions(expenseTransactions);
      
      // Group by category
      const groupedByCategory = groupTransactionsByCategory(expenseTransactions);
      setCategoryData(groupedByCategory);
      
      // Group by month
      const groupedByMonth = groupTransactionsByMonth(expenseTransactions);
      setMonthlyData(groupedByMonth);
      
      // Calculate total expenses
      const total = expenseTransactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0);
      setTotalExpenses(total);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching expense data:', err);
      setError('Failed to load expense data');
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  // Calculate highest value for chart scaling
  const highestValue = categoryData.length > 0 ? categoryData[0].amount : 0;

  // Helper function to get percentage of total
  const getPercentage = (amount: number) => {
    return totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) + '%' : '0%';
  };

  // Calculate current year's expenses
  const currentYearExpenses = (() => {
    const currentYear = new Date().getFullYear();
    return transactions
      .filter(t => {
        const transDate = new Date(t.transaction_date || new Date());
        return transDate.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);
  })();

  // Calculate current month's expenses
  const currentMonthExpenses = (() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    return transactions
      .filter(t => {
        const transDate = new Date(t.transaction_date || new Date());
        return transDate.getFullYear() === currentYear && transDate.getMonth() === currentMonth;
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);
  })();

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View 
        className="bg-white p-4 border-b border-gray-200 flex-row items-center"
        style={{ paddingTop: insets.top > 0 ? insets.top : 16 }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#000000" />
        </TouchableOpacity>
        <Text className="text-xl font-semibold ml-4">Expense Report</Text>
      </View>

      <ScrollView 
        className="flex-1 p-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {isLoading ? (
          <View className="items-center justify-center py-8">
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : error ? (
          <View className="items-center justify-center py-8">
            <Text className="text-red-500">{error}</Text>
          </View>
        ) : (
          <>
            <View className="mb-6">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-semibold">Expense Summary</Text>
                <View className="flex-row">
                  <TouchableOpacity className="mr-2 bg-white p-2 rounded-full">
                    <Calendar size={20} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity className="bg-white p-2 rounded-full">
                    <Download size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="flex-row mb-4">
                <TouchableOpacity 
                  className={`mr-2 py-2 px-4 rounded-full ${selectedTimeframe === 'month' ? 'bg-blue-500' : 'bg-white'}`}
                  onPress={() => setSelectedTimeframe('month')}
                >
                  <Text className={`${selectedTimeframe === 'month' ? 'text-white' : 'text-gray-700'}`}>This Month</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className={`mr-2 py-2 px-4 rounded-full ${selectedTimeframe === 'year' ? 'bg-blue-500' : 'bg-white'}`}
                  onPress={() => setSelectedTimeframe('year')}
                >
                  <Text className={`${selectedTimeframe === 'year' ? 'text-white' : 'text-gray-700'}`}>Year to Date</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className={`py-2 px-4 rounded-full ${selectedTimeframe === 'custom' ? 'bg-blue-500' : 'bg-white'}`}
                  onPress={() => setSelectedTimeframe('custom')}
                >
                  <Text className={`${selectedTimeframe === 'custom' ? 'text-white' : 'text-gray-700'}`}>Custom</Text>
                </TouchableOpacity>
              </View>

              <View className="bg-white rounded-lg p-4 mb-4">
                <Text className="text-lg font-bold mb-3">
                  {selectedTimeframe === 'month' ? 'Current Month' : 'Year to Date'} Expenses
                </Text>
                
                <Text className="text-2xl font-bold text-red-600 mb-2">
                  {formatCurrency(selectedTimeframe === 'month' ? currentMonthExpenses : currentYearExpenses)}
                </Text>
                
                <Text className="text-gray-500 text-sm">
                  {transactions.length} transactions
                </Text>
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-semibold mb-4">Expenses by Category</Text>
              
              {categoryData.map((item, index) => (
                <View key={item.category} className="bg-white rounded-lg p-4 mb-3">
                  <View className="flex-row justify-between mb-2">
                    <Text className="font-semibold">{item.category}</Text>
                    <Text className="font-semibold text-red-600">{formatCurrency(item.amount)}</Text>
                  </View>
                  
                  <View className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
                    <View 
                      className="h-full bg-red-500 rounded-full" 
                      style={{ width: `${(item.amount / highestValue) * 100}%` }} 
                    />
                  </View>
                  
                  <Text className="text-xs text-gray-500 text-right">
                    {getPercentage(item.amount)} of total expenses
                  </Text>
                </View>
              ))}
            </View>

            <View className="mb-6">
              <Text className="text-lg font-semibold mb-4">Monthly Expense Trend</Text>
              
              {monthlyData.slice(0, 12).map((item, index) => (
                <View key={item.monthYear} className="bg-white rounded-lg p-4 mb-3">
                  <View className="flex-row justify-between mb-2">
                    <Text className="font-semibold">{getMonthName(item.monthYear)}</Text>
                    <Text className="font-semibold text-red-600">{formatCurrency(item.amount)}</Text>
                  </View>
                  
                  <View className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <View 
                      className="h-full bg-red-500 rounded-full" 
                      style={{ width: `${(item.amount / (monthlyData[0]?.amount || 1)) * 100}%` }} 
                    />
                  </View>
                </View>
              ))}
            </View>

            <View className="mb-6">
              <Text className="text-lg font-semibold mb-4">Recent Expense Transactions</Text>
              
              {transactions.slice(0, 5).map((transaction) => (
                <TouchableOpacity 
                  key={transaction.id} 
                  className="bg-white p-4 rounded-lg mb-3 shadow-sm border border-gray-100"
                  onPress={() => router.push(`/finances/transaction-details?id=${transaction.id}` as any)}
                >
                  <View className="flex-row justify-between">
                    <View>
                      <Text className="font-semibold text-gray-900">
                        {transaction.description || 'No description'}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {transaction.transaction_date
                          ? new Date(transaction.transaction_date).toLocaleDateString()
                          : 'No date'} • {transaction.category || 'Uncategorized'}
                      </Text>
                    </View>
                    <Text className="font-bold text-red-600">
                      -{formatCurrency(Number(transaction.amount))}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
} 