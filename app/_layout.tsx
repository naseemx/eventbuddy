import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import "../global.css";
import { Platform } from "react-native";
import NotificationBackgroundTask from "../components/notification/NotificationBackgroundTask";
import { initializeStorage } from '../lib/initStorage';
import { CompanyProvider } from '../services/companyContext';
import * as Notifications from 'expo-notifications';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (process.env.EXPO_PUBLIC_TEMPO && Platform.OS === "web") {
      const { TempoDevtools } = require("tempo-devtools");
      TempoDevtools.init();
    }
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    // Initialize storage buckets
    const setupStorage = async () => {
      try {
        await initializeStorage();
        console.log('Storage initialized successfully');
      } catch (error) {
        console.error('Failed to initialize storage:', error);
      }
    };
    
    setupStorage();
  }, []);

  // Configure notification handling
  useEffect(() => {
    // This listener is fired whenever a notification is received while the app is foregrounded
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
    });

    // This listener is fired whenever a user taps on a notification (works in foreground, background, and killed states)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
      const data = response.notification.request.content.data;
      // Here you can handle navigation based on notification data
    });

    return () => {
      Notifications.removeNotificationSubscription(foregroundSubscription);
      Notifications.removeNotificationSubscription(responseSubscription);
    };
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <CompanyProvider>
        <NotificationBackgroundTask>
          <Stack
            screenOptions={({ route }) => {
              // Determine the appropriate animation based on route
              let animationType: 'slide_from_right' | 'slide_from_left' | 'slide_from_bottom' | 'fade' = 'slide_from_right'; // Default for detail views
              let animationDuration = 250;
              
              // Main tab routes should use fade transition
              const mainTabs = [
                'index', 'products/index', 'customers/index', 
                'events/index', 'finances/index', 'employees/index',
                'login' // Login screen should also use fade
              ];
              
              // Modal forms should slide from bottom
              const modalForms = [
                'customers/add', 'products/add', 'employees/add',
                'finances/add-expense', 'finances/record-payment',
                'finances/edit-invoice', 'finances/edit-transaction'
              ];
              
              if (mainTabs.includes(route.name)) {
                animationType = 'fade';
                animationDuration = 200; // Slightly faster for tabs
              } else if (modalForms.includes(route.name)) {
                animationType = 'slide_from_bottom';
                animationDuration = 300; // Slightly slower for modals
              }
              
              return {
                headerShown: !route.name.startsWith("tempobook"),
                animation: animationType,
                animationDuration: animationDuration,
                gestureEnabled: true,
                gestureDirection: animationType === 'slide_from_bottom' ? 'vertical' : 'horizontal',
                contentStyle: { backgroundColor: 'white' },
              };
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="products/index" options={{ headerShown: false }} />
            <Stack.Screen name="customers/index" options={{ headerShown: false }} />
            <Stack.Screen name="events/index" options={{ headerShown: false }} />
            <Stack.Screen name="finances/index" options={{ headerShown: false }} />
            <Stack.Screen
              name="finances/invoice-details"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="finances/edit-invoice"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="finances/record-payment"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="finances/transaction-details"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="finances/edit-transaction"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="finances/add-expense"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="employees/index" options={{ headerShown: false }} />
            <Stack.Screen name="employees/add" options={{ headerShown: false }} />
            <Stack.Screen name="employees/view" options={{ headerShown: false }} />
            <Stack.Screen name="employees/edit" options={{ headerShown: false }} />
            <Stack.Screen name="orders/index" options={{ headerShown: false }} />
            <Stack.Screen name="orders/view" options={{ headerShown: false }} />
            <Stack.Screen name="orders/add" options={{ headerShown: false }} />
            <Stack.Screen name="invoices/index" options={{ headerShown: false }} />
            <Stack.Screen name="settings/index" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </NotificationBackgroundTask>
      </CompanyProvider>
    </ThemeProvider>
  );
}
