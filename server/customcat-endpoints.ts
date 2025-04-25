/**
 * CustomCat API endpoint configurations to try
 * 
 * Based on the official CustomCat API documentation:
 * - The base URL is https://customcat-beta.mylocker.net/api/v1/
 * - The correct endpoint is /catalog
 * - The API key should be sent as a query parameter, not a header
 */
export const customCatEndpoints = [
  // Primary endpoint from the official documentation - this should work
  {
    name: "CustomCat Digisoft Category",
    url: "https://customcat-beta.mylocker.net/api/v1/catalog",
    useQueryParam: true,
    extraParams: {
      category: "Digisoft",
      limit: "25" // Reduced limit to improve response time and avoid timeouts
    }
  },
  
  // Backup endpoints with different parameters if primary fails
  {
    name: "CustomCat Sublimation Category",
    url: "https://customcat-beta.mylocker.net/api/v1/catalog",
    useQueryParam: true,
    extraParams: {
      category: "Sublimation",
      limit: "25"
    }
  },
  
  {
    name: "CustomCat Default Catalog",
    url: "https://customcat-beta.mylocker.net/api/v1/catalog",
    useQueryParam: true,
    extraParams: {
      limit: "25"
    }
  },
  
  // Using the catalogcategory endpoint as fallback
  {
    name: "CustomCat Category Listing",
    url: "https://customcat-beta.mylocker.net/api/v1/catalogcategory",
    useQueryParam: true,
    extraParams: {}
  }
];