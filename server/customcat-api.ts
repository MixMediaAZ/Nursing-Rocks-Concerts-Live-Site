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

  console.log(`📝 CustomCat API key length: ${apiKey.length} characters`);
  console.log(`📝 CustomCat API key first/last few chars: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);

  // Try multiple endpoints from our configuration
  const endpointsToTry = [
    // Main endpoint with default category
    {
      url: `${API_BASE_URL}/catalog`,
      params: { category: 'Apparel', limit: '50' }
    },
    // Backup with a different category
    {
      url: `${API_BASE_URL}/catalog`,
      params: { category: 'T-Shirts', limit: '50' }
    },
    // Try without category filter
    {
      url: `${API_BASE_URL}/catalog`,
      params: { limit: '50' }
    },
    // Last resort - just try category list
    {
      url: `${API_BASE_URL}/catalogcategory`,
      params: {}
    }
  ];

  // Try each endpoint until we get a successful response
  for (const endpoint of endpointsToTry) {
    try {
      const url = new URL(endpoint.url);
      url.searchParams.append('api_key', apiKey);
      
      // Add any additional params
      for (const [key, value] of Object.entries(endpoint.params)) {
        url.searchParams.append(key, value);
      }
      
      const maskedUrl = url.toString().replace(apiKey, '***API_KEY***');
      console.log(`🔄 Trying CustomCat endpoint: ${maskedUrl}`);
      
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });
      
      console.log(`📊 CustomCat API response status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const responseText = await response.text();
        console.log(`📄 CustomCat API response (first 200 chars): ${responseText.substring(0, 200)}...`);
        
        const responseData = JSON.parse(responseText);
        result.products = Array.isArray(responseData) ? responseData : [];
        
        // Store the total count if available in headers
        const totalCount = response.headers.get('X-Total-Count');
        if (totalCount) {
          console.log(`📈 Total products available: ${totalCount}`);
        }
        
        result.connectionSucceeded = true;
        result.success = true;
        result.successfulEndpoint = { 
          name: 'CustomCat API', 
          url: endpoint.url,
          params: endpoint.params
        };
        
        console.log(`✅ Successfully retrieved ${result.products.length} products from CustomCat`);
        
        // We got a successful response, no need to try other endpoints
        break;
      } else {
        // Handle error response
        let errorMessage = `API Error (${response.status})`;
        let errorData = {};
        
        try {
          const errorText = await response.text();
          console.log(`❌ CustomCat API error response: ${errorText}`);
          
          try {
            errorData = JSON.parse(errorText);
            if (errorData.message || errorData.error) {
              errorMessage = errorData.message || errorData.error || errorMessage;
            }
          } catch {
            // If we can't parse as JSON, use the raw text
            errorMessage = errorText || errorMessage;
          }
        } catch {
          // If we can't get response text, use the HTTP status
          errorMessage = `HTTP Error: ${response.statusText || response.status}`;
        }
        
        const endpointKey = new URL(endpoint.url).pathname.split('/').pop() || 'endpoint';
        result.errors[endpointKey] = errorMessage;
        console.error(`❌ CustomCat API error: ${errorMessage}`);
      }
    } catch (error) {
      // Network or other errors for this endpoint
      const errorMessage = error instanceof Error ? error.message : String(error);
      const endpointKey = new URL(endpoint.url).pathname.split('/').pop() || 'endpoint';
      result.errors[endpointKey] = errorMessage;
      console.error(`❌ Error with CustomCat endpoint ${endpoint.url}:`, errorMessage);
    }
  }

  return result;
}