import { supabase } from '../lib/supabase';

// Define table name
const TABLE_NAME = 'products';

// Define Product type
export interface Product {
  id: string;
  name: string;
  category: string;
  description?: string;
  product_type: 'rental' | 'sale' | 'both';
  status: 'Available' | 'Rented' | 'Sold' | 'Maintenance' | 'Unavailable';
  rental_price: number;
  selling_price: number;
  primary_image_url?: string; // Primary image URL (text)
  image_urls?: any; // Array of image URLs (jsonb)
  specifications?: string; // JSON string of specs
  purchase_date?: string;
  purchase_price?: number;
  customer_id?: string; // ID of customer who rented/bought the product
  customer_name?: string; // Name of customer who rented/bought the product
  customer_email?: string; // Email of customer who rented/bought the product
  customer_phone?: string; // Phone of customer who rented/bought the product
  transaction_date?: string; // Date when the product was rented/sold
  return_date?: string; // Expected return date for rentals
  created_at: string;
  updated_at?: string;
  rented_to_customer_id?: string;
  rental_start_date?: string;
  rental_end_date?: string;
}

// Legacy product data with images field for form compatibility
interface LegacyProductData extends Partial<Product> {
  images?: string; // JSON string of base64 images (not in DB schema)
  image_url?: string; // Legacy field not in DB schema
}

// Get all products with custom sorting by status
export const getProducts = async (includeUnavailable: boolean = false): Promise<Product[]> => {
  try {
    let query = supabase
      .from(TABLE_NAME)
      .select('*');
    
    // Filter out unavailable products by default
    if (!includeUnavailable) {
      query = query.neq('status', 'Unavailable');
    }
    
    // Execute the query without ordering in the database
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Define status priority order
    const statusOrder: Record<string, number> = {
      'Available': 1,
      'Rented': 2,
      'Sold': 3,
      'Maintenance': 4,
      'Unavailable': 5
    };
    
    // Sort products by status priority first, then by name
    const sortedData = [...(data || [])].sort((a, b) => {
      // Get the priority for each status, defaulting to a high number if not found
      const aPriority = statusOrder[a.status] || 999;
      const bPriority = statusOrder[b.status] || 999;
      
      // If priorities differ, sort by priority
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // If priorities are the same, sort alphabetically by name
      return a.name.localeCompare(b.name);
    });
    
    return sortedData;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

// Get product by ID
export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error(`Error fetching product with ID ${id}:`, error);
    return null;
  }
};

// Create a new product
export const createProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'> | LegacyProductData): Promise<Product | null> => {
  try {
    console.log('Creating product with name:', product.name);
    
    // Handle images data conversion if present
    if ('images' in product && product.images) {
      try {
        // Parse the images JSON string to get base64 data
        const parsedImages = JSON.parse(product.images);
        if (Array.isArray(parsedImages) && parsedImages.length > 0) {
          // Set primary_image_url to the first image
          product.primary_image_url = `data:image/jpeg;base64,${parsedImages[0].base64}`;
          
          // Create image_urls array if multiple images
          if (parsedImages.length > 0) {
            product.image_urls = parsedImages.map(img => 
              `data:image/jpeg;base64,${img.base64}`
            );
          }
        }
        
        // Remove the 'images' property since it doesn't exist in the database
        delete product.images;
      } catch (err) {
        console.error('Error processing images data:', err);
        delete product.images;
      }
    }
    
    // Handle legacy image_url field
    if ('image_url' in product) {
      // Move image_url value to primary_image_url
      if (product.image_url) {
        product.primary_image_url = product.image_url;
      }
      
      // Remove non-existent column
      delete product.image_url;
    }
    
    // Set a timeout for the operation
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout after 20 seconds')), 20000)
    );
    
    // Run the actual database operation
    const dbOperation = supabase
      .from(TABLE_NAME)
      .insert([product])
      .select()
      .single();
    
    // Race between timeout and actual operation
    const result = await Promise.race([dbOperation, timeoutPromise]) as any;
    
    if (result.error) {
      console.error('Supabase error creating product:', result.error);
      throw result.error;
    }
    
    return result.data;
  } catch (error) {
    console.error('Error creating product:', error);
    return null;
  }
};

