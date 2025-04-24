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
    name: "CustomCat Official API",
    url: "https://customcat-beta.mylocker.net/api/v1/catalog",
    useQueryParam: true,
    extraParams: {
      limit: "250"
    }
  },
  
  // Try with different category options
  {
    name: "CustomCat Digisoft Category",
    url: "https://customcat-beta.mylocker.net/api/v1/catalog",
    useQueryParam: true,
    extraParams: {
      category: "Digisoft",
      limit: "250"
    }
  },
  {
    name: "CustomCat Sublimation Category",
    url: "https://customcat-beta.mylocker.net/api/v1/catalog",
    useQueryParam: true,
    extraParams: {
      category: "Sublimation",
      limit: "250"
    }
  },
  
  // Other possible variations just in case
  {
    name: "CustomCat Catalog V1",
    url: "https://customcat.mylocker.net/api/v1/catalog",
    useQueryParam: true,
    extraParams: {
      limit: "250"
    }
  },
  {
    name: "CustomCat Production API",
    url: "https://customcat.com/api/v1/catalog",
    useQueryParam: true,
    extraParams: {
      limit: "250"
    }
  }
];