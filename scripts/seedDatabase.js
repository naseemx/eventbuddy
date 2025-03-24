/**
 * Script to seed the Supabase database with sample data
 * 
 * Run with: node seedDatabase.js
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://wncwlshtddeelkutqyrq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduY3dsc2h0ZGRlZWxrdXRxeXJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NDQ3NTgsImV4cCI6MjA1ODIyMDc1OH0.BbT5O4rK8ShDwcpfLtqcm71ieCHwiBF6In1OTyvu8ns';

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Sample data for each table
const sampleCustomers = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+91 9876543210',
    address: '123 Main St, Mumbai, India',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    phone: '+91 9876543211',
    address: '456 Park Ave, Delhi, India',
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Michael Brown',
    email: 'michael.brown@example.com',
    phone: '+91 9876543212',
    address: '789 Oak Rd, Bangalore, India',
    created_at: new Date().toISOString()
  }
];

const sampleRentals = [
  {
    id: '1',
    customer_id: '1',
    customer_name: 'John Smith',
    items: ['Canon 5D Mark IV', 'Tripod', '50mm Lens'],
    return_date: '2023-05-15',
    days_remaining: 3,
    status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    customer_id: '2',
    customer_name: 'Sarah Johnson',
    items: ['PA System', 'Wireless Microphones (2)'],
    return_date: '2023-05-18',
    days_remaining: 6,
    status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    customer_id: '3',
    customer_name: 'Michael Brown',
    items: ['Projector', 'Projection Screen', 'HDMI Cable'],
    return_date: '2023-05-12',
    days_remaining: 1,
    status: 'active',
    created_at: new Date().toISOString()
  }
];

const sampleEvents = [
  {
    id: '1',
    title: 'Wedding Reception',
    date: '2023-06-15',
    time: '18:00',
    location: 'Grand Hall, Mumbai',
    customer_name: 'John Smith',
    status: 'upcoming',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Corporate Conference',
    date: '2023-06-18',
    time: '09:00',
    location: 'Business Center, Delhi',
    customer_name: 'Sarah Johnson',
    status: 'upcoming',
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Birthday Party',
    date: '2023-06-20',
    time: '16:00',
    location: 'Garden Venue, Bangalore',
    customer_name: 'Michael Brown',
    status: 'upcoming',
    created_at: new Date().toISOString()
  }
];

const sampleTransactions = [
  {
    id: '1',
    type: 'income',
    description: 'Wedding Photography Package',
    amount: 2500,
    date: '2023-06-15',
    category: 'Event',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    type: 'expense',
    description: 'Camera Equipment Repair',
    amount: 350,
    date: '2023-06-12',
    category: 'Maintenance',
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    type: 'income',
    description: 'Corporate Event Photography',
    amount: 1800,
    date: '2023-06-10',
    category: 'Event',
    created_at: new Date().toISOString()
  }
];

const sampleNotifications = [
  {
    id: '1',
    type: 'return',
    title: 'Overdue Return',
    message: 'Camera equipment for John Doe is 2 days overdue',
    is_read: false,
    created_at: new Date().toISOString(),
    reference_id: '3'
  },
  {
    id: '2',
    type: 'event',
    title: 'Event Tomorrow',
    message: 'Wedding photoshoot at Sunset Gardens',
    is_read: false,
    created_at: new Date().toISOString(),
    reference_id: '1'
  },
  {
    id: '3',
    type: 'payment',
    title: 'Payment Received',
    message: 'Invoice #1234 has been paid in full',
    is_read: true,
    created_at: new Date().toISOString(),
    reference_id: '1'
  }
];

// Sample products
const sampleProducts = [
  {
    id: '1',
    name: 'Canon 5D Mark IV',
    category: 'Cameras',
    status: 'Available',
    rental_price: 120,
    deposit: 500,
    image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Sony A7 III',
    category: 'Cameras',
    status: 'Rented',
    rental_price: 100,
    deposit: 450,
    image_url: 'https://images.unsplash.com/photo-1516724562728-afc824a36e84?w=400&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Godox Lighting Kit',
    category: 'Lighting',
    status: 'Available',
    rental_price: 80,
    deposit: 200,
    image_url: 'https://images.unsplash.com/photo-1520549233664-03f65c1d1327?w=400&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: '4',
    name: 'DJI Ronin Gimbal',
    category: 'Stabilizers',
    status: 'Maintenance',
    rental_price: 65,
    deposit: 300,
    image_url: 'https://images.unsplash.com/photo-1589872307379-0ffdf9829123?w=400&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Sennheiser Wireless Mic',
    category: 'Audio',
    status: 'Rented',
    rental_price: 45,
    deposit: 150,
    image_url: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&q=80',
    created_at: new Date().toISOString()
  }
];

// System status for connection testing
const systemStatus = {
  id: '1',
  online: true
};

// Table names - remove any tables that don't exist
const TABLES = [
  'system_status',
  'customers',
  'rentals',
  'events',
  'transactions',
  'notifications',
  'products'
];

// Create tables if they don't exist
async function createTablesIfNeeded() {
  console.log('Checking and creating tables if needed...');
  
  try {
    // Check if system_status table exists
    const systemStatusExists = await doesTableExist('system_status');
    if (!systemStatusExists) {
      console.log('Creating system_status table...');
      // This will be handled by RPC or SQL, which we're not implementing here
    }
    
    // Check if products table exists
    const productsExists = await doesTableExist('products');
    if (!productsExists) {
      console.log('Creating products table...');
      // In a real implementation, we would use SQL to create the table
      // But for this example, we'll rely on the table being created in Supabase dashboard
    }
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

// Insert data function
async function insertData() {
  try {
    console.log('Starting to seed database...');

    // System status
    const { error: systemError } = await supabase
      .from('system_status')
      .upsert(systemStatus);
    
    if (systemError) {
      console.error('Error inserting system status:', systemError);
    } else {
      console.log('System status inserted successfully');
    }

    // Customers
    const { error: customerError } = await supabase
      .from('customers')
      .upsert(sampleCustomers);
    
    if (customerError) {
      console.error('Error inserting customers:', customerError);
    } else {
      console.log('Customers inserted successfully');
    }

    // Rentals
    const { error: rentalError } = await supabase
      .from('rentals')
      .upsert(sampleRentals);
    
    if (rentalError) {
      console.error('Error inserting rentals:', rentalError);
    } else {
      console.log('Rentals inserted successfully');
    }

    // Events
    const { error: eventError } = await supabase
      .from('events')
      .upsert(sampleEvents);
    
    if (eventError) {
      console.error('Error inserting events:', eventError);
    } else {
      console.log('Events inserted successfully');
    }

    // Transactions
    const { error: transactionError } = await supabase
      .from('transactions')
      .upsert(sampleTransactions);
    
    if (transactionError) {
      console.error('Error inserting transactions:', transactionError);
    } else {
      console.log('Transactions inserted successfully');
    }

    // Notifications
    const { error: notificationError } = await supabase
      .from('notifications')
      .upsert(sampleNotifications);
    
    if (notificationError) {
      console.error('Error inserting notifications:', notificationError);
    } else {
      console.log('Notifications inserted successfully');
    }

    // Products
    const { data: productData, error: productError } = await supabase
      .from('products')
      .upsert(sampleProducts);
    
    if (productError) {
      console.error('Error inserting products:', productError);
      console.error('Error details:', JSON.stringify(productError, null, 2));
    } else {
      console.log('Products inserted successfully');
    }

    console.log('Database seeding completed!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Run the script
async function seedDatabase() {
  try {
    // First check and create tables if needed
    await createTablesIfNeeded();
    
    // Then clear the database
    await clearDatabase();
    
    // Then insert new data
    await insertData();
    
    console.log('Database seeding process completed!');
  } catch (error) {
    console.error('Error in database seeding process:', error);
  }
}

// Run the insert function
insertData(); 