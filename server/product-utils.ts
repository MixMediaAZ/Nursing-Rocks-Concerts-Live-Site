/**
 * Utility functions for product data processing
 * 
 * CustomCat API integration - Preserves sizing and art placement details
 */

import { StoreProduct } from '@shared/schema';

/**
 * Process a CustomCat product to ensure image URLs are properly set
 * Extracts image URLs from the CustomCat API response
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
  if (product.metadata && typeof product.metadata === 'object') {
    const metadata = product.metadata;
    
    // First, try to get images directly from the CustomCat API response format
    if (metadata.colors && Array.isArray(metadata.colors) && metadata.colors.length > 0) {
      const firstColor = metadata.colors[0];
      if (firstColor && firstColor.image) {
        processedProduct.image_url = ensureHttps(firstColor.image);
      }
    }
    
    // If we still don't have an image, check if there's a direct image property
    if (!processedProduct.image_url && metadata.image) {
      processedProduct.image_url = ensureHttps(metadata.image);
    }
    
    // Legacy check for customcat_original (old API format)
    if (!processedProduct.image_url && metadata.customcat_original) {
      const originalData = metadata.customcat_original;
      
      if (originalData.product_image) {
        processedProduct.image_url = ensureHttps(originalData.product_image);
      }
      
      if (originalData.back_image) {
        processedProduct.thumbnail_url = ensureHttps(originalData.back_image);
      }
      
      // Try to get images from product_colors in the original data
      if (!processedProduct.image_url && originalData.product_colors && 
          Array.isArray(originalData.product_colors) && originalData.product_colors.length > 0) {
        
        const firstColorWithImage = originalData.product_colors.find(
          (color: any) => color.product_image
        );
        
        if (firstColorWithImage) {
          processedProduct.image_url = ensureHttps(firstColorWithImage.product_image);
          
          if (firstColorWithImage.back_image) {
            processedProduct.thumbnail_url = ensureHttps(firstColorWithImage.back_image);
          }
        }
      }
    } 
    // Legacy check for customcat_data (old API format)
    else if (!processedProduct.image_url && metadata.customcat_data &&
        Array.isArray(metadata.customcat_data.product_colors) && 
        metadata.customcat_data.product_colors.length > 0) {
      
      const firstColorWithImage = metadata.customcat_data.product_colors.find(
        (color: any) => color.product_image
      );
      
      if (firstColorWithImage) {
        processedProduct.image_url = ensureHttps(firstColorWithImage.product_image);
        
        if (firstColorWithImage.back_image) {
          processedProduct.thumbnail_url = ensureHttps(firstColorWithImage.back_image);
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
  if (!Array.isArray(products)) return [];
  return products.map(product => processCustomCatProductImages(product));
}

/**
 * Format a raw CustomCat API product to match our database schema
 * Preserves all CustomCat data including sizing and art placement details
 * 
 * @param customCatProduct Raw product data from CustomCat API
 * @returns Formatted store product ready for database storage
 */
export function formatCustomCatProduct(customCatProduct: any): StoreProduct | null {
  if (!customCatProduct) return null;

  try {
    // Extract the ID - different endpoints use different properties
    // Some products have the ID in the root object, others embedded within
    const id = customCatProduct.catalog_product_id || 
               customCatProduct.id || 
               customCatProduct.product_id;
               
    // Special case: If it's a product with missing ID and we're logging that, use the value from the log
    if (!id && customCatProduct.hasOwnProperty('catalog_product_id')) {
      // We have a valid ID field but it might be undefined or null, try to use it anyway
      console.log(`Found product with undefined catalog_product_id, using as-is:`, 
                 customCatProduct.product_name || customCatProduct.name || 'Unknown product');
      return createProductWithId(customCatProduct, customCatProduct.catalog_product_id);
    }
    
    if (!id) {
      console.log('Skipping CustomCat product without ID');
      return null;
    }

    // Create a new product based on our StoreProduct schema
    const product: StoreProduct = {
      id: 0, // Will be assigned by database
      name: customCatProduct.name || customCatProduct.product_name || 'CustomCat Product',
      description: customCatProduct.description || null,
      price: customCatProduct.base_cost ? 
             parseFloat(customCatProduct.base_cost).toFixed(2) : 
             '19.99',
      image_url: null,
      category: customCatProduct.category || customCatProduct.subcategory || 'Apparel',
      is_featured: false,
      created_at: new Date(),
      updated_at: new Date(),
      metadata: customCatProduct, // Store the complete CustomCat data to preserve all details
      external_id: id.toString(),
      external_source: 'customcat',
      is_available: customCatProduct.in_stock !== false,
      stock_quantity: customCatProduct.quantity ? parseInt(customCatProduct.quantity, 10) : null
    };

    // Extract the image URL based on CustomCat API format
    if (customCatProduct.colors && 
        Array.isArray(customCatProduct.colors) && 
        customCatProduct.colors.length > 0) {
      const firstColor = customCatProduct.colors[0];
      if (firstColor && firstColor.image) {
        product.image_url = ensureHttps(firstColor.image);
      }
    }
    
    // Fallback for direct image property
    if (!product.image_url && customCatProduct.image) {
      product.image_url = ensureHttps(customCatProduct.image);
    }

    return product;
  } catch (error) {
    console.error(`Error formatting CustomCat product:`, error);
    return null;
  }
}

