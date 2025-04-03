import { Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

// Check and request storage permissions for Android
export const requestStoragePermission = async (): Promise<boolean> => {
  // On iOS, we don't need to request storage permission
  if (Platform.OS === 'ios') {
    return true;
  }

  try {
    // For Android, use MediaLibrary permissions instead of deprecated Permissions
    const { status } = await MediaLibrary.requestPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Storage permission is required to save files. Please grant permission in your device settings.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error requesting storage permission:', error);
    return false;
  }
};

// Check if sharing is available
export const checkSharingAvailability = async (): Promise<boolean> => {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    
    if (!isAvailable) {
      console.log('Sharing is not available on this device');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking sharing availability:', error);
    return false;
  }
};

// Check document directory and ensure it exists
export const ensureDocumentDirectoryExists = async (): Promise<string | null> => {
  try {
    const documentDir = FileSystem.documentDirectory;
    
    if (!documentDir) {
      console.error('Document directory not available');
      return null;
    }
    
    // Create a subfolder for PDFs if it doesn't exist
    const pdfDir = `${documentDir}pdfs/`;
    
    const dirInfo = await FileSystem.getInfoAsync(pdfDir);
    
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(pdfDir, { intermediates: true });
    }
    
    return pdfDir;
  } catch (error) {
    console.error('Error ensuring document directory exists:', error);
    return null;
  }
};

// Helper function to check if we can generate PDFs
export const canGeneratePdf = async (): Promise<boolean> => {
  // For iOS, we don't need to check permissions explicitly
  if (Platform.OS === 'ios') {
    return true;
  }
  
  // For Android, check storage permission
  const hasPermission = await requestStoragePermission();
  
  if (!hasPermission) {
    return false;
  }
  
  // Ensure document directory exists
  const pdfDir = await ensureDocumentDirectoryExists();
  
  return pdfDir !== null;
}; 