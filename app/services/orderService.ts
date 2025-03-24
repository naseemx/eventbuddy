import { supabase } from '../../lib/supabase';

// Define table names
const ORDERS_TABLE = 'orders';
const INVOICES_TABLE = 'invoices';

// Define Order type
export interface Order {
  id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  order_type: 'rental' | 'sale';
  status: 'Active' | 'Completed' | 'Returned' | 'Overdue' | 'Cancelled';
  start_date?: string;
  end_date?: string;
  return_date?: string;
  items: string; // JSON string of order items
  total_amount: number;
  deposit_amount?: number;
  notes?: string;
  invoice_id?: string;
  created_at: string;
  updated_at?: string;
}

// Define OrderItem type
export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  deposit?: number;
}

// Define Invoice type
export interface Invoice {
  id: string;
  order_id: string;
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
  total_amount: number;
  status: 'Paid' | 'Unpaid' | 'Partial' | 'Cancelled';
  notes?: string;
  created_at: string;
  updated_at?: string;
}

// Get all orders
export const getOrders = async (): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from(ORDERS_TABLE)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

// Get order by ID
export const getOrderById = async (id: string): Promise<Order | null> => {
  try {
    const { data, error } = await supabase
      .from(ORDERS_TABLE)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error(`Error fetching order with ID ${id}:`, error);
    return null;
  }
};

// Create a new order
export const createOrder = async (orderData: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'invoice_id'>): Promise<Order | null> => {
  try {
    console.log('Creating order:', orderData);
    
    // Insert the order
    const { data: orderResult, error: orderError } = await supabase
      .from(ORDERS_TABLE)
      .insert([orderData])
      .select()
      .single();
    
    if (orderError) throw orderError;
    
    if (!orderResult) {
      throw new Error('Failed to create order - no data returned');
    }
    
    // Generate invoice for the order
    await generateInvoice(orderResult);
    
    return orderResult;
  } catch (error) {
    console.error('Error creating order:', error);
    return null;
  }
};

// Update an order
export const updateOrder = async (id: string, updates: Partial<Order>): Promise<Order | null> => {
  try {
    const { data, error } = await supabase
      .from(ORDERS_TABLE)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error(`Error updating order with ID ${id}:`, error);
    return null;
  }
};

// Mark rental as returned
export const markRentalAsReturned = async (id: string, returnDate: string): Promise<Order | null> => {
  try {
    const { data, error } = await supabase
      .from(ORDERS_TABLE)
      .update({
        status: 'Returned',
        return_date: returnDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error(`Error marking rental as returned with ID ${id}:`, error);
    return null;
  }
};

// Cancel an order
export const cancelOrder = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from(ORDERS_TABLE)
      .update({
        status: 'Cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error(`Error cancelling order with ID ${id}:`, error);
    return false;
  }
};

// Generate invoice number
const generateInvoiceNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().substring(2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `INV-${year}${month}-${random}`;
};

// Generate invoice for an order
export const generateInvoice = async (order: Order): Promise<Invoice | null> => {
  try {
    // Parse order items
    const orderItems = JSON.parse(order.items) as OrderItem[];
    
    // Create invoice data
    const invoiceData = {
      order_id: order.id,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone,
      invoice_number: generateInvoiceNumber(),
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: order.order_type === 'rental' ? order.end_date : new Date().toISOString().split('T')[0],
      items: order.items,
      subtotal: order.total_amount,
      tax_rate: 0, // Add tax rate if needed
      tax_amount: 0, // Calculate tax amount if needed
      total_amount: order.total_amount,
      status: 'Unpaid' as 'Unpaid', // Default status
      notes: `Auto-generated invoice for ${order.order_type} order`
    };
    
    // Insert the invoice
    const { data: invoiceResult, error: invoiceError } = await supabase
      .from(INVOICES_TABLE)
      .insert([invoiceData])
      .select()
      .single();
    
    if (invoiceError) throw invoiceError;
    
    if (!invoiceResult) {
      throw new Error('Failed to create invoice - no data returned');
    }
    
    // Update the order with the invoice ID
    await supabase
      .from(ORDERS_TABLE)
      .update({ invoice_id: invoiceResult.id })
      .eq('id', order.id);
    
    return invoiceResult;
  } catch (error) {
    console.error('Error generating invoice:', error);
    return null;
  }
};

// Get all invoices
export const getInvoices = async (): Promise<Invoice[]> => {
  try {
    const { data, error } = await supabase
      .from(INVOICES_TABLE)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Ensure consistent status capitalization
    const formattedInvoices = data?.map(invoice => {
      // Normalize status - ensure first letter is capitalized
      let normalizedStatus = invoice.status;
      if (typeof normalizedStatus === 'string') {
        // Convert to lowercase first, then capitalize first letter
        normalizedStatus = normalizedStatus.toLowerCase();
        normalizedStatus = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
        
        // Ensure status is one of the valid values
        if (!['Paid', 'Unpaid', 'Partial', 'Cancelled'].includes(normalizedStatus)) {
          // Default to 'Unpaid' if the status is not recognized
          normalizedStatus = 'Unpaid';
        }
      }
      
      return {
        ...invoice,
        status: normalizedStatus
      };
    }) || [];
    
    return formattedInvoices;
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }
};

// Get invoice by ID
export const getInvoiceById = async (id: string): Promise<Invoice | null> => {
  try {
    const { data, error } = await supabase
      .from(INVOICES_TABLE)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    if (data) {
      // Normalize status - ensure first letter is capitalized
      let normalizedStatus = data.status;
      if (typeof normalizedStatus === 'string') {
        // Convert to lowercase first, then capitalize first letter
        normalizedStatus = normalizedStatus.toLowerCase();
        normalizedStatus = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
        
        // Ensure status is one of the valid values
        if (!['Paid', 'Unpaid', 'Partial', 'Cancelled'].includes(normalizedStatus)) {
          // Default to 'Unpaid' if the status is not recognized
          normalizedStatus = 'Unpaid';
        }
        
        data.status = normalizedStatus;
      }
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching invoice with ID ${id}:`, error);
    return null;
  }
}; 