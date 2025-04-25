/**
 * CustomCat API integration service
 * 
 * Based on CustomCat API V1.0 documentation
 * Base URL: https://customcat-beta.mylocker.net/api/v1/
 */

/**
 * Core CustomCat API configuration
 */
const API_BASE_URL = 'https://customcat-beta.mylocker.net/api/v1';

/**
 * Fetch products from CustomCat API using the catalog endpoint
 * This maintains all sizing and art placement details from the original products
 * 
 * @param apiKey The CustomCat API key
 * @returns An object with products and success/error information
 */
export async function fetchCustomCatProducts(apiKey: string) {
  if (!apiKey || apiKey.trim().length === 0) {
    return {
      success: false,
      message: "API key is required",
      errors: {
        general: "Missing API key"
      }
    };
  }

  // Prepare result object
  const result = {
    success: false,
    connectionSucceeded: false,
    successfulEndpoint: null as any,
    products: [] as any[],
    errors: {} as Record<string, string>
  };

  try {
    // Configure the main catalog endpoint with query parameters
    // According to the API documentation, this should be sent as query parameters
    const url = new URL(`${API_BASE_URL}/catalog`);
    url.searchParams.append('api_key', apiKey);
    url.searchParams.append('category', 'Digisoft'); // Default category
    url.searchParams.append('limit', '100'); // Increased limit for more products
    
    console.log(`Connecting to CustomCat catalog API: ${url.toString().replace(apiKey, '***API_KEY***')}`);
    
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json"
      },
      signal: AbortSignal.timeout(20000) // 20 second timeout
    });
    
    if (response.ok) {
      const responseData = await response.json();
      result.products = Array.isArray(responseData) ? responseData : [];
      
      // Store the total count if available in headers
      const totalCount = response.headers.get('X-Total-Count');
      if (totalCount) {
        console.log(`Total products available: ${totalCount}`);
      }
      
      result.connectionSucceeded = true;
      result.success = true;
      result.successfulEndpoint = { name: 'CustomCat Catalog', url: API_BASE_URL + '/catalog' };
      
      console.log(`✅ Successfully retrieved ${result.products.length} products from CustomCat`);
    } else {
      // Handle error response
      let errorMessage = `API Error (${response.status})`;
      
      try {
        const errorData = await response.json();
        if (errorData.message || errorData.error) {
          errorMessage = errorData.message || errorData.error || errorMessage;
        }
      } catch {
        // If we can't parse the error JSON, use the HTTP status message
        errorMessage = `HTTP Error: ${response.statusText || response.status}`;
      }
      
      result.errors['catalog'] = errorMessage;
      console.error(`❌ CustomCat API error: ${errorMessage}`);
      
      // Try the catalog category endpoint as fallback
      try {
        const categoryUrl = new URL(`${API_BASE_URL}/catalogcategory`);
        categoryUrl.searchParams.append('api_key', apiKey);
        
        console.log(`Trying fallback endpoint: catalogcategory`);
        
        const categoryResponse = await fetch(categoryUrl.toString(), {
          method: "GET",
          headers: {
            "Accept": "application/json"
          },
          signal: AbortSignal.timeout(10000)
        });
        
        if (categoryResponse.ok) {
          const categoryData = await categoryResponse.json();
          console.log(`✅ Connected to CustomCat category API successfully`);
          
          // We connected, but we don't have products yet
          result.connectionSucceeded = true;
          result.success = true;
          result.successfulEndpoint = { name: 'CustomCat Category', url: API_BASE_URL + '/catalogcategory' };
          
          // We can't get products directly from this endpoint
          result.products = [];
        }
      } catch (fallbackError) {
        const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        result.errors['catalogcategory'] = fallbackErrorMessage;
      }
    }
  } catch (error) {
    // Network or other errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error connecting to CustomCat API:`, errorMessage);
    result.errors['network'] = errorMessage;
  }

  return result;
}