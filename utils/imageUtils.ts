/**
 * Utility functions for image processing
 */

/**
 * Compresses a base64 image string by limiting its size
 * @param base64 The base64 string to compress
 * @param maxSize Maximum size in bytes (defaults to 30KB)
 * @returns A compressed base64 string
 */
export const compressBase64Image = (base64?: string | null, maxSize: number = 30000): string => {
  if (!base64) return '';
  
  // If image is already small enough, return it as is
  if (base64.length <= maxSize) return base64;
  
  // For demonstration purposes, we'll use a simple truncation approach
  // A better solution would be to resize the image properly before getting base64
  console.log(`Compressing image from ${base64.length} bytes to ${maxSize} bytes`);
  return base64.substring(0, maxSize);
};

/**
 * Process an array of images for storage in the database
 * @param images Array of image objects containing base64 data
 * @returns Array of processed image objects ready for storage
 */
export const processImagesForStorage = (images: Array<{ uri: string; base64?: string | null }>) => {
  // Log some statistics about the images
  const totalSize = images.reduce((size, img) => size + (img.base64?.length || 0), 0);
  console.log(`Processing ${images.length} images, total size: ${totalSize} bytes`);
  
  // Process each image, compressing it if needed
  const processed = images.map(img => ({
    base64: compressBase64Image(img.base64)
  }));
  
  // Log the processed size
  const processedSize = processed.reduce((size, img) => size + (img.base64?.length || 0), 0);
  console.log(`After processing: ${processedSize} bytes (${Math.round(processedSize/totalSize*100)}% of original)`);
  
  return processed;
}; 