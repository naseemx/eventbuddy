import { supabase } from '../lib/supabase';

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  description?: string;
  reference_id?: string;
  reference_type?: 'order' | 'invoice' | 'refund' | 'expense' | 'salary';
  payment_method?: string;
  transaction_date?: string;
  created_at?: string;
  updated_at?: string;
}

// Table name in Supabase
const TABLE_NAME = 'transactions';

// Get all transactions
export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('transaction_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getTransactions:', error);
    return [];
  }
};

// Get transaction by ID
export const getTransactionById = async (id: string): Promise<Transaction | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error(`Error fetching transaction with ID ${id}:`, error);
    return null;
  }
};

// Get transactions by type (income/expense)
export const getTransactionsByType = async (type: 'income' | 'expense'): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('type', type)
      .order('transaction_date', { ascending: false });
    
    if (error) {
      console.error(`Error fetching ${type} transactions:`, error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error(`Error in getTransactionsByType(${type}):`, error);
    return [];
  }
};

// Create a new transaction
export const createTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction | null> => {
  try {
    // Debug incoming transaction object
    console.log('Incoming transaction data:', JSON.stringify(transaction, null, 2));
    
    // Extract only the fields that actually exist in the database schema
    const {
      amount,
      type,
      category,
      description,
      reference_id,
      reference_type,
      payment_method,
      transaction_date
    } = transaction;
    
    // Clean transaction data for insertion
    const transactionData = {
      amount,
      type,
      category,
      description,
      reference_id,
      reference_type,
      payment_method,
      transaction_date: transaction_date || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Check if anyone is adding order_id somehow
    const anyIncoming = transaction as any;
    if (anyIncoming.order_id) {
      console.error('Found unexpected order_id in incoming transaction data:', anyIncoming.order_id);
    }
    
    // Make sure no unexpected fields are in the final data
    const anyData = transactionData as any;
    if (anyData.order_id) {
      console.error('Found unexpected order_id in final transaction data:', anyData.order_id);
      // Remove it to prevent the error
      delete anyData.order_id;
    }
    
    console.log('Final transaction data for insert:', JSON.stringify(transactionData, null, 2));
    
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([transactionData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in createTransaction:', error);
    return null;
  }
};

// Create a transaction for a paid order
export const createOrderTransaction = async (
  orderId: string, 
  amount: number, 
  orderType: 'rental' | 'sale',
  paymentMethod: string = 'cash'
): Promise<Transaction | null> => {
  try {
    // Create transaction object with only the fields that exist in the database
    const transactionData = {
      amount,
      type: 'income' as const,
      category: orderType === 'rental' ? 'rental_payment' : 'sales_revenue',
      description: `Payment received for ${orderType} order #${orderId.substring(0, 8)}`,
      reference_id: orderId,
      reference_type: 'order' as const,
      payment_method: paymentMethod,
      transaction_date: new Date().toISOString()
    };
    
    // Debug log
    console.log('Transaction data before insert:', JSON.stringify(transactionData, null, 2));
    
    // Check if anyone is adding order_id somehow
    const anyData = transactionData as any;
    if (anyData.order_id) {
      console.error('Found unexpected order_id in transaction data:', anyData.order_id);
      // Remove it to prevent the error
      delete anyData.order_id;
    }
    
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([transactionData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating order transaction:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating order transaction:', error);
    return null;
  }
};

// Create an expense transaction
export const createExpenseTransaction = async (
  amount: number,
  category: string,
  description: string,
  referenceId?: string,
  paymentMethod: string = 'cash'
): Promise<Transaction | null> => {
  try {
    // Create transaction object with only the fields that exist in the database
    const transactionData = {
      amount,
      type: 'expense' as const,
      category,
      description,
      reference_id: referenceId,
      reference_type: referenceId ? 'expense' as const : undefined,
      payment_method: paymentMethod,
      transaction_date: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([transactionData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating expense transaction:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating expense transaction:', error);
    return null;
  }
};

// Update a transaction
export const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<Transaction | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error(`Error updating transaction with ID ${id}:`, error);
    return null;
  }
};

// Delete a transaction
export const deleteTransaction = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error(`Error deleting transaction with ID ${id}:`, error);
    return false;
  }
};

// Get transactions for a specific order
export const getTransactionsForOrder = async (orderId: string): Promise<Transaction[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('reference_id', orderId)
      .eq('reference_type', 'order')
      .order('transaction_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching transactions for order:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getTransactionsForOrder:', error);
    return [];
  }
};

// Get monthly income/expense summary (for reports/dashboard)
export const getMonthlyFinancialSummary = async (
  year: number = new Date().getFullYear(), 
  month: number = new Date().getMonth() + 1
): Promise<{ income: number, expense: number, profit: number }> => {
  try {
    // Start and end of month
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
    
    // Get all transactions for the month
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('amount, type')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate);
    
    if (error) {
      console.error('Error fetching monthly summary:', error);
      throw error;
    }
    
    // Calculate totals
    let income = 0;
    let expense = 0;
    
    if (data && data.length > 0) {
      data.forEach(transaction => {
        if (transaction.type === 'income') {
          income += parseFloat(transaction.amount);
        } else {
          expense += parseFloat(transaction.amount);
        }
      });
    }
    
    return {
      income,
      expense,
      profit: income - expense
    };
  } catch (error) {
    console.error('Error in getMonthlyFinancialSummary:', error);
    return { income: 0, expense: 0, profit: 0 };
  }
};