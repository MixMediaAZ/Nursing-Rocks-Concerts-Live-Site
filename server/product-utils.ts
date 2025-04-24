/**
 * Utility functions for product data processing
 */

import { StoreProduct } from '@shared/schema';

/**
 * Process a CustomCat product to ensure image URLs are properly set
 * Extracts image URLs from metadata.customcat_data.product_colors
 * 
 * @param product The CustomCat product to process
 * @returns A new product object with image URLs set
 */
export function processCustomCatProductImages(product: StoreProduct): StoreProduct {
  // Make a copy of the product to avoid modifying the original
  const processedProduct = { ...product };
  
  // Skip processing if not a CustomCat product
  if (product.external_source !== 'customcat') {
    return processedProduct;
  }
  
  // Extract image from metadata if available
  if (product.metadata && 
      typeof product.metadata === 'object') {
    
    // Check for the original complete data first - this ensures all art proportions are preserved
    if (product.metadata.customcat_original) {
      // If we have the full original object, use those image URLs directly
      // This preserves all artwork settings, proportions, and positions
      const originalData = product.metadata.customcat_original;
      
      // Set the main image
      if (originalData.product_image) {
        let imageUrl = originalData.product_image;
        if (imageUrl.startsWith('//')) {
          imageUrl = 'https:' + imageUrl;
        }
        processedProduct.image_url = imageUrl;
      }
      
      // Set the back image if available
      if (originalData.back_image) {
        let backImageUrl = originalData.back_image;
        if (backImageUrl.startsWith('//')) {
          backImageUrl = 'https:' + backImageUrl;
        }
        processedProduct.thumbnail_url = backImageUrl;
      }
      
      // Try to get images from product_colors in the original data
      if (!processedProduct.image_url && originalData.product_colors && 
          Array.isArray(originalData.product_colors) && originalData.product_colors.length > 0) {
        
        const firstColorWithImage = originalData.product_colors.find(
          (color: any) => color.product_image
        );
        
        if (firstColorWithImage) {
          let imageUrl = firstColorWithImage.product_image;
          if (imageUrl.startsWith('//')) {
            imageUrl = 'https:' + imageUrl;
          }
          processedProduct.image_url = imageUrl;
          
          if (firstColorWithImage.back_image) {
            let backImageUrl = firstColorWithImage.back_image;
            if (backImageUrl.startsWith('//')) {
              backImageUrl = 'https:' + backImageUrl;
            }
            processedProduct.thumbnail_url = backImageUrl;
          }
        }
      }
    } 
    // Fall back to using customcat_data if original data isn't available
    else if (product.metadata.customcat_data &&
        Array.isArray(product.metadata.customcat_data.product_colors) && 
        product.metadata.customcat_data.product_colors.length > 0) {
      
      // Get the first available color with an image
      const firstColorWithImage = product.metadata.customcat_data.product_colors.find(
        color => color.product_image
      );
      
      if (firstColorWithImage) {
        // Fix image URL by adding https: if needed
        let imageUrl = firstColorWithImage.product_image;
        if (imageUrl.startsWith('//')) {
          imageUrl = 'https:' + imageUrl;
        }
        processedProduct.image_url = imageUrl;
        
        // If there's a back image, save it to thumbnail_url
        if (firstColorWithImage.back_image) {
          let backImageUrl = firstColorWithImage.back_image;
          if (backImageUrl.startsWith('//')) {
            backImageUrl = 'https:' + backImageUrl;
          }
          processedProduct.thumbnail_url = backImageUrl;
        }
      }
    }
  }
  
  return processedProduct;
}

/**
 * Process an array of CustomCat products to ensure image URLs are properly set
 * 
 * @param products Array of products to process
 * @returns A new array of products with image URLs set
 */
export function processCustomCatProductsImages(products: StoreProduct[]): StoreProduct[] {
  return products.map(product => processCustomCatProductImages(product));
}