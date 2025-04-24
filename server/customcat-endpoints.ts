/**
 * CustomCat API endpoint configurations to try
 * 
 * Based on the official CustomCat API documentation:
 * - The correct endpoint is /catalog not /products
 * - The API key should be sent as a query parameter, not a header
 */
export const customCatEndpoints = [
  // Based on official documentation - these should work
  {
    name: "api.customcat.com catalog",
    url: "https://api.customcat.com/catalog",
    useQueryParam: true
  },
  {
    name: "customcat.com catalog",
    url: "https://customcat.com/api/catalog",
    useQueryParam: true
  },
  {
    name: "api.customcat.io catalog",
    url: "https://api.customcat.io/catalog",
    useQueryParam: true
  },
  // Try with version prefix
  {
    name: "api.customcat.com v1 catalog",
    url: "https://api.customcat.com/v1/catalog",
    useQueryParam: true
  },
  // App subdomain alternative
  {
    name: "app.customcat.com catalog",
    url: "https://app.customcat.com/api/catalog",
    useQueryParam: true
  },
  // Try various alternative formats to be comprehensive
  {
    name: "api.customcat.com v2 catalog",
    url: "https://api.customcat.com/v2/catalog",
    useQueryParam: true
  },
  {
    name: "Direct catalog endpoint",
    url: "https://api.customcat.com/catalog?category=Digisoft&limit=250",
    useQueryParam: true
  },
  // Try with different parameter options
  {
    name: "Digisoft category endpoint",
    url: "https://api.customcat.com/catalog",
    useQueryParam: true,
    extraParams: {
      category: "Digisoft",
      limit: "250"
    }
  },
  {
    name: "Sublimation category endpoint",
    url: "https://api.customcat.com/catalog",
    useQueryParam: true,
    extraParams: {
      category: "Sublimation",
      limit: "250"
    }
  }
];