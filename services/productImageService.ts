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
 * Delete all images in a product folder
 * 
 * @param productId The product ID whose images should be deleted
 * @returns Promise<boolean> indicating success
 */
export const deleteProductImages = async (productId: string): Promise<boolean> => {
  try {
    console.log(`Deleting all images for product ${productId}`);
    
    // First list all files in the product folder
    const { data: fileList, error: listError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .list(productId);
    
    if (listError) {
      console.error(`Error listing files for product ${productId}:`, listError);
      return false;
    }
    
    if (!fileList || fileList.length === 0) {
      console.log(`No images found for product ${productId}`);
      return true;
    }
    
    // Create an array of paths to delete
    const filePaths = fileList.map(file => `${productId}/${file.name}`);
    console.log(`Found ${filePaths.length} images to delete:`, filePaths);
    
    // Delete all files in the folder
    const { error: deleteError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove(filePaths);
    
    if (deleteError) {
      console.error(`Error deleting images for product ${productId}:`, deleteError);
      return false;
    }
    
    console.log(`Successfully deleted ${filePaths.length} images for product ${productId}`);
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
    
    // Filter out empty images
    const validImages = images.filter(img => {
      if (!img) {
        console.warn("Empty image found, skipping");
        return false;
      }
      
      if (img.startsWith('data:')) {
        const base64Match = img.match(/base64,(.+)/);
        if (!base64Match || !base64Match[1] || base64Match[1].trim().length === 0) {
          console.warn("Image has empty base64 data, skipping");
          return false;
        }
      }
      
      return true;
    });
    
    console.log(`Found ${validImages.length} valid images out of ${images.length}`);
    
    if (validImages.length === 0) {
      console.warn("No valid images to upload");
      return [];
    }
    
    // Delete old images if requested
    if (shouldDeleteOld) {
      console.log(`Deleting old images for product ${productId}`);
      const deleteResult = await deleteProductImages(productId);
      if (!deleteResult) {
        console.warn(`Failed to delete old images for product ${productId}, but continuing with upload`);
      }
    }
    
    // Upload new images
    return await uploadProductImages(productId, validImages);
  } catch (error) {
    console.error(`Error updating images for product ${productId}:`, error);
    return [];
  }
}; 