import { supabase } from './supabase';
import { createProductImagesBucket, PRODUCT_IMAGES_BUCKET } from './storage';

// Initialize storage bucket and set up permissions
export const initializeStorage = async () => {
  try {
    console.log('Initializing storage...');
    
    // Create bucket if it doesn't exist
    await createProductImagesBucket();
    
    // Set up RLS policy in Supabase
    await setupStoragePermissions();
    
    console.log('Storage initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing storage:', error);
    // Return true anyway to allow app to continue
    return true;
  }
};

// Set up storage permissions to allow uploads without authentication
export const setupStoragePermissions = async () => {
  try {
    console.log('Setting up storage permissions...');
    
    // Attempt to create a public access policy for the bucket
    await supabase.rpc('setup_storage_policy', { bucket_name: PRODUCT_IMAGES_BUCKET })
      .then(({ data, error }) => {
        if (error) {
          console.log('Error setting up storage policy via RPC:', error);
          console.log('This is normal if the function does not exist in Supabase');
        } else {
          console.log('Storage policy setup result:', data);
        }
      });
    
    // Try an alternative approach to make the bucket public
    const { data: bucketData, error: bucketError } = await supabase.storage.getBucket(PRODUCT_IMAGES_BUCKET);
    if (bucketError) {
      console.error('Error getting bucket:', bucketError);
    } else {
      console.log('Bucket info:', bucketData);
      
      // Update bucket to be public if it's not already
      if (!bucketData.public) {
        console.log('Setting bucket to public...');
        
        // Try to update the bucket to be public
        const { error: updateError } = await supabase.storage.updateBucket(
          PRODUCT_IMAGES_BUCKET, 
          { public: true }
        );
        
        if (updateError) {
          console.error('Error updating bucket to public:', updateError);
        } else {
          console.log('Bucket is now public');
        }
      } else {
        console.log('Bucket is already public');
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error setting up storage permissions:', error);
    return false;
  }
}; 