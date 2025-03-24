import { supabase } from '../lib/supabase';
import { getMonthlyFinancialSummary } from './transactionService';

interface DashboardData {
  monthlyRevenue: number;
  activeRentalsCount: number;
  upcomingEventsCount: number;
  pendingReturns: number;
  activeRentals: any[];
  upcomingEvents: any[];
  notifications: any[];
}

export const getDashboardData = async (): Promise<DashboardData> => {
  try {
    // Initialize empty dashboard data structure
    const dashboardData: DashboardData = {
      monthlyRevenue: 0,
      activeRentalsCount: 0,
      upcomingEventsCount: 0,
      pendingReturns: 0,
      activeRentals: [],
      upcomingEvents: [],
      notifications: []
    };

    // Get monthly revenue from transactions
    try {
      const financialData = await getMonthlyFinancialSummary();
      dashboardData.monthlyRevenue = financialData.income;
    } catch (revenueError) {
      console.error('Error fetching revenue data:', revenueError);
      
      // Fallback method if transaction data fails
      const { data: revenueData, error: fallbackError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'income')
        .gte('transaction_date', new Date(new Date().setDate(1)).toISOString());
      
      if (!fallbackError && revenueData) {
        dashboardData.monthlyRevenue = revenueData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      }
    }

    // Get active rentals
    const { data: rentalsData, error: rentalsError } = await supabase
      .from('rentals')
      .select('*, customer:customer_id(*)')
      .eq('status', 'active')
      .order('return_date', { ascending: true })
      .limit(5);
    
    if (rentalsError) {
      console.error('Error fetching active rentals:', rentalsError);
    } else if (rentalsData) {
      dashboardData.activeRentals = rentalsData;
      dashboardData.activeRentalsCount = rentalsData.length;
      
      // Count pending returns
      const now = new Date();
      dashboardData.pendingReturns = rentalsData.filter(rental => {
        const returnDate = new Date(rental.return_date);
        return returnDate <= now;
      }).length;
    }

    // Get upcoming events
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true })
      .limit(3);
    
    if (eventsError) {
      console.error('Error fetching upcoming events:', eventsError);
    } else if (eventsData) {
      dashboardData.upcomingEvents = eventsData;
      dashboardData.upcomingEventsCount = eventsData.length;
    }

    // Get notifications
    const { data: notificationsData, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (notificationsError) {
      console.error('Error fetching notifications:', notificationsError);
    } else if (notificationsData) {
      dashboardData.notifications = notificationsData;
    }

    return dashboardData;
  } catch (error) {
    console.error('Error in getDashboardData:', error);
    throw new Error('Failed to fetch dashboard data');
  }
};

export const getDashboardSummary = async () => {
  try {
    // Get monthly revenue, events count
    const { monthlyRevenue } = await getDashboardData();
    
    // Get active rentals count from orders table
    let activeRentalsCount = 0;
    let pendingReturns = 0;
    
    try {
      // Fetch active rental orders
      const { data: activeRentals, error: rentalsError } = await supabase
        .from('orders')
        .select('id, end_date')
        .eq('order_type', 'rental')
        .eq('status', 'Active');
      
      if (!rentalsError && activeRentals) {
        activeRentalsCount = activeRentals.length;
        
        // Calculate pending returns (rentals past their end date)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        pendingReturns = activeRentals.filter(rental => {
          const endDate = new Date(rental.end_date);
          endDate.setHours(0, 0, 0, 0);
          return endDate <= today;
        }).length;
      }
    } catch (error) {
      console.error('Error fetching active rentals for dashboard summary:', error);
    }
    
    // Get upcoming events count
    let upcomingEventsCount = 0;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { count, error: eventsError } = await supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .gte('date', today)
        .eq('status', 'Upcoming');
      
      if (!eventsError) {
        upcomingEventsCount = count || 0;
      }
    } catch (error) {
      console.error('Error fetching upcoming events count for dashboard summary:', error);
    }
    
    return { 
      monthlyRevenue, 
      activeRentalsCount, 
      upcomingEventsCount, 
      pendingReturns 
    };
  } catch (error) {
    console.error('Error in getDashboardSummary:', error);
    throw new Error('Failed to fetch dashboard summary');
  }
};

/**
 * Test the connection to Supabase
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('system_status')
      .select('online')
      .single();
    
    if (error) throw error;
    
    return data?.online || false;
  } catch (error) {
    console.error('Error testing connection:', error);
    return false;
  }
};

// Get active rentals data for dashboard
export const getActiveRentalsForDashboard = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch active rental orders
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        customer_id,
        customer_name,
        items,
        start_date,
        end_date,
        payment_status,
        status
      `)
      .eq('order_type', 'rental')
      .eq('status', 'Active')
      .order('end_date', { ascending: true });
    
    if (error) throw error;
    
    // Transform data for dashboard display
    const rentals = data.map(order => {
      // Calculate days remaining
      const endDate = new Date(order.end_date);
      const currentDate = new Date();
      
      // Reset time part to compare only dates
      endDate.setHours(0, 0, 0, 0);
      currentDate.setHours(0, 0, 0, 0);
      
      // Calculate difference in days
      const timeDiff = endDate.getTime() - currentDate.getTime();
      const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      // Parse items to extract product names
      const parsedItems: { product_name: string; product_id: string }[] = JSON.parse(order.items) || [];
      const itemNames = parsedItems.map(item => item.product_name);
      
      return {
        id: order.id,
        customerName: order.customer_name,
        items: itemNames,
        returnDate: order.end_date,
        daysRemaining: daysRemaining,
        paymentStatus: order.payment_status
      };
    });
    
    return rentals;
  } catch (error) {
    console.error('Error fetching active rentals for dashboard:', error);
    return [];
  }
};

// Get upcoming events for dashboard
export const getUpcomingEventsForDashboard = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch upcoming events
    const { data, error } = await supabase
      .from('events')
      .select(`
        id,
        title,
        date,
        time,
        venue,
        address,
        status
      `)
      .gte('date', today)
      .eq('status', 'Upcoming')
      .order('date', { ascending: true })
      .limit(5);
    
    if (error) throw error;
    
    // Transform data for dashboard display
    const events = data.map(event => {
      // Format date and venue for display
      const eventDate = new Date(event.date);
      const formattedDate = eventDate.toLocaleDateString();
      
      return {
        id: event.id,
        title: event.title,
        date: formattedDate + (event.time ? ` ${event.time}` : ''),
        location: event.venue || event.address || 'No location specified',
        staffCount: 2, // Default value or could be fetched from staff assignments
      };
    });
    
    return events;
  } catch (error) {
    console.error('Error fetching upcoming events for dashboard:', error);
    return [];
  }
};