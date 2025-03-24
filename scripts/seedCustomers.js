/**
 * Script to seed the customers table in Supabase
 * 
 * Run with: node seedCustomers.js
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://wncwlshtddeelkutqyrq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduY3dsc2h0ZGRlZWxrdXRxeXJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NDQ3NTgsImV4cCI6MjA1ODIyMDc1OH0.BbT5O4rK8ShDwcpfLtqcm71ieCHwiBF6In1OTyvu8ns';

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Sample customers with simplified schema
const sampleCustomers = [
  {
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "(555) 123-4567",
    address: "123 Main St, Anytown, CA 90210",
    notes: "Prefers weekend appointments. Always returns equipment on time."
  },
  {
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    phone: "(555) 987-6543",
    address: "456 Oak Ave, Springfield, IL 62704",
    notes: "Photographer for local newspaper. Frequent rentals."
  },
  {
    name: "Michael Brown",
    email: "mbrown@example.com",
    phone: "(555) 456-7890",
    address: "789 Pine St, Riverside, CA 92501",
    notes: "Film student at Riverside University."
  },
  {
    name: "Emily Davis",
    email: "emily.davis@example.com",
    phone: "(555) 234-5678",
    address: "321 Cedar Rd, Lakeside, NY 14750",
    notes: "Professional wedding photographer. Prefers high-end equipment."
  },
  {
    name: "Robert Wilson",
    email: "rwilson@example.com",
    phone: "(555) 876-5432",
    address: "654 Maple Dr, Mountainview, CO 80301",
    notes: "Photography hobbyist. New client."
  }
];

// Create customers table and seed data
async function seedCustomers() {
  try {
    console.log('Checking if customers table exists...');
    
    // First check if the table exists by querying it
    const { data, error } = await supabase
      .from('customers')
      .select('count')
      .limit(1);
      
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('Customers table does not exist. Please create it first using the SQL provided.');
        console.log(`
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read access" ON public.customers
  FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON public.customers
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.customers
  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow anonymous delete access" ON public.customers
  FOR DELETE USING (true);
        `);
        return;
      } else {
        throw error;
      }
    }
    
    // Skip deletion step and just insert sample customers
    console.log('Inserting sample customers...');
    
    // Insert data
    const { data: insertData, error: insertError } = await supabase
      .from('customers')
      .insert(sampleCustomers);
      
    if (insertError) {
      console.error('Error inserting customers:', insertError);
      throw insertError;
    }
    
    console.log('Successfully inserted sample customers!');
    
    // Verify data was inserted
    const { data: verifyData, error: verifyError } = await supabase
      .from('customers')
      .select('*');
      
    if (verifyError) {
      console.error('Error verifying customers:', verifyError);
      throw verifyError;
    }
    
    console.log(`Verified ${verifyData.length} customers in database:`);
    verifyData.forEach(customer => {
      console.log(`- ${customer.name} (${customer.email})`);
    });
    
  } catch (error) {
    console.error('Error in seed process:', error);
  }
}

// Run the seeding process
seedCustomers(); 