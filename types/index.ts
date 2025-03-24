// Common interfaces for the application

// Rental/Order data structure
export interface Rental {
  id: string;
  customer_id: string;
  customer_name: string;
  items: string[];
  return_date: string;
  days_remaining: number;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
}

// Financial transaction structure
export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  transaction_date: string;
  category: string;
  payment_method?: string;
  reference_id?: string;
  reference_type?: 'order' | 'invoice' | 'refund' | 'expense' | 'salary';
  created_at: string;
  updated_at?: string;
}

// Event structure
export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  customer_name: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  created_at: string;
}

// Customer structure
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
}

// Notification structure
export interface Notification {
  id: string;
  type: 'order' | 'event' | 'return' | 'payment';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  reference_id?: string;
}

// Product structure
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
  image_url?: string;
  created_at: string;
}

// Employee structure
export interface Employee {
  id: string;
  name: string;
  position: string;
  email: string;
  phone: string;
  join_date: string;
  created_at: string;
}

// Invoice structure
export interface Invoice {
  id: string;
  order_id: string;
  customer_id?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  items: string; // JSON string of invoice items
  subtotal: number;
  tax_rate?: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount: number;
  status: 'Paid' | 'Unpaid' | 'Partial' | 'Cancelled' | 'paid' | 'pending' | 'overdue';
  notes?: string;
  created_at: string;
  updated_at?: string;
  // For backward compatibility with existing code
  amount?: number;
}