/**
 * CustomCat API endpoint configurations to try
 * 
 * Based on the official CustomCat API documentation:
 * - The base URL is https://customcat-beta.mylocker.net/api/v1/
 * - The correct endpoint is /catalog
 * - The API key should be sent as a query parameter, not a header
 */
export const customCatEndpoints = [
  // Primary endpoint from the documentation - this should work
  {
    name: "CustomCat Digisoft Category",
    url: "https://customcat-beta.mylocker.net/api/v1/catalog",
    useQueryParam: true,
    extraParams: {
      category: "Digisoft",
      limit: "25" // Reduced limit to improve response time and avoid timeouts
    }
  },
  
  // Backup endpoints if primary fails
  {
    name: "CustomCat Catalog Page 1",
    url: "https://customcat-beta.mylocker.net/api/v1/catalog",
    useQueryParam: true,
    extraParams: {
      limit: "25",
      page: "1" 
    }
  },
  
  {
    name: "CustomCat Production API",
    url: "https://customcat.com/api/v1/catalog",
    useQueryParam: true,
    extraParams: {
      limit: "25"
    }
  }
];