import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Define the table name
const TABLE_NAME = 'notifications';

// Notification types
export type NotificationType = 'event_upcoming' | 'event_today' | 'rental_overdue';

// Interface for notification
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  reference_id?: string;
}

// Register for push notifications
export const registerForPushNotifications = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;

    console.log('Push token:', token);
    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
};

// Function to fetch notifications from Supabase
export const getNotifications = async (limit: number = 10): Promise<Notification[]> => {
  try {
    // Fetch notifications from Supabase ordered by creation date (newest first)
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notifications:', error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error('Notification service error:', error);
    throw error;
  }
};

// Function to mark a notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      throw new Error(error.message);
    }

    return true;
  } catch (error) {
    console.error('Notification service error:', error);
    throw error;
  }
};

// Function to mark all notifications as read
export const markAllNotificationsAsRead = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .update({ is_read: true })
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error(error.message);
    }

    return true;
  } catch (error) {
    console.error('Notification service error:', error);
    throw error;
  }
};

// Create a notification with optional push notification
export const createNotification = async (notification: {
  type: string;
  title: string;
  message: string;
  reference_id?: string;
  sendPush?: boolean;
}): Promise<Notification | null> => {
  try {
    // Insert into database
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([
        {
          type: notification.type,
          title: notification.title,
          message: notification.message,
          reference_id: notification.reference_id,
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error('Error creating notification:', error);
      throw new Error(error.message);
    }

    // If sendPush is true, also send as push notification
    if (notification.sendPush) {
      await sendPushNotification({
        title: notification.title,
        body: notification.message,
        data: { type: notification.type, referenceId: notification.reference_id }
      });
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Error in createNotification:', error);
    return null;
  }
};

// Send push notification
export const sendPushNotification = async ({ 
  title, 
  body, 
  data 
}: { 
  title: string; 
  body: string; 
  data?: Record<string, any>;
}) => {
  try {
    console.log('Attempting to send push notification:', { title, body });
    
    // Check and request permissions if needed
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Notification permission not granted. Requesting permissions...');
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        console.error('User denied notification permissions');
        return false;
      }
    }
    
    // Configure Android channel with high importance
    if (Platform.OS === 'android') {
      console.log('Setting up Android notification channel');
      try {
        // Create a channel with maximum importance to ensure notifications appear
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default Channel',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default', // Use default sound
          enableVibrate: true,
          showBadge: true,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
        console.log('Android notification channel configured successfully');
      } catch (channelError) {
        console.error('Error configuring notification channel:', channelError);
      }
    }
    
    // Configure how notifications are handled when the app is in the foreground
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    
    // Schedule the notification with increased debugging
    console.log('About to schedule notification with content:', {
      title,
      body,
      data: data || {},
    });
    
    // Force system notification by using proper trigger
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
        priority: 'max',
        vibrate: [0, 250, 250, 250],
        color: '#FF231F7C',
      },
      trigger: null // Schedule immediately
    });
    
    console.log('Push notification scheduled with ID:', notificationId);
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    return false;
  }
};

