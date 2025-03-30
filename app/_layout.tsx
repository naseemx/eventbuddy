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

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

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

  if (!loaded) {
    return null;
  }

  return (
    <NotificationBackgroundTask>
      <ThemeProvider
        value={DefaultTheme}
      >
        <Stack
          screenOptions={({ route }) => ({
            headerShown: !route.name.startsWith("tempobook"),
          })}
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
      </ThemeProvider>
    </NotificationBackgroundTask>
  );
}
