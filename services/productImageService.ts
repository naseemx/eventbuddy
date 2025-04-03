import { supabase } from '../lib/supabase';
import {
  uploadImageFromUri,
  uploadBase64Image,
  deleteImage,
  generateUniqueFileName,
  PRODUCT_IMAGES_BUCKET
} from '../lib/storage';

/**
 * Upload product images and return array of image URLs
 * 
 * @param productId The product ID to associate images with
 * @param images Array of base64 images or local URIs
 * @returns Array of public URLs to the uploaded images
 */
export const uploadProductImages = async (
  productId: string,
  images: string[] // Array of base64 images or local URIs
): Promise<string[]> => {
  try {
    console.log(`Starting uploadProductImages for product ${productId}, ${images.length} images`);
    const uploadedUrls: string[] = [];
    const uniqueUrls = new Set<string>(); // To track and prevent duplicate URLs
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      
      // Skip empty images
      if (!image) {
        console.warn(`Image ${i} is empty, skipping`);
        continue;
      }

      const fileName = generateUniqueFileName(i);
      const folder = productId;
      
      console.log(`Processing image ${i} with filename ${fileName}`);
      
      // Determine if image is a base64 string or a local URI
      let imageUrl;
      if (image.startsWith('data:')) {
        // Extract the base64 part to make sure it's not empty
        const base64Match = image.match(/base64,(.+)/);
        if (!base64Match || !base64Match[1] || base64Match[1].trim().length === 0) {
          console.warn(`Image ${i} has empty base64 data, skipping`);
          continue;
        }
        
        // Base64 image
        console.log(`Uploading base64 image ${i}`);
        imageUrl = await uploadBase64Image(image, folder, fileName);
      } else {
        // Local URI
        console.log(`Uploading local URI image ${i}`);
        imageUrl = await uploadImageFromUri(image, folder, fileName);
      }
      
      if (imageUrl) {
        // Only add the URL if it's not already in the set
        if (!uniqueUrls.has(imageUrl)) {
          console.log(`Successfully uploaded image ${i}, URL: ${imageUrl}`);
          uploadedUrls.push(imageUrl);
          uniqueUrls.add(imageUrl);
        } else {
          console.warn(`Duplicate URL detected for image ${i}, skipping`);
        }
      } else {
        console.error(`Failed to upload image ${i}`);
      }
    }
    
    console.log(`Finished uploading ${uploadedUrls.length} images for product ${productId}`);
    return uploadedUrls;
  } catch (error) {
    console.error('Error uploading product images:', error);
    return [];
  }
};

/**
 * Delete all product images from storage
 * 
 * @param productId The product ID to delete images for
 * @param excludeFiles Optional array of filenames to exclude from deletion
 * @returns True if deletion was successful
 */
export const deleteProductImages = async (
  productId: string,
  excludeFiles: string[] = []
): Promise<boolean> => {
  try {
    console.log(`Deleting all images for product ${productId}${excludeFiles.length > 0 ? ' except ' + excludeFiles.length + ' files' : ''}`);
    
    // List all files in the product folder
    const { data, error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .list(productId);
    
    if (error) {
      console.error(`Error listing images for product ${productId}:`, error);
      return false;
    }
    
    if (!data || data.length === 0) {
      console.log(`No images found for product ${productId}`);
      return true; // Nothing to delete
    }
    
    // Extract filenames only
    const filesToDelete = data
      .map(item => `${productId}/${item.name}`)
      .filter(path => !excludeFiles.includes(path));
    
    console.log(`Found ${filesToDelete.length} images to delete: ${JSON.stringify(filesToDelete)}`);
    
    if (filesToDelete.length === 0) {
      console.log(`No images to delete after applying exclusions`);
      return true;
    }
    
    // Delete the files
    const { error: deleteError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove(filesToDelete);
    
    if (deleteError) {
      console.error(`Error deleting images for product ${productId}:`, deleteError);
      return false;
    }
    
    console.log(`Successfully deleted ${filesToDelete.length} images for product ${productId}`);
    return true;
  } catch (error) {
    console.error(`Error in deleteProductImages for ${productId}:`, error);
    return false;
  }
};

/**
 * Update product images - deletes old images and uploads new ones
 * 
 * @param productId The product ID to update images for
 * @param images New images to upload (base64 or URIs)
 * @param shouldDeleteOld Whether to delete the old images first
 * @returns Array of new image URLs
 */
export const updateProductImages = async (
  productId: string,
  images: string[],
  shouldDeleteOld: boolean = true
): Promise<string[]> => {
  try {
    console.log(`Updating images for product ${productId}, ${images.length} images, shouldDeleteOld: ${shouldDeleteOld}`);
    
    // Separate remote URLs and images that need uploading
    const remoteUrls: string[] = [];
    const imagesToUpload: string[] = [];
    
    // Filter and categorize images
    images.forEach(img => {
      if (!img) {
        console.warn("Empty image found, skipping");
        return;
      }
      
      // If it's already a remote URL from our storage system, keep it as is
      if (img.startsWith('http://') || img.startsWith('https://')) {
        // Check if it's from our storage system
        if (img.includes('/storage/v1/object/public/product-images/')) {
          console.log("Found existing remote URL, preserving it");
          remoteUrls.push(img);
          return;
        }
      }
      
      // If it's a data URL, verify it has valid base64 data
      if (img.startsWith('data:')) {
        const base64Match = img.match(/base64,(.+)/);
        if (!base64Match || !base64Match[1] || base64Match[1].trim().length === 0) {
          console.warn("Image has empty base64 data, skipping");
          return;
        }
        imagesToUpload.push(img);
        return;
      }
      
      // For any other type of valid URL, add it to upload
      imagesToUpload.push(img);
    });
    
    console.log(`Found ${remoteUrls.length} existing URLs to preserve and ${imagesToUpload.length} images to upload`);
    
    // If everything is already a remote URL and there's nothing to upload, just return the URLs
    if (imagesToUpload.length === 0 && remoteUrls.length > 0) {
      console.log("No new images to upload, using existing URLs");
      return remoteUrls;
    }
    
    // Delete old images only if we're uploading new ones
    if (shouldDeleteOld && imagesToUpload.length > 0) {
      console.log(`Deleting old images for product ${productId}`);
      
      // Extract filenames from remote URLs we want to preserve
      const preserveFilenames = remoteUrls.map(url => {
        // Extract the filename from the URL
        const matches = url.match(/\/product-images\/([^?]+)/);
        return matches ? matches[1] : '';
      }).filter(filename => filename);
      
      console.log(`Preserving ${preserveFilenames.length} existing images: ${JSON.stringify(preserveFilenames)}`);
      
      const deleteResult = await deleteProductImages(productId, preserveFilenames);
      if (!deleteResult) {
        console.warn(`Failed to delete old images for product ${productId}, but continuing with upload`);
      }
    }
    
    // If we have images to upload, do so
    let uploadedUrls: string[] = [];
    if (imagesToUpload.length > 0) {
      uploadedUrls = await uploadProductImages(productId, imagesToUpload);
    }
    
    // Combine preserved remote URLs with newly uploaded ones
    const allUrls = [...remoteUrls, ...uploadedUrls];
    console.log(`Final image URLs count: ${allUrls.length}`);
    
    return allUrls;
  } catch (error) {
    console.error(`Error updating images for product ${productId}:`, error);
    return [];
  }
}; 