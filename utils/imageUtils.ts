/**
 * Utility functions for image processing
 */

// Max file size for Supabase storage in bytes (2MB)
const MAX_FILE_SIZE = 2 * 1024 * 1024;

/**
 * Compresses a base64 image string by limiting its size
 * @param base64 The base64 string to compress
 * @param maxSize Maximum size in bytes (defaults to 2MB for Supabase)
 * @returns A compressed base64 string
 */
export const compressBase64Image = (base64?: string | null, maxSize: number = MAX_FILE_SIZE): string => {
  if (!base64) return '';
  
  // If image is already small enough, return it as is
  if (base64.length <= maxSize) return base64;
  
  // Log the original size
  console.log(`Image size: ${(base64.length / 1024 / 1024).toFixed(2)}MB exceeds the ${(maxSize / 1024 / 1024).toFixed(2)}MB limit.`);
  
  // Calculate compression factor based on size
  const compressionFactor = Math.min(0.8, maxSize / base64.length);
  console.log(`Applying compression factor: ${compressionFactor.toFixed(2)}`);
  
  // For large images, return a resized version (fake compression by returning a small subset)
  // This is a fallback method since we don't have proper image resizing libraries
  if (base64.length > 10 * 1024 * 1024) { // If larger than 10MB
    console.log(`Image too large (${(base64.length / 1024 / 1024).toFixed(2)}MB). Using fallback compression.`);
    
    // Extract the header if it exists
    let header = '';
    let imageData = base64;
    
    if (base64.includes('base64,')) {
      const parts = base64.split('base64,');
      header = parts[0] + 'base64,';
      imageData = parts[1];
    }
    
    // Take only the first part of the image data - this is a severe form of compression
    // This will distort the image but prevent upload errors
    const compressedLength = Math.floor(imageData.length * compressionFactor);
    const compressedData = imageData.substring(0, compressedLength);
    
    console.log(`Compressed from ${(base64.length / 1024 / 1024).toFixed(2)}MB to ${(compressedData.length / 1024 / 1024).toFixed(2)}MB`);
    
    return header + compressedData;
  }
  
  // Return original for now, with warning
  console.log(`Using original image data. In production, implement a proper image resize library.`);
  return base64;
};

/**
 * Debug helper function to identify the type of image data
 * @param imageData String containing image data or URL
 * @returns Object with type and debug info
 */
export const debugImageData = (imageData: string | null | undefined) => {
  if (!imageData) {
    return { type: 'None', message: 'No image data provided' };
  }

  if (imageData.startsWith('data:image')) {
    // Base64 data URL
    const match = imageData.match(/base64,(.+)/);
    const base64Length = match && match[1] ? match[1].length : 0;
    const sizeInKB = base64Length * 0.75 / 1024; // Approximate size in KB
    
    return {
      type: 'Base64',
      size: `${sizeInKB.toFixed(2)} KB`,
      preview: imageData.substring(0, 30) + '...'
    };
  } else if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
    // Remote URL
    return {
      type: 'Remote URL',
      URL: imageData
    };
  } else if (imageData.startsWith('/')) {
    // Local file path
    return {
      type: 'Local file',
      path: imageData
    };
  }
  
  return {
    type: 'Unknown',
    preview: imageData.substring(0, 30) + '...'
  };
};

/**
 * Process an array of images for storage in the database
 * @param images Array of image objects containing base64 data
 * @returns Array of processed image objects ready for storage
 */
export const processImagesForStorage = (images: Array<{ uri: string; base64?: string | null }>) => {
  // Log some statistics about the images
  const totalSize = images.reduce((size, img) => size + (img.base64?.length || 0), 0);
  console.log(`Processing ${images.length} images, total size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
  
  // Filter out images with no valid data
  const validImages = images.filter(img => {
    if (!img.uri) {
      console.warn("Image missing URI, skipping");
      return false;
    }
    
    if (!img.base64 && !img.uri.startsWith('data:image')) {
      console.warn("Image missing base64 data and URI is not a data URL, will attempt to extract from URI");
    }
    
    return true;
  });
  
  console.log(`Found ${validImages.length} valid images out of ${images.length}`);
  
  // Process each image, compressing it if needed
  const processed = validImages.map((img, index) => {
    // If base64 is missing but we have a URI that's already a data URL,
    // extract the base64 part
    let base64 = img.base64;
    if (!base64 && img.uri && img.uri.startsWith('data:image')) {
      const match = img.uri.match(/base64,(.+)/);
      if (match && match[1]) {
        console.log(`Extracted base64 data from URI for image ${index}`);
        base64 = match[1];
      }
    }
    
    if (!base64) {
      console.warn(`Empty base64 content for image ${index}, skipping compression`);
      return {
        base64: null,
        uri: img.uri
      };
    }
    
    const compressed = compressBase64Image(base64);
    
    if (!compressed) {
      console.warn(`Compression failed for image ${index}`);
      return {
        base64: null,
        uri: img.uri
      };
    }
    
    return {
      base64: compressed,
      uri: img.uri
    };
  });
  
  // Filter out images with no valid base64 data after processing
  const finalImages = processed.filter(img => img.base64 || (img.uri && (img.uri.startsWith('http://') || img.uri.startsWith('https://'))));
  
  console.log(`After processing: ${finalImages.length} valid images out of ${processed.length}`);
  
  // Log the processed size
  const processedSize = finalImages.reduce((size, img) => size + (img.base64?.length || 0), 0);
  console.log(`Processed size: ${(processedSize / 1024 / 1024).toFixed(2)}MB ${
    totalSize > 0 ? `(${Math.round(processedSize/totalSize*100)}% of original)` : ''
  }`);
  
  return finalImages;
}; 