// Function to check for upcoming events and create notifications
export const checkUpcomingEvents = async (): Promise<void> => {
  try {
    const now = new Date();
    const twoDaysFromNow = new Date(now);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    
    // Format dates for database query
    const today = now.toISOString().split('T')[0];
    const twoDaysAhead = twoDaysFromNow.toISOString().split('T')[0];
    
    console.log(`Checking for events today (${today}) and upcoming (${twoDaysAhead})`);
    
    // Get events happening today
    const { data: todayEvents, error: todayError } = await supabase
      .from('events')
      .select('id, title, date, time, status')
      .eq('date', today)
      .eq('status', 'Upcoming');
    
    if (todayError) {
      console.error('Error fetching today events:', todayError);
      return;
    }
    
    // Get events happening in 2 days
    const { data: upcomingEvents, error: upcomingError } = await supabase
      .from('events')
      .select('id, title, date, time, status')
      .eq('date', twoDaysAhead)
      .eq('status', 'Upcoming');
    
    if (upcomingError) {
      console.error('Error fetching upcoming events:', upcomingError);
      return;
    }
    
    console.log(`Found ${todayEvents?.length || 0} events today and ${upcomingEvents?.length || 0} events in 2 days`);
    
    // Create notifications for today's events
    for (const event of todayEvents || []) {
      // Check if notification already exists for this event and type (today)
      const { data: existingNotifications } = await supabase
        .from(TABLE_NAME)
        .select('id')
        .eq('type', 'event_today')
        .eq('reference_id', event.id)
        .gte('created_at', now.toISOString().split('T')[0] + 'T00:00:00');
      
      if (existingNotifications && existingNotifications.length > 0) {
        console.log(`Today notification already exists for event ${event.id}`);
        continue;
      }
      
      await createNotification({
        type: 'event_today',
        title: 'Event Today',
        message: `"${event.title}" is scheduled for today at ${event.time || 'scheduled time'}`,
        reference_id: event.id,
        sendPush: true
      });
      
      // Also update the event status automatically when notifications are checked
      await updateEventStatusToEnded(event.id, event.date);
    }
    
    // Create notifications for upcoming events (2 days ahead)
    for (const event of upcomingEvents || []) {
      // Check if notification already exists for this event and type (upcoming)
      const { data: existingNotifications } = await supabase
        .from(TABLE_NAME)
        .select('id')
        .eq('type', 'event_upcoming')
        .eq('reference_id', event.id)
        .gte('created_at', now.toISOString().split('T')[0] + 'T00:00:00');
      
      if (existingNotifications && existingNotifications.length > 0) {
        console.log(`Upcoming notification already exists for event ${event.id}`);
        continue;
      }
      
      await createNotification({
        type: 'event_upcoming',
        title: 'Upcoming Event',
        message: `"${event.title}" is scheduled in 2 days (${event.date}) at ${event.time || 'scheduled time'}`,
        reference_id: event.id,
        sendPush: true
      });
    }
  } catch (error) {
    console.error('Error checking upcoming events:', error);
  }
};

// Helper function to update event status to "Ended" if the date has passed
export const updateEventStatusToEnded = async (eventId: string, eventDate: string): Promise<void> => {
  try {
    const now = new Date();
    const eventDateTime = new Date(eventDate);
    
    // If event date is today or in the past, update to "Ended"
    if (eventDateTime <= now) {
      // Update event status to "Ended"
      const { error } = await supabase
        .from('events')
        .update({ status: 'Ended' })
        .eq('id', eventId)
        .eq('status', 'Upcoming');  // Only update if status is still "Upcoming"
      
      if (error) {
        console.error(`Error updating event ${eventId} status to Ended:`, error);
      } else {
        console.log(`Successfully updated event ${eventId} status to Ended`);
      }
    }
  } catch (error) {
    console.error(`Error in updateEventStatusToEnded for event ${eventId}:`, error);
  }
};

// Function to check for overdue rentals and create notifications
export const checkOverdueRentals = async (): Promise<void> => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    console.log(`Checking for overdue rentals as of ${today}`);
    
    // Get all active rental orders where return date has passed
    const { data: overdueRentals, error } = await supabase
      .from('orders')
      .select('id, order_number, customer_id, return_date, products:order_items(product_id, product:products(name))')
      .eq('type', 'rental')  // Only rental orders
      .eq('status', 'active')  // Only active rentals
      .lt('return_date', today);  // Return date is less than today
    
    if (error) {
      console.error('Error fetching overdue rentals:', error);
      return;
    }
    
    console.log(`Found ${overdueRentals?.length || 0} overdue rentals`);
    
    // Create notifications for overdue rentals
    for (const rental of overdueRentals || []) {
      // Check if notification already exists for this rental
      const { data: existingNotifications } = await supabase
        .from(TABLE_NAME)
        .select('id')
        .eq('type', 'rental_overdue')
        .eq('reference_id', rental.id)
        .gte('created_at', now.toISOString().split('T')[0] + 'T00:00:00');
      
      if (existingNotifications && existingNotifications.length > 0) {
        console.log(`Overdue notification already exists for rental ${rental.id}`);
        continue;
      }
      
      // Get product names for the message
      const productNames = rental.products
        ?.map((item: any) => item.product?.name || 'Unknown Product')
        .filter(Boolean)
        .join(', ');
      
      await createNotification({
        type: 'rental_overdue',
        title: `Overdue Rental: #${rental.order_number}`,
        message: `Rental items (${productNames}) were due to be returned on ${rental.return_date}. Please contact the customer.`,
        reference_id: rental.id,
        sendPush: true
      });
    }
  } catch (error) {
    console.error('Error checking overdue rentals:', error);
  }
};

