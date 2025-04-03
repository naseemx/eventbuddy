import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Download, Filter } from 'lucide-react-native';
import { getMonthlyFinancialSummary, getTransactions, Transaction } from '../../../services/transactionService';

// Helper function to group transactions by month
const groupTransactionsByMonth = (transactions: Transaction[]) => {
  const grouped: { [key: string]: { income: number; expense: number } } = {};
  
  transactions.forEach(transaction => {
    const date = new Date(transaction.transaction_date || new Date());
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!grouped[monthYear]) {
      grouped[monthYear] = { income: 0, expense: 0 };
    }
    
    if (transaction.type === 'income') {
      grouped[monthYear].income += Number(transaction.amount);
    } else {
      grouped[monthYear].expense += Number(transaction.amount);
    }
  });
  
  return Object.entries(grouped)
    .map(([monthYear, data]) => ({
      monthYear,
      income: data.income,
      expense: data.expense,
      profit: data.income - data.expense,
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

export default function ProfitLossReport() {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [currentMonthSummary, setCurrentMonthSummary] = useState<{
    income: number;
    expense: number;
    profit: number;
  }>({ income: 0, expense: 0, profit: 0 });
  const [yearToDateTotals, setYearToDateTotals] = useState<{
    income: number;
    expense: number;
    profit: number;
  }>({ income: 0, expense: 0, profit: 0 });
  const [selectedTimeframe, setSelectedTimeframe] = useState<'month' | 'year' | 'custom'>('month');
  const [error, setError] = useState<string | null>(null);
  const [filteredMonthlyData, setFilteredMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  // Apply filters when selectedTimeframe changes
  useEffect(() => {
    applyFilters();
  }, [selectedTimeframe, monthlyData]);

  const applyFilters = () => {
    if (monthlyData.length === 0) return;
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    let filtered = [...monthlyData];
    
    if (selectedTimeframe === 'month') {
      // Filter to current month only
      filtered = monthlyData.filter(item => 
        item.year === currentYear && item.month === currentMonth
      );
    } else if (selectedTimeframe === 'year') {
      // Filter to current year
      filtered = monthlyData.filter(item => item.year === currentYear);
    }
    
    setFilteredMonthlyData(filtered);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Get current month summary
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      
      const monthlySummary = await getMonthlyFinancialSummary(currentYear, currentMonth);
      setCurrentMonthSummary(monthlySummary);
      
      // Get all transactions for processing
      const allTransactions = await getTransactions();
      setTransactions(allTransactions);
      
      // Group by month
      const groupedData = groupTransactionsByMonth(allTransactions);
      setMonthlyData(groupedData);
      
      // Calculate year-to-date totals
      const ytdTransactions = allTransactions.filter(t => {
        const transDate = new Date(t.transaction_date || new Date());
        return transDate.getFullYear() === currentYear;
      });
      
      let ytdIncome = 0;
      let ytdExpense = 0;
      
      ytdTransactions.forEach(t => {
        if (t.type === 'income') {
          ytdIncome += Number(t.amount);
        } else {
          ytdExpense += Number(t.amount);
        }
      });
      
      setYearToDateTotals({
        income: ytdIncome,
        expense: ytdExpense,
        profit: ytdIncome - ytdExpense
      });
      
      setError(null);
    } catch (err) {
      console.error('Error fetching profit & loss data:', err);
      setError('Failed to load profit & loss data');
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  // Calculate highest value for chart scaling
  const highestValue = filteredMonthlyData.length > 0 
    ? filteredMonthlyData.reduce((max, item) => {
        return Math.max(max, item.income, item.expense);
      }, 0)
    : 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View 
        className="bg-white p-4 border-b border-gray-200 flex-row items-center"
        style={{ paddingTop: insets.top > 0 ? insets.top : 16 }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#000000" />
        </TouchableOpacity>
        <Text className="text-xl font-semibold ml-4">Profit & Loss Report</Text>
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
                <Text className="text-lg font-semibold">Summary</Text>
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
                <Text className="text-lg font-bold mb-4">
                  {selectedTimeframe === 'month' ? 'Current Month' : 'Year to Date'} Performance
                </Text>
                
                <View className="flex-row justify-between mb-3">
                  <Text className="text-gray-600">Total Income</Text>
                  <Text className="font-semibold text-green-600">
                    {formatCurrency(selectedTimeframe === 'month' ? currentMonthSummary.income : yearToDateTotals.income)}
                  </Text>
                </View>
                
                <View className="flex-row justify-between mb-3">
                  <Text className="text-gray-600">Total Expenses</Text>
                  <Text className="font-semibold text-red-600">
                    {formatCurrency(selectedTimeframe === 'month' ? currentMonthSummary.expense : yearToDateTotals.expense)}
                  </Text>
                </View>
                
                <View className="h-px bg-gray-200 my-2" />
                
                <View className="flex-row justify-between">
                  <Text className="text-gray-800 font-semibold">Net Profit</Text>
                  <Text 
                    className={`font-bold ${
                      (selectedTimeframe === 'month' ? currentMonthSummary.profit : yearToDateTotals.profit) >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(selectedTimeframe === 'month' ? currentMonthSummary.profit : yearToDateTotals.profit)}
                  </Text>
                </View>
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-semibold mb-4">Monthly Performance</Text>
              
              {filteredMonthlyData.length > 0 ? (
                filteredMonthlyData.map((item, index) => (
                  <View key={item.monthYear} className="bg-white rounded-lg p-4 mb-3">
                    <Text className="font-semibold mb-3">{getMonthName(item.monthYear)}</Text>
                    
                    <View className="mb-3">
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-gray-600">Income</Text>
                        <Text className="text-green-600">{formatCurrency(item.income)}</Text>
                      </View>
                      <View className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <View 
                          className="h-full bg-green-500 rounded-full" 
                          style={{ width: `${(item.income / highestValue) * 100}%` }} 
                        />
                      </View>
                    </View>
                    
                    <View className="mb-3">
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-gray-600">Expenses</Text>
                        <Text className="text-red-600">{formatCurrency(item.expense)}</Text>
                      </View>
                      <View className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <View 
                          className="h-full bg-red-500 rounded-full" 
                          style={{ width: `${(item.expense / highestValue) * 100}%` }} 
                        />
                      </View>
                    </View>
                    
                    <View className="h-px bg-gray-200 my-2" />
                    
                    <View className="flex-row justify-between">
                      <Text className="text-gray-800 font-semibold">Profit</Text>
                      <Text className={`font-bold ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(item.profit)}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View className="bg-white rounded-lg p-4 mb-3 items-center">
                  <Text className="text-gray-500">No data available for this period</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
} 