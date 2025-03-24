import { supabase } from '../lib/supabase';
import { createOrderTransaction, createTransaction } from './transactionService';
import { updateProduct } from './productService';

// Define table names
const ORDERS_TABLE = 'orders';
const INVOICES_TABLE = 'invoices';

// Define Order type
export interface Order {
  id: string;
  customer_id?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  order_type: 'rental' | 'sale';
  status: 'Active' | 'Completed' | 'Returned' | 'Overdue' | 'Cancelled';
  payment_status?: 'Paid' | 'Unpaid' | 'Partial' | 'Cancelled';
  start_date?: string;
  end_date?: string;
  return_date?: string;
  items: string; // JSON string of order items
  total_amount: number;
  deposit_amount?: number;
  notes?: string;
  invoice_id?: string;
  discount_type?: 'none' | 'percentage' | 'amount';
  discount_percentage?: number;
  discount_amount?: number;
  discount_value?: number; // The actual value of the discount applied
  subtotal?: number; // Total before discount
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
  status: 'Paid' | 'Unpaid';
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
    
    // Store payment status and then remove it from the initial insertion to prevent any 
    // triggers or relations from trying to create a transaction too early
    const paymentStatus = orderData.payment_status;
    
    // Create a copy without modifying the original
    const orderDataForInsert = {
      ...orderData
    };
    
    // Insert the order
    const { data: orderResult, error: orderError } = await supabase
      .from(ORDERS_TABLE)
      .insert([orderDataForInsert])
      .select()
      .single();
    
    if (orderError) throw orderError;
    
    if (!orderResult) {
      throw new Error('Failed to create order - no data returned');
    }
    
    // Insert order items into the order_items table
    try {
      const orderItems = JSON.parse(orderResult.items) as OrderItem[];
      
      // Prepare the order items data with rental dates
      const orderItemsData = orderItems.map(item => ({
        order_id: orderResult.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.unit_price * item.quantity,
        rental_start_date: orderResult.order_type === 'rental' ? orderResult.start_date : null,
        rental_end_date: orderResult.order_type === 'rental' ? orderResult.end_date : null
      }));
      
      // Insert order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);
        
      if (itemsError) {
        console.error('Error inserting order items:', itemsError);
        // Continue even if there's an error with items
      }
    } catch (itemsError) {
      console.error('Error processing order items:', itemsError);
      // Continue even if there's an error with items
    }
    
    // Generate invoice for the order
    const invoice = await generateInvoice(orderResult);
    
    // If payment status is Paid, create a transaction record
    if (paymentStatus === 'Paid') {
      try {
        await createOrderTransaction(
          orderResult.id,
          orderResult.total_amount,
          orderResult.order_type,
          'cash' // Default payment method
        );
        
        console.log(`Created transaction record for new order ${orderResult.id}`);
      } catch (transactionError) {
        console.error('Error creating transaction record:', transactionError);
        // Continue even if transaction creation fails
      }
    }
    
    // If this is a rental, update product status to Rented
    if (orderResult.order_type === 'rental') {
      try {
        const orderItems = JSON.parse(orderResult.items) as OrderItem[];
        
        // Update each product's status using the new field names
        for (const item of orderItems) {
          await updateProduct(item.product_id, {
            status: 'Rented',
            rented_to_customer_id: orderData.customer_id,
            rental_start_date: orderData.start_date,
            rental_end_date: orderData.end_date
          });
        }
      } catch (productError) {
        console.error('Error updating product status:', productError);
        // Continue even if product update fails
      }
    } else if (orderResult.order_type === 'sale') {
      // If this is a sale, update product status to Sold
      try {
        const orderItems = JSON.parse(orderResult.items) as OrderItem[];
        
        // Update each product's status to Sold
        for (const item of orderItems) {
          await updateProduct(item.product_id, {
            status: 'Sold',
            customer_id: orderData.customer_id,
            customer_name: orderData.customer_name,
            customer_phone: orderData.customer_phone
          });
        }
      } catch (productError) {
        console.error('Error updating product status for sale:', productError);
        // Continue even if product update fails
      }
    }
    
    return orderResult;
  } catch (error) {
    console.error('Error creating order:', error);
    return null;
  }
};