/**
 * Format an array of raw CustomCat API products
 * 
 * @param customCatProducts Array of raw products from CustomCat API
 * @returns Array of formatted store products ready for database storage
 */
export function formatCustomCatProducts(customCatProducts: any[]): StoreProduct[] {
  if (!Array.isArray(customCatProducts)) {
    console.warn('CustomCat products is not an array:', typeof customCatProducts);
    return [];
  }
  
  const formattedProducts = customCatProducts
    .map(product => formatCustomCatProduct(product))
    .filter(Boolean) as StoreProduct[];
  
  console.log(`Formatted ${formattedProducts.length} of ${customCatProducts.length} CustomCat products`);
  
  return formattedProducts;
}

/**
 * Extract color options from CustomCat product metadata
 * 
 * @param product Store product with CustomCat metadata
 * @returns Array of available color names
 */
export function extractProductColors(product: StoreProduct): string[] {
  if (!product || !product.metadata) return [];
  
  try {
    const metadata = typeof product.metadata === 'string' 
      ? JSON.parse(product.metadata) 
      : product.metadata;
    
    // Check for colors in new API format
    if (metadata.colors && Array.isArray(metadata.colors)) {
      return metadata.colors
        .map((color: any) => color.color_name || color.name || '')
        .filter(Boolean);
    }
    
    // Legacy check for customcat_data format
    if (metadata.customcat_data && 
        metadata.customcat_data.product_colors && 
        Array.isArray(metadata.customcat_data.product_colors)) {
      return metadata.customcat_data.product_colors
        .map((color: any) => color.color_name || '')
        .filter(Boolean);
    }
    
    return [];
  } catch (error) {
    console.error(`Error extracting colors for product ID ${product.id}:`, error);
    return [];
  }
}

/**
 * Helper function to create a product with a specific ID for cases where the catalog_product_id exists
 * but might be null/undefined but we want to use it anyway for continuity
 */
function createProductWithId(customCatProduct: any, id: any): StoreProduct | null {
  try {
    const externalId = id ? id.toString() : `customcat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Create a store product with the CustomCat data
    const product: StoreProduct = {
      id: 0, // Will be assigned by database
      name: customCatProduct.product_name || customCatProduct.name || 'CustomCat Product',
      description: customCatProduct.product_description_bullet1 || null,
      price: customCatProduct.base_cost ? 
             parseFloat(customCatProduct.base_cost).toFixed(2) : 
             '24.99',
      image_url: null,
      category: customCatProduct.subcategory || customCatProduct.category || 'Apparel',
      is_featured: false,
      created_at: new Date(),
      updated_at: new Date(),
      metadata: customCatProduct, // Store the complete CustomCat data for art placement details
      external_id: externalId,
      external_source: 'customcat',
      is_available: true,
      stock_quantity: customCatProduct.quantity ? parseInt(customCatProduct.quantity, 10) : null
    };
    
    // Handle special case for product_colors array
    if (customCatProduct.product_colors && 
        Array.isArray(customCatProduct.product_colors) && 
        customCatProduct.product_colors.length > 0) {
      const firstColor = customCatProduct.product_colors[0];
      if (firstColor && firstColor.product_image) {
        product.image_url = ensureHttps(firstColor.product_image);
      }
    }
    
    // Combine description bullets if available
    let fullDescription = '';
    for (let i = 1; i <= 5; i++) {
      const bulletKey = `product_description_bullet${i}`;
      if (customCatProduct[bulletKey]) {
        fullDescription += `• ${customCatProduct[bulletKey]}\n`;
      }
    }
    
    if (fullDescription) {
      product.description = fullDescription.trim();
    }
    
    return product;
  } catch (error) {
    console.error('Error creating product with catalog ID:', error);
    return null;
  }
}

/**
 * Ensure URL starts with https:// instead of // for consistent image loading
 */
function ensureHttps(url: string): string {
  if (!url) return url;
  if (url.startsWith('//')) {
    return 'https:' + url;
  }
  return url;
}