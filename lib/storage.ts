import { supabase } from './supabase';
import { decode } from 'base64-arraybuffer';
// Conditionally import FileSystem from expo-file-system 
let FileSystem: any;
try {
  // This will only work in React Native environment
  FileSystem = require('expo-file-system');
} catch (error) {
  // Will fail in browser, which is fine
  console.log('FileSystem not available, assuming browser environment');
}

// Storage bucket name
export const PRODUCT_IMAGES_BUCKET = 'product-images';

// Upload limits
export const MAX_FILE_SIZE_MB = 5; // 5MB max file size
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const COMPRESSED_IMAGE_QUALITY = 0.7; // 70% quality for compression

// Create a storage bucket (run this once during app setup)
export const createProductImagesBucket = async () => {
  try {
    // First check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === PRODUCT_IMAGES_BUCKET);
    
    if (bucketExists) {
      console.log('Bucket already exists, skipping creation');
      return true;
    }
    
    // Try to create bucket
    const { data, error } = await supabase.storage.createBucket(PRODUCT_IMAGES_BUCKET, {
      public: true, // Make the bucket public
      fileSizeLimit: MAX_FILE_SIZE_MB * 1024 * 1024,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('Bucket already exists');
        return true;
      }
      
      // Log error but don't fail the app - we might still be able to use an existing bucket
      console.error('Error creating bucket:', error);
      // Return true to allow app to continue even with bucket creation failure
      return true;
    }

    console.log('Bucket created successfully:', data);
    return true;
  } catch (error) {
    console.error('Error creating bucket:', error);
    // Return true to allow app to continue even with bucket creation failure
    return true;
  }
};

/**
 * Get the public URL for an image in storage
 * @param path The path of the image in the bucket
 * @returns The public URL or null if there was an error
 */
export const getImageUrl = (path: string): string | null => {
  try {
    // If path is already a full URL, return it
    if (path.startsWith('http://') || path.startsWith('https://')) {
      console.log('Path is already a URL, returning as is');
      return path;
    }
    
    console.log(`Getting public URL for ${path}`);
    
    // Get the public URL from Supabase - this method is synchronous
    const { data } = supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .getPublicUrl(path);
    
    if (!data || !data.publicUrl) {
      console.error('No public URL returned');
      return null;
    }
    
    console.log(`Generated public URL for ${path}: ${data.publicUrl}`);
    return data.publicUrl;
  } catch (error) {
    console.error('Error getting image URL:', error);
    return null;
  }
};

