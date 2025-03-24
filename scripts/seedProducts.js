/**
 * Script to seed the products table in Supabase
 * 
 * Run with: node seedProducts.js
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://wncwlshtddeelkutqyrq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduY3dsc2h0ZGRlZWxrdXRxeXJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NDQ3NTgsImV4cCI6MjA1ODIyMDc1OH0.BbT5O4rK8ShDwcpfLtqcm71ieCHwiBF6In1OTyvu8ns';

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Sample products
const sampleProducts = [
  {
    name: 'Canon 5D Mark IV',
    category: 'Cameras',
    status: 'Available',
    rental_price: 120,
    deposit: 500,
    image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80'
  },
  {
    name: 'Sony A7 III',
    category: 'Cameras',
    status: 'Rented',
    rental_price: 100,
    deposit: 450,
    image_url: 'https://images.unsplash.com/photo-1516724562728-afc824a36e84?w=400&q=80'
  },
  {
    name: 'Godox Lighting Kit',
    category: 'Lighting',
    status: 'Available',
    rental_price: 80,
    deposit: 200,
    image_url: 'https://images.unsplash.com/photo-1520549233664-03f65c1d1327?w=400&q=80'
  },
  {
    name: 'DJI Ronin Gimbal',
    category: 'Stabilizers',
    status: 'Maintenance',
    rental_price: 65,
    deposit: 300,
    image_url: 'https://images.unsplash.com/photo-1589872307379-0ffdf9829123?w=400&q=80'
  },
  {
    name: 'Sennheiser Wireless Mic',
    category: 'Audio',
    status: 'Rented',
    rental_price: 45,
    deposit: 150,
    image_url: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&q=80'
  }
];

// Create products table and seed data
async function seedProducts() {
  try {
    console.log('Checking if products table exists...');
    
    // First check if the table exists by querying it
    const { data, error } = await supabase
      .from('products')
      .select('count')
      .limit(1);
      
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('Products table does not exist. Please create it first using the SQL provided.');
        console.log(`
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Rented', 'Maintenance')),
  rental_price NUMERIC NOT NULL DEFAULT 0,
  deposit NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read access" ON public.products
  FOR SELECT USING (true);
        `);
        return;
      } else {
        throw error;
      }
    }
    
    console.log('Products table exists. Clearing existing data...');
    
    // Clear existing data
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .neq('id', '0'); // Delete all rows
      
    if (deleteError) {
      console.error('Error clearing products table:', deleteError);
      throw deleteError;
    }
    
    console.log('Inserting sample products...');
    
    // Insert data
    const { data: insertData, error: insertError } = await supabase
      .from('products')
      .insert(sampleProducts);
      
    if (insertError) {
      console.error('Error inserting products:', insertError);
      console.error('Error details:', JSON.stringify(insertError, null, 2)); 
      throw insertError;
    }
    
    console.log('Successfully inserted sample products!');
    
    // Verify data was inserted
    const { data: verifyData, error: verifyError } = await supabase
      .from('products')
      .select('*');
      
    if (verifyError) {
      console.error('Error verifying products:', verifyError);
      throw verifyError;
    }
    
    console.log(`Verified ${verifyData.length} products in database:`);
    verifyData.forEach(product => {
      console.log(`- ${product.name} (${product.status})`);
    });
    
  } catch (error) {
    console.error('Error in seed process:', error);
  }
}

// Run the seeding process
seedProducts(); 