// Function to check all notification types
export const checkAllNotifications = async (): Promise<void> => {
  try {
    console.log('Checking all notification types...');
    
    // Update event statuses for all upcoming events that should be marked as ended
    await updateAllEventStatuses();
    
    // Check for upcoming events and create notifications
  await checkUpcomingEvents();
    
    // Check for overdue rentals and create notifications
  await checkOverdueRentals();
    
    console.log('All notification checks completed');
  } catch (error) {
    console.error('Error in checkAllNotifications:', error);
  }
};

// Function to update all event statuses that have passed their event date
export const updateAllEventStatuses = async (): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`Updating statuses for all events that have ended (before or on ${today})`);
    
    // Get all upcoming events with dates in the past or today
    const { data: pastEvents, error } = await supabase
      .from('events')
      .select('id, title, date')
      .eq('status', 'Upcoming')
      .lte('date', today);
    
    if (error) {
      console.error('Error fetching past events:', error);
      return;
    }
    
    console.log(`Found ${pastEvents?.length || 0} past events to update to 'Ended' status`);
    
    // Update each event to "Ended"
    for (const event of pastEvents || []) {
      await updateEventStatusToEnded(event.id, event.date);
    }
  } catch (error) {
    console.error('Error updating all event statuses:', error);
  }
};

// Function to delete a notification
export const deleteNotification = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      throw new Error(error.message);
    }

    return true;
  } catch (error) {
    console.error('Notification service error:', error);
    throw error;
  }
};

// Function to seed test notification data if none exists
export const seedTestNotifications = async (): Promise<boolean> => {
  try {
    // First check if there are any notifications
    const { data: existingData, error: countError } = await supabase
      .from(TABLE_NAME)
      .select('id')
      .limit(1);
    
    if (countError) {
      console.error('Error checking notifications:', countError);
      return false;
    }
    
    // If notifications already exist, don't seed
    if (existingData && existingData.length > 0) {
      console.log('Notifications already exist, skipping seed');
      return true;
    }
    
    console.log('No notifications found, seeding test data...');
    
    // Create sample notifications
    const sampleNotifications = [
      {
        type: 'order',
        title: 'Overdue Return',
        message: 'Camera equipment for John Doe is 2 days overdue',
        is_read: false,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      },
      {
        type: 'event',
        title: 'Event Tomorrow',
        message: 'Wedding photoshoot at Sunset Gardens',
        is_read: false,
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      },
      {
        type: 'payment',
        title: 'Payment Received',
        message: 'Invoice #1234 has been paid in full',
        is_read: true,
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      },
      {
        type: 'order',
        title: 'Maintenance Due',
        message: 'Sony A7 III is due for sensor cleaning',
        is_read: true,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      },
      {
        type: 'alert',
        title: 'Low Inventory',
        message: 'Only 2 Canon 24-70mm lenses left in stock',
        is_read: true,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      },
      {
        type: 'event',
        title: 'New Customer',
        message: 'Michael Brown has registered as a new customer',
        is_read: true,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      }
    ];
    
    // Insert sample notifications
    const { error: insertError } = await supabase
      .from(TABLE_NAME)
      .insert(sampleNotifications);
    
    if (insertError) {
      console.error('Error seeding notifications:', insertError);
      return false;
    }
    
    console.log('Successfully seeded notifications');
    return true;
  } catch (error) {
    console.error('Error in seedTestNotifications:', error);
    return false;
  }
};

// Send a test notification - for testing push notifications
export const sendTestNotification = async (): Promise<boolean> => {
  try {
    const timestamp = new Date().toLocaleTimeString();
    
    // First, create the notification in the database
    const notificationData = {
      type: 'test_notification',
      title: 'Test Notification',
      message: `This is a test notification sent at ${timestamp}. If you can see this, notifications are working properly!`,
      sendPush: true  // This will trigger the push notification
    };
    
    // Create in database and send push
    await createNotification(notificationData);
    
    console.log('Test notification created and push sent');
    return true;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
  }
};

// Function to count unread notifications for header badge
export const getUnreadNotificationCount = async (): Promise<number> => {
  try {
    // Fetch count of unread notifications
    const { count, error } = await supabase
      .from(TABLE_NAME)
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    if (error) {
      console.error('Error counting unread notifications:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getUnreadNotificationCount:', error);
    return 0;
  }
};