import { supabase } from '../lib/supabase';
import { 
  getActiveRentals,
  getRentalById,
  createRental, 
  updateRental,
  deleteRental
} from './rentalService';

import {
  getTransactions,
  getTransactionById,
  getTransactionsByType,
  createTransaction,
  updateTransaction,
  deleteTransaction
} from './transactionService';

import {
  getEvents,
  getUpcomingEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
} from './eventService';

import {
  getNotifications,
  getUnreadNotifications,
  getNotificationById,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from './notificationService';

import {
  getDashboardSummary,
  getDashboardData as fetchDashboardData,
  testConnection as testConnectionService
} from './dashboardService';

// Check if database is accessible
export const testConnection = async (): Promise<boolean> => {
  return await testConnectionService();
};

// Get dashboard data (summary statistics)
export const getDashboardData = async () => {
  try {
    // Use the new dashboardService to get all dashboard data
    const dashboardData = await fetchDashboardData();
    
    return {
      activeRentalsCount: dashboardData.summary.activeRentals,
      upcomingEventsCount: dashboardData.summary.upcomingEvents,
      monthlyRevenue: dashboardData.summary.monthlyRevenue,
      pendingReturns: dashboardData.summary.pendingReturns,
      activeRentals: dashboardData.activeRentals,
      upcomingEvents: dashboardData.upcomingEvents,
      notifications: dashboardData.notifications
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    // Return fallback data in case of error
    return {
      activeRentalsCount: 0,
      upcomingEventsCount: 0,
      monthlyRevenue: 0,
      pendingReturns: 0,
      activeRentals: [],
      upcomingEvents: [],
      notifications: []
    };
  }
};

// Export all services
export const api = {
  // Test connection
  testConnection,
  
  // Dashboard
  getDashboardData,
  getDashboardSummary,
  
  // Rentals
  rentals: {
    getActiveRentals,
    getRentalById,
    createRental,
    updateRental,
    deleteRental
  },
  
  // Transactions
  transactions: {
    getAll: getTransactions,
    getById: getTransactionById,
    getByType: getTransactionsByType,
    create: createTransaction,
    update: updateTransaction,
    delete: deleteTransaction
  },
  
  // Events
  events: {
    getAll: getEvents,
    getUpcoming: getUpcomingEvents,
    getById: getEventById,
    create: createEvent,
    update: updateEvent,
    delete: deleteEvent
  },
  
  // Notifications
  notifications: {
    getAll: getNotifications,
    getUnread: getUnreadNotifications,
    getById: getNotificationById,
    create: createNotification,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    delete: deleteNotification
  }
};

export default api;