// Update an order
export const updateOrder = async (id: string, updates: Partial<Order>): Promise<Order | null> => {
  try {
    console.log(`Updating order ${id} with:`, updates);
    
    // First get the current order to understand what's changing
    const { data: currentOrder, error: fetchError } = await supabase
      .from(ORDERS_TABLE)
      .select('*')
      .eq('id', id)
      .single();
      
    if (fetchError) {
      console.error(`Error fetching current order info for ${id}:`, fetchError);
      throw fetchError;
    }
    
    // Update the order
    const { data, error } = await supabase
      .from(ORDERS_TABLE)
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // If payment status is being updated to 'Paid', create a transaction record
    if (updates.payment_status === 'Paid' && currentOrder.payment_status !== 'Paid') {
      try {
        await createOrderTransaction(
          currentOrder.id,
          currentOrder.total_amount, 
          currentOrder.order_type,
          'cash' // Default payment method
        );
        
        console.log(`Created transaction record for order ${id}`);
        
        // Also update the invoice status to 'Paid' if there's an invoice associated with this order
        if (currentOrder.invoice_id) {
          await updateInvoiceStatus(currentOrder.invoice_id, 'Paid');
          console.log(`Updated invoice ${currentOrder.invoice_id} status to Paid`);
        }
      } catch (transactionError) {
        console.error('Error creating transaction record:', transactionError);
        // Continue even if transaction creation fails
      }
    }
    
    // If this is a returned rental being marked as paid, ensure product status is 'Available'
    if (updates.payment_status === 'Paid' && 
        currentOrder.order_type === 'rental' && 
        currentOrder.status === 'Returned') {
      try {
        const orderItems = JSON.parse(currentOrder.items) as OrderItem[];
        
        // Update products to Available status if they were part of a returned rental
        for (const item of orderItems) {
          await updateProduct(item.product_id, {
            status: 'Available'
          });
          console.log(`Updated product ${item.product_id} to Available status after payment`);
        }
      } catch (productError) {
        console.error('Error updating product status after payment:', productError);
      }
    }
    
    return data;
  } catch (error) {
    console.error(`Error updating order with ID ${id}:`, error);
    return null;
  }
};

// Mark rental as returned
export const markRentalAsReturned = async (id: string, returnDate: string): Promise<Order | null> => {
  try {
    console.log(`Starting to mark rental ${id} as returned on ${returnDate}`);
    
    // First, update the order status
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

    if (error) {
      console.error(`Error updating order status: ${error.message}`);
      throw error;
    }
    
    console.log(`Successfully updated order ${id} status to Returned`);
    
    // Get all product IDs from order_items for this order
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id')
      .eq('order_id', id);
      
    if (itemsError) {
      console.error(`Error fetching order items: ${itemsError.message}`);
    } else if (!orderItems || orderItems.length === 0) {
      console.warn(`No order items found for order ${id}`);
    } else {
      // Update all products to Available status
      const productIds = orderItems.map(item => item.product_id);
      console.log(`Found ${productIds.length} products to update: ${JSON.stringify(productIds)}`);
      
      // Update using individual calls to ensure success and use the productService
      for (const productId of productIds) {
        const success = await updateProduct(productId, {
          status: 'Available'
        });
        
        if (success) {
          console.log(`Successfully updated product ${productId} to Available status using productService`);
        } else {
          console.error(`Failed to update product ${productId} using productService`);
        }
      }
    }
    
    return data;
  } catch (error) {
    console.error(`Error marking rental as returned with ID ${id}:`, error);
    return null;
  }
};