// Upload image from local URI (for mobile)
export const uploadImageFromUri = async (
  uri: string,
  folder: string,
  fileName: string
): Promise<string | null> => {
  try {
    console.log(`Attempting to upload image from URI: ${uri.substring(0, 50)}...`);
    
    // Handle different URI types
    
    // Case 1: Remote URL (http/https)
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      console.log('Detected remote URL, returning as is');
      // If it's already a valid URL, we can just return it directly
      return uri;
    }
    
    // Case 2: Data URL (already has base64 data)
    if (uri.startsWith('data:')) {
      console.log('Detected data URL, converting to base64');
      // Just pass it to the base64 upload function
      return await uploadBase64Image(uri, folder, fileName);
    }
    
    // Case 3: Local file URI
    // Check if FileSystem is available (React Native environment)
    if (typeof FileSystem !== 'undefined') {
      try {
        // Get file info
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) {
          console.error('File does not exist');
          return null;
        }
    
        // Check file size
        if (fileInfo.size && fileInfo.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          console.error(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit`);
          return null;
        }
    
        // Read the file as base64
        const base64Data = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
    
        // Convert to array buffer
        const arrayBuffer = decode(base64Data);
        
        // Construct the file path
        const filePath = folder ? `${folder}/${fileName}` : fileName;
    
        // Upload to Supabase
        const { data, error } = await supabase.storage
          .from(PRODUCT_IMAGES_BUCKET)
          .upload(filePath, arrayBuffer, {
            contentType: getContentType(fileName),
            upsert: true, // Replace if exists
          });
    
        if (error) {
          console.error('Error uploading image:', error);
          return null;
        }
    
        // Return the public URL
        return getImageUrl(data.path);
      } catch (error) {
        console.error('Error with FileSystem:', error);
        // Fall through to browser approach if FileSystem fails
      }
    }
    
    // Case 4: Browser environment (fetch the image)
    console.log('Trying browser approach for URI');
    try {
      // In browser environment, try to fetch the image
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Convert blob to array buffer
      const arrayBuffer = await blob.arrayBuffer();
      
      // Construct the file path
      const filePath = folder ? `${folder}/${fileName}` : fileName;
      
      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .upload(filePath, arrayBuffer, {
          contentType: blob.type || getContentType(fileName),
          upsert: true, // Replace if exists
        });
        
      if (error) {
        console.error('Error uploading image in browser:', error);
        return null;
      }
      
      // Return the public URL
      return getImageUrl(data.path);
    } catch (browserError) {
      console.error('Browser fetch approach failed:', browserError);
    }
    
    // If all approaches fail
    console.error('All URI handling approaches failed');
    return null;
  } catch (error) {
    console.error('Error uploading image from URI:', error);
    return null;
  }
};

// Upload base64 image
export const uploadBase64Image = async (
  base64Data: string,
  folder: string,
  fileName: string
): Promise<string | null> => {
  try {
    // Strip out data URL header if present
    let base64Content = base64Data;
    let contentType = 'image/jpeg'; // Default content type
    
    if (base64Data.startsWith('data:')) {
      const parts = base64Data.split('base64,');
      if (parts.length === 2) {
        // Extract content type from data URL if available
        if (parts[0].includes(':') && parts[0].includes(';')) {
          contentType = parts[0].split(':')[1].split(';')[0];
        }
        base64Content = parts[1];
      }
    }
    
    // Skip if base64 content is empty
    if (!base64Content || base64Content.trim().length === 0) {
      console.error('Empty base64 content, skipping upload');
      return null;
    }
    
    // Check file size
    if (base64Content.length > MAX_FILE_SIZE_BYTES) {
      console.error(`Image too large: ${(base64Content.length / 1024 / 1024).toFixed(2)}MB exceeds ${MAX_FILE_SIZE_MB}MB limit`);
      console.error('To upload larger images, increase the file size limit in Supabase storage settings');
      return null;
    }
    
    console.log(`Uploading base64 image to ${folder}/${fileName}, content length: ${(base64Content.length / 1024 / 1024).toFixed(2)}MB`);
    
    // Convert to array buffer
    const arrayBuffer = decode(base64Content);
    
    // Construct the file path
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Get the current session to include auth headers
    const { data: session } = await supabase.auth.getSession();
    
    // Upload to Supabase with explicit authorization
    const { data, error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: contentType,
        upsert: true, // Replace if exists
        duplex: 'half',
      });

    if (error) {
      console.error('Error uploading base64 image:', error);
      
      // Check for specific errors
      if (error.message.includes('row-level security') || 
          error.message.includes('403') || 
          (error as any).statusCode === '403') {
        console.error('Permission denied. This is likely due to:');
        console.error('1. Row-level security (RLS) policies in Supabase');
        console.error('2. The user may not be authenticated');
        console.error('3. The bucket permissions may be restrictive');
        
        // Try to get user info for debugging
        const { data: user } = await supabase.auth.getUser();
        console.log('Current user:', user || 'Not authenticated');
        
        // Try public bucket configuration as fallback
        console.log('Attempting to update bucket to public access...');
        try {
          await supabase.rpc('allow_public_bucket', { bucket_name: PRODUCT_IMAGES_BUCKET });
          console.log('Applied public bucket policy');
        } catch (e) {
          console.error('Failed to make bucket public:', e);
        }
      }
      
      return null;
    }

    if (!data || !data.path) {
      console.error('No data returned from upload');
      return null;
    }

    console.log('Successfully uploaded base64 image:', data.path);
    
    // Return the public URL
    return getImageUrl(data.path);
  } catch (error) {
    console.error('Error uploading base64 image:', error);
    return null;
  }
};

// Delete image
export const deleteImage = async (path: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove([path]);

    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

// Helper function to get content type from filename
const getContentType = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg'; // Default
  }
};

// Generate a unique filename
export const generateUniqueFileName = (indexOrName: string | number = 'image.jpg'): string => {
  let extension = 'jpg';
  
  if (typeof indexOrName === 'string') {
    extension = indexOrName.split('.').pop() || 'jpg';
  }
  
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  const indexSuffix = typeof indexOrName === 'number' ? `-${indexOrName}` : '';
  
  return `${timestamp}${indexSuffix}-${randomString}.${extension}`;
}; 