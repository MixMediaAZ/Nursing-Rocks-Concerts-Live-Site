/**
 * CustomCat API endpoint configurations to try
 */
export const customCatEndpoints = [
  // Standard API endpoints
  {
    name: "api.customcat.com v1",
    url: "https://api.customcat.com/v1/products"
  },
  {
    name: "api.customcat.io v1",
    url: "https://api.customcat.io/v1/products"
  },
  {
    name: "app.customcat.com with api path",
    url: "https://app.customcat.com/api/v1/products"
  },
  {
    name: "api.customcat.com v2",
    url: "https://api.customcat.com/v2/products"
  },
  // Try direct store endpoint
  {
    name: "app.customcat.com store endpoint",
    url: "https://app.customcat.com/api/store/products"
  },
  // Try without version in the path
  {
    name: "api.customcat.com no version",
    url: "https://api.customcat.com/products"
  },
  // Try alternative paths
  {
    name: "api.customcat.com catalog",
    url: "https://api.customcat.com/v1/catalog"
  },
  {
    name: "partners subdomain",
    url: "https://partners.customcat.com/api/v1/products"
  },
  // Try v3 endpoint
  {
    name: "api.customcat.com v3",
    url: "https://api.customcat.com/v3/products"
  },
  // Try production domain
  {
    name: "production-api subdomain",
    url: "https://production-api.customcat.com/v1/products"
  },
  // Try public API endpoints
  {
    name: "public API endpoint",
    url: "https://public-api.customcat.com/v1/products"
  },
  // Try direct printer endpoints
  {
    name: "Direct API", 
    url: "https://api.customcat.com/direct/products"
  },
  // Try alternative API version format
  {
    name: "Alternative API format",
    url: "https://customcat.com/api/products"
  }
];