// Cancel an order
export const cancelOrder = async (id: string): Promise<boolean> => {
  try {
    // First get the order details to determine if it's a rental or sale
    const { data: order, error: fetchError } = await supabase
      .from(ORDERS_TABLE)
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error(`Error fetching order ${id} for cancellation:`, fetchError);
      throw fetchError;
    }
    
    // Update the order status to Cancelled
    const { error } = await supabase
      .from(ORDERS_TABLE)
      .update({
        status: 'Cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
    
    console.log(`Order ${id} has been cancelled`);
    
    // For both rental and sale orders, update the product status to Available
    try {
      // Get all product IDs from order_items for this order
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('product_id')
        .eq('order_id', id);
        
      if (itemsError) {
        console.error(`Error fetching order items for cancellation: ${itemsError.message}`);
      } else if (orderItems && orderItems.length > 0) {
        const productIds = orderItems.map(item => item.product_id);
        console.log(`Found ${productIds.length} products to update status to Available`);
        
        // Update each product's status to Available
        for (const productId of productIds) {
          const success = await updateProduct(productId, {
            status: 'Available'
          });
          
          if (success) {
            console.log(`Successfully updated product ${productId} status to Available after order cancellation`);
          } else {
            console.error(`Failed to update product ${productId} status after order cancellation`);
          }
        }
      }
    } catch (productError) {
      console.error('Error updating product status after order cancellation:', productError);
      // Continue even if product update fails
    }
    
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
    
    // Get status with proper formatting
    let invoiceStatus: 'Paid' | 'Unpaid' | 'Partial' | 'Cancelled' = 'Unpaid';
    if (order.payment_status) {
      // Ensure the first letter is capitalized
      invoiceStatus = order.payment_status as 'Paid' | 'Unpaid' | 'Partial' | 'Cancelled';
    }
    
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
      status: invoiceStatus,
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

// Update invoice status
export const updateInvoiceStatus = async (id: string, status: 'Paid' | 'Unpaid'): Promise<boolean> => {
  try {
    // First get the invoice to check if it's linked to an order
    const { data: invoice, error: fetchError } = await supabase
      .from(INVOICES_TABLE)
      .select('order_id')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Update invoice status
    const { error } = await supabase
      .from(INVOICES_TABLE)
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
    
    // If invoice is linked to an order, update order payment status too
    if (invoice && invoice.order_id) {
      const { error: orderError } = await supabase
        .from(ORDERS_TABLE)
        .update({
          payment_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoice.order_id);
      
      if (orderError) {
        console.error(`Error updating order payment status for ID ${invoice.order_id}:`, orderError);
        // Continue even if updating order fails
      } else {
        console.log(`Successfully updated order ${invoice.order_id} payment status to ${status}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Error updating invoice status for ID ${id}:`, error);
    return false;
  }
};

// Sync all invoice statuses with their corresponding orders
export const syncInvoicesWithOrders = async (): Promise<boolean> => {
  try {
    // Get all orders with invoices
    const { data: orders, error: ordersError } = await supabase
      .from(ORDERS_TABLE)
      .select('id, payment_status, invoice_id')
      .not('invoice_id', 'is', null);
    
    if (ordersError) throw ordersError;
    
    if (!orders || orders.length === 0) {
      console.log('No orders with invoices found to sync');
      return true;
    }
    
    console.log(`Found ${orders.length} orders with invoices to sync`);
    
    // Update each invoice to match its order's payment status
    for (const order of orders) {
      if (order.invoice_id && order.payment_status) {
        // Map payment_status to simplified invoice status (Paid or Unpaid)
        let invoiceStatus: 'Paid' | 'Unpaid' = 'Unpaid';
        if (order.payment_status === 'Paid') {
          invoiceStatus = 'Paid';
        }
        
        await updateInvoiceStatus(order.invoice_id, invoiceStatus);
        console.log(`Synced invoice ${order.invoice_id} status to ${invoiceStatus}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error syncing invoice statuses with orders:', error);
    return false;
  }
};

// Update an invoice
export const updateInvoice = async (id: string, updates: Partial<Invoice>): Promise<Invoice | null> => {
  try {
    // Make sure we don't try to update order_id or created_at fields
    const safeUpdates = { ...updates };
    delete safeUpdates.order_id;
    delete safeUpdates.created_at;
    
    // Add updated_at timestamp
    safeUpdates.updated_at = new Date().toISOString();
    
    // Ensure status has proper capitalization if provided
    if (safeUpdates.status) {
      // Convert status to a standardized format
      const statusLower = String(safeUpdates.status).toLowerCase();
      
      // Map to valid status value
      let normalizedStatus: 'Paid' | 'Unpaid';
      
      if (statusLower === 'paid') {
        normalizedStatus = 'Paid';
      } else {
        // Default to Unpaid for any other value
        normalizedStatus = 'Unpaid';
      }
      
      safeUpdates.status = normalizedStatus;
    }

    // First, get the current invoice to check if linked to an order
    const { data: currentInvoice, error: fetchError } = await supabase
      .from(INVOICES_TABLE)
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Update the invoice
    const { data, error } = await supabase
      .from(INVOICES_TABLE)
      .update(safeUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;

    // If the invoice is linked to an order, update the order details accordingly
    if (data && data.order_id) {
      try {
        const orderUpdates: any = {};
        
        // Update order payment status if invoice status changed
        if (safeUpdates.status) {
          orderUpdates.payment_status = safeUpdates.status as 'Paid' | 'Unpaid' | 'Partial' | 'Cancelled';
        }
        
        // Update order total amount if invoice amount changed
        if (safeUpdates.total_amount) {
          orderUpdates.total_amount = safeUpdates.total_amount;
        }
        
        // Update customer details if they changed
        if (safeUpdates.customer_name) {
          orderUpdates.customer_name = safeUpdates.customer_name;
        }
        
        if (safeUpdates.customer_email) {
          orderUpdates.customer_email = safeUpdates.customer_email;
        }
        
        if (safeUpdates.customer_phone) {
          orderUpdates.customer_phone = safeUpdates.customer_phone;
        }
        
        // Update order items if invoice items changed
        if (safeUpdates.items) {
          orderUpdates.items = safeUpdates.items;
        }
        
        // Only update if there are changes to make
        if (Object.keys(orderUpdates).length > 0) {
          orderUpdates.updated_at = new Date().toISOString();
          
          const { error: orderError } = await supabase
            .from(ORDERS_TABLE)
            .update(orderUpdates)
            .eq('id', data.order_id);
          
          if (orderError) {
            console.error(`Failed to update order details: ${orderError}`);
          } else {
            console.log(`Successfully updated order ${data.order_id} with invoice changes`);
          }
        }
      } catch (orderError) {
        console.error(`Failed to update order details: ${orderError}`);
        // Continue even if order update fails
      }
    }
    
    return data;
  } catch (error) {
    console.error(`Error updating invoice with ID ${id}:`, error);
    return null;
  }
}; 