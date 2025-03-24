/**
 * Script to create the products table in Supabase
 * Run with: node createProductsTable.js
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://wncwlshtddeelkutqyrq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduY3dsc2h0ZGRlZWxrdXRxeXJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NDQ3NTgsImV4cCI6MjA1ODIyMDc1OH0.BbT5O4rK8ShDwcpfLtqcm71ieCHwiBF6In1OTyvu8ns';

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create the products table using Supabase's PostgreSQL functions
async function createProductsTable() {
  try {
    // Check if products table already exists
    const { error: queryError } = await supabase
      .from('products')
      .select('id')
      .limit(1);
    
    if (!queryError) {
      console.log('Products table already exists.');
      return true;
    }
    
    // If there's an error but it's not because the table doesn't exist, handle it
    if (queryError && !queryError.message.includes('does not exist')) {
      console.error('Error checking products table:', queryError);
      return false;
    }
    
    console.log('Creating products table...');
    
    // Use Supabase's REST API to execute SQL
    // This requires setting up a function in Supabase that can run SQL
    // For this example, we'll use a mock creation that logs the SQL that would be executed
    
    const createTableSQL = `
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
    `;
    
    console.log('SQL that would be executed:');
    console.log(createTableSQL);
    
    console.log('\nNote: This script cannot directly create tables in Supabase.');
    console.log('Please go to the Supabase dashboard, open the SQL editor, and run the above SQL.');
    console.log('Or use the Supabase UI to create the products table with the following fields:');
    console.log('- id: UUID (primary key, default: uuid_generate_v4())');
    console.log('- name: Text (required)');
    console.log('- category: Text (required)');
    console.log('- status: Text (required, default: Available, check: in (Available, Rented, Maintenance))');
    console.log('- rental_price: Numeric (required, default: 0)');
    console.log('- deposit: Numeric (required, default: 0)');
    console.log('- image_url: Text (optional)');
    console.log('- created_at: Timestamp with time zone (default: now())');
    console.log('- updated_at: Timestamp with time zone (default: now())');
    
    return false;
  } catch (error) {
    console.error('Error creating products table:', error);
    return false;
  }
}

// Run the function
createProductsTable()
  .then(result => {
    if (result) {
      console.log('Products table is ready.');
    } else {
      console.log('Please create the products table manually.');
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
  }); 