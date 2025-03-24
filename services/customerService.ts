import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://wncwlshtddeelkutqyrq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduY3dsc2h0ZGRlZWxrdXRxeXJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NDQ3NTgsImV4cCI6MjA1ODIyMDc1OH0.BbT5O4rK8ShDwcpfLtqcm71ieCHwiBF6In1OTyvu8ns';

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Customer interface
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  activeRentals?: number;
  totalSpent?: number;
  created_at?: string;
  updated_at?: string;
}

// Create a new customer
export async function createCustomer(customerData: Omit<Customer, 'id'>): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .insert(customerData)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
  
  return data;
}

// Get all customers
export async function getAllCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error getting customers:', error);
    throw error;
  }
  
  // Get active rentals count for each customer
  const enrichedData = await Promise.all(
    data.map(async (customer) => {
      // Get active rentals count
      const { count: activeRentals, error: rentalsError } = await supabase
        .from('rentals')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', customer.id)
        .eq('status', 'active');
      
      // Get total spent
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('reference_id', customer.id)
        .eq('reference_type', 'customer')
        .eq('type', 'income');
      
      const totalSpent = transactions?.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0) || 0;
      
      return {
        ...customer,
        activeRentals: activeRentals || 0,
        totalSpent: totalSpent || 0
      };
    })
  );
  
  return enrichedData;
}

// Get a single customer by ID
export async function getCustomerById(id: string): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error getting customer with ID ${id}:`, error);
    throw error;
  }

  // Get active rentals
  const { count: activeRentals, error: rentalsError } = await supabase
    .from('rentals')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', id)
    .eq('status', 'active');
  
  // Get total spent
  const { data: transactions, error: transactionsError } = await supabase
    .from('transactions')
    .select('amount')
    .eq('reference_id', id)
    .eq('reference_type', 'customer')
    .eq('type', 'income');
  
  const totalSpent = transactions?.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0) || 0;
  
  return {
    ...data,
    activeRentals: activeRentals || 0,
    totalSpent: totalSpent || 0
  };
}

// Update an existing customer
export async function updateCustomer(id: string, customerData: Partial<Customer>): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .update(customerData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating customer with ID ${id}:`, error);
    throw error;
  }
  
  return data;
}

// Check if customer has related records
export async function customerHasRelatedRecords(id: string): Promise<{hasRecords: boolean, message: string}> {
  if (!id) throw new Error("Customer ID is required");
  
  // Check rentals
  const { count: rentalCount, error: rentalError } = await supabase
    .from('rentals')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', id);
    
  if (rentalError) {
    console.error(`Error checking rentals for customer ${id}:`, rentalError);
  }
  
  // Check transactions
  const { count: transactionCount, error: transactionError } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('reference_id', id)
    .eq('reference_type', 'customer');
    
  if (transactionError) {
    console.error(`Error checking transactions for customer ${id}:`, transactionError);
  }
  
  const hasRelatedRecords = (rentalCount || 0) > 0 || (transactionCount || 0) > 0;
  
  return {
    hasRecords: hasRelatedRecords,
    message: hasRelatedRecords ? 
      `This customer has ${rentalCount || 0} rentals and ${transactionCount || 0} transactions. Delete these first.` : 
      ""
  };
}

// Delete a customer
export async function deleteCustomer(id: string): Promise<void> {
  if (!id) throw new Error("Customer ID is required");
  
  console.log(`Deleting customer with ID: ${id}`);
  
  // Check for related records first
  const { hasRecords, message } = await customerHasRelatedRecords(id);
  if (hasRecords) {
    console.error(`Cannot delete customer ${id}: ${message}`);
    throw new Error(message);
  }
  
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Delete error for customer ${id}:`, error);
    throw error;
  }
  
  console.log(`Customer ${id} deleted successfully`);
}

// Get customer rental history
export async function getCustomerRentalHistory(customerId: string): Promise<any[]> {
  try {
    // Get all orders (both rentals and sales) for this customer from orders table
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        customer_id,
        customer_name,
        order_type,
        status,
        payment_status,
        total_amount,
        deposit_amount,
        items,
        start_date,
        end_date,
        return_date,
        invoice_id,
        created_at,
        updated_at
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(`Error getting order history for customer ${customerId}:`, error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Process the order data into a format suitable for the UI
    const processedOrders = data.map(order => {
      let items = [];
      let itemDetails = [];
      try {
        // Parse the items JSON string
        const parsedItems = JSON.parse(order.items);
        items = parsedItems.map((item: any) => item.product_name);
        itemDetails = parsedItems.map((item: any) => ({
          id: item.product_id,
          name: item.product_name,
          quantity: item.quantity,
          price: item.unit_price,
          deposit: item.deposit || 0,
          rental_start_date: item.rental_start_date,
          rental_end_date: item.rental_end_date
        }));
      } catch (e) {
        console.error('Error parsing order items:', e);
      }
      
      // Calculate rental duration in days
      let rentalDuration = 0;
      if (order.order_type === 'rental' && order.start_date && order.end_date) {
        const startDate = new Date(order.start_date);
        const endDate = new Date(order.end_date);
        const timeDiff = Math.abs(endDate.getTime() - startDate.getTime());
        rentalDuration = Math.ceil(timeDiff / (1000 * 3600 * 24));
      }
      
      return {
        id: order.id,
        type: order.order_type,
        startDate: order.start_date,
        endDate: order.end_date,
        returnDate: order.return_date,
        totalAmount: order.total_amount,
        depositAmount: order.deposit_amount || 0,
        status: order.status,
        paymentStatus: order.payment_status || 'Unpaid',
        invoiceId: order.invoice_id,
        items: items,
        itemDetails: itemDetails,
        rentalDuration: rentalDuration,
        product: { name: items[0] + (items.length > 1 ? ` + ${items.length - 1} more` : '') },
        date: new Date(order.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        created_at: order.created_at,
        updated_at: order.updated_at
      };
    });
    
    return processedOrders;
  } catch (error) {
    console.error(`Error getting customer order history:`, error);
    return [];
  }
} 