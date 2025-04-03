import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { checkAllNotifications, registerForPushNotifications } from '../../services/notificationService';

// Define the background task name
const NOTIFICATION_BACKGROUND_TASK = 'NOTIFICATION_BACKGROUND_TASK';

// Register the task with TaskManager
TaskManager.defineTask(NOTIFICATION_BACKGROUND_TASK, async () => {
  try {
    console.log('[Background Task] Checking for notifications...');
    // This will check for event status changes and upcoming events
    await checkAllNotifications();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('[Background Task] Error checking notifications:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

interface NotificationBackgroundTaskProps {
  children?: React.ReactNode;
}

const NotificationBackgroundTask: React.FC<NotificationBackgroundTaskProps> = ({ children }) => {
  const appState = useRef(AppState.currentState);

  // Register background task to check for notifications
  const registerBackgroundTask = async () => {
    try {
      // Check if task is already registered
      const isRegistered = await TaskManager.isTaskRegisteredAsync(NOTIFICATION_BACKGROUND_TASK);
      
      if (isRegistered) {
        // If already registered, unregister it first to update the settings
        await BackgroundFetch.unregisterTaskAsync(NOTIFICATION_BACKGROUND_TASK);
      }
      
      // Register the task with a longer interval for better efficiency
      await BackgroundFetch.registerTaskAsync(NOTIFICATION_BACKGROUND_TASK, {
        minimumInterval: 60 * 120, // 2 hours in seconds (increased from 30 minutes)
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('Background notification task registered with 2 hour interval');
    } catch (error) {
      console.error('Error registering background task:', error);
    }
  };

  // Handle app state changes
  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground
      console.log('App has come to the foreground, checking for notifications and event status changes');
      
      // Check for notifications and update event statuses when app is foregrounded
      try {
        await checkAllNotifications(); // This includes updating event statuses
      } catch (error) {
        console.error('Error checking notifications in foreground:', error);
      }
    }
    
    appState.current = nextAppState;
  };

  useEffect(() => {
    // Set up push notifications
    registerForPushNotifications();
    
    // Register the background task
    registerBackgroundTask();
    
    // Check for notifications and update event statuses on component mount
    checkAllNotifications().catch(error => {
      console.error('Error checking notifications on mount:', error);
    });
    
    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      // Clean up subscription when component unmounts
      subscription.remove();
    };
  }, []);

  // This component doesn't render anything visible
  return <>{children}</>;
};

export default NotificationBackgroundTask; 