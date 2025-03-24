import { supabase } from '../lib/supabase';

// Define the table name
const TABLE_NAME = 'notifications';

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

// Function to create a new notification
export const createNotification = async (notification: {
  type: string;
  title: string;
  message: string;
  reference_id?: string;
}): Promise<Notification | null> => {
  try {
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

    return data?.[0] || null;
  } catch (error) {
    console.error('Notification service error:', error);
    throw error;
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