// Update a single product
export const updateProduct = async (id: string, data: Partial<Product> | LegacyProductData) => {
  try {
    console.log(`Updating product ${id} with data:`, data);
    
    // Handle images data conversion if present
    if ('images' in data && data.images) {
      // If the legacy 'images' field is used (not in database), 
      // convert to primary_image_url to maintain compatibility
      try {
        // Parse the images JSON string to get base64 data
        const parsedImages = JSON.parse(data.images);
        if (Array.isArray(parsedImages) && parsedImages.length > 0) {
          // Set primary_image_url to the first image
          data.primary_image_url = `data:image/jpeg;base64,${parsedImages[0].base64}`;
          
          // Create image_urls array if multiple images
          if (parsedImages.length > 0) {
            data.image_urls = parsedImages.map(img => 
              `data:image/jpeg;base64,${img.base64}`
            );
          }
        }
        
        // Remove the 'images' property since it doesn't exist in the database
        delete data.images;
      } catch (err) {
        console.error('Error processing images data:', err);
        delete data.images;
      }
    }
    
    // Handle legacy image_url field
    if ('image_url' in data) {
      // Move image_url value to primary_image_url
      if (data.image_url) {
        data.primary_image_url = data.image_url;
      }
      
      // Remove non-existent column
      delete data.image_url;
    }
    
    // If rented_to_customer_id or rental dates are included, make sure status is updated to 'Rented'
    if (data.rented_to_customer_id || data.rental_start_date || data.rental_end_date) {
      data.status = 'Rented';
    }
    
    // If status is changed to 'Available' or non-rental, clear rental fields
    if (data.status) {
      console.log(`Changing product status to: ${data.status}`);
      
      if (data.status !== 'Rented' && data.status !== 'Sold') {
        data.rented_to_customer_id = undefined;
        data.rental_start_date = undefined;
        data.rental_end_date = undefined;
        
        // Clear customer fields when setting to Available or Maintenance
        if (data.status === 'Available' || data.status === 'Maintenance') {
          data.customer_id = undefined;
          data.customer_name = undefined;
          data.customer_phone = undefined;
        }
      }
    }
    
    console.log(`Final product update data:`, data);
    
    const { error } = await supabase
      .from(TABLE_NAME)
      .update(data)
      .eq('id', id);
      
    if (error) {
      console.error(`Error updating product ${id}:`, error);
      throw error;
    }
    
    console.log(`Successfully updated product ${id}`);
    return true;
  } catch (error) {
    console.error('Error updating product:', error);
    return false;
  }
};

// Replaces deleteProduct - marks a product as unavailable instead of deleting it
export const markProductUnavailable = async (id: string, shouldDeleteImages: boolean = false): Promise<boolean> => {
  try {
    console.log(`Marking product ${id} as unavailable`);
    
    // If requested, clean up the product's images from storage
    if (shouldDeleteImages) {
      try {
        // Import here to avoid circular dependencies
        const productImageService = require('./productImageService');
        await productImageService.deleteProductImages(id);
        console.log(`Successfully deleted images for product ${id}`);
      } catch (imageError) {
        console.error(`Error deleting images for product ${id}:`, imageError);
        // Continue even if image deletion fails
      }
    }
    
    const { error } = await supabase
      .from(TABLE_NAME)
      .update({
        status: 'Unavailable',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
    
    console.log(`Successfully marked product ${id} as unavailable`);
    return true;
  } catch (error) {
    console.error(`Error marking product ${id} as unavailable:`, error);
    return false;
  }
};

// Keep the original deleteProduct for admin use, but it's not used in the UI
export const deleteProduct = async (id: string): Promise<boolean> => {
  try {
    // First check if this product is referenced in order_items
    const { data: orderItems, error: checkError } = await supabase
      .from('order_items')
      .select('id')
      .eq('product_id', id)
      .limit(1);
    
    if (checkError) {
      console.error(`Error checking order items for product ${id}:`, checkError);
      return false;
    }
    
    // If product is referenced in orders, we can't delete it
    if (orderItems && orderItems.length > 0) {
      console.error(`Cannot delete product ${id}: It's referenced in orders`);
      throw new Error('Cannot delete this product because it is associated with one or more orders. Consider marking it as unavailable instead.');
    }
    
    // Before deleting the product, clean up its images from storage
    try {
      // Use dynamic import to avoid circular dependencies
      const { deleteProductImages } = await import('./productImageService');
      await deleteProductImages(id);
    } catch (imageError) {
      console.error(`Error deleting images for product ${id}:`, imageError);
      // Continue with product deletion even if image deletion fails
    }
    
    // If no references, proceed with deletion
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error(`Error deleting product with ID ${id}:`, error);
    throw error; // Re-throw the error so the UI can handle it
  }
};

// Get available products for rental
export const getAvailableProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .in('status', ['Available'])
      .in('product_type', ['rental', 'both'])
      .order('name');
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching available products:', error);
    return [];
  }
};

// Get products for sale
export const getProductsForSale = async (includeSold: boolean = false): Promise<Product[]> => {
  try {
    let query = supabase
      .from(TABLE_NAME)
      .select('*')
      .in('product_type', ['sale', 'both']);
    
    // Only filter out sold products if includeSold is false
    if (!includeSold) {
      query = query.neq('status', 'Sold');
    }
    
    // Execute the query without ordering in the database
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Define status priority order
    const statusOrder: Record<string, number> = {
      'Available': 1,
      'Rented': 2,
      'Sold': 3,
      'Maintenance': 4,
      'Unavailable': 5
    };
    
    // Sort products by status priority first, then by name
    const sortedData = [...(data || [])].sort((a, b) => {
      // Get the priority for each status, defaulting to a high number if not found
      const aPriority = statusOrder[a.status] || 999;
      const bPriority = statusOrder[b.status] || 999;
      
      // If priorities differ, sort by priority
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // If priorities are the same, sort alphabetically by name
      return a.name.localeCompare(b.name);
    });
    
    return sortedData;
  } catch (error) {
    console.error('Error fetching products for sale:', error);
    return [];
  }
}; 