/**
 * CustomCat API integration service
 */
import { customCatEndpoints } from "./customcat-endpoints";

/**
 * Fetch products from CustomCat API
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

  // Try each endpoint sequentially
  for (const endpoint of customCatEndpoints) {
    if (result.connectionSucceeded) break; // Stop if we already found a working endpoint
    
    try {
      console.log(`Attempting to connect to ${endpoint.name}: ${endpoint.url}`);
      
      // Build the URL with query parameters
      const url = new URL(endpoint.url);
      
      // Add API key as query parameter (this is what the CustomCat API documentation specifies)
      url.searchParams.append('api_key', apiKey);
      
      // Add any extra parameters if specified
      if (endpoint.extraParams) {
        Object.entries(endpoint.extraParams).forEach(([key, value]) => {
          url.searchParams.append(key, String(value));
        });
      }
      
      console.log(`Sending request to: ${url.toString()}`);
      
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        signal: AbortSignal.timeout(5000) // slightly longer timeout for API calls
      });
      
      if (response.ok) {
        console.log(`✓ Connection to ${endpoint.name} successful`);
        const responseData = await response.json();
        result.products = Array.isArray(responseData) 
          ? responseData 
          : (responseData.products || responseData.data || []);
        
        result.connectionSucceeded = true;
        result.successfulEndpoint = endpoint;
        result.success = true;
        console.log(`CustomCat API response received successfully from ${endpoint.name}`);
        break; // Success! Exit the loop
      } else {
        // We got a response, but it wasn't OK
        console.log(`✗ ${endpoint.name} responded with status ${response.status}`);
        let errorMessage = `API Error (${response.status})`;
        
        try {
          const errorData = await response.json();
          if (errorData.message || errorData.error) {
            errorMessage = errorData.message || errorData.error || errorMessage;
          }
        } catch {
          // If we can't parse the error JSON, just use the status code message
        }
        
        result.errors[endpoint.name] = errorMessage;
      }
    } catch (error) {
      // This endpoint failed completely
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`✗ Error with ${endpoint.name}:`, errorMessage);
      result.errors[endpoint.name] = errorMessage;
    }
  }

  return result;
}