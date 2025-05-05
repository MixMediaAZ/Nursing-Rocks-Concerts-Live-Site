import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { StoreProductCard } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoreProduct } from "@shared/schema";
import { Loader2, Shirt } from "lucide-react";

export function CustomNursingShirts() {
  // Fetch all t-shirt products
  const { 
    data: products, 
    isLoading, 
    error 
  } = useQuery<StoreProduct[]>({
    queryKey: ['/api/store/products/category/t-shirts'],
    queryFn: async () => {
      const response = await fetch('/api/store/products/category/t-shirts');
      if (!response.ok) {
        // Fallback to all products if category endpoint fails
        const allResponse = await fetch('/api/store/products');
        if (!allResponse.ok) {
          throw new Error('Failed to fetch products');
        }
        const allProducts = await allResponse.json();
        // Filter for t-shirts manually
        return allProducts.filter((product: StoreProduct) => 
          product.category.toLowerCase().includes('shirt') || 
          product.name.toLowerCase().includes('shirt') ||
          product.name.toLowerCase().includes('tee')
        );
      }
      return response.json();
    }
  });

  // Filter the products to only show nursing-themed shirts with artwork
  const nursingShirts = products ? products.filter(product => 
    // Look for nursing-related terms in the product name or description
    (product.name.toLowerCase().includes('nursing') || 
     (product.description && product.description.toLowerCase().includes('nursing')) ||
     product.name.toLowerCase().includes('healthcare') ||
     product.category.toLowerCase().includes('shirt') ||
     product.name.toLowerCase().includes('tee'))
  ) : [];

  return (
    <div className="container py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">Nursing Rocks T-Shirts</h2>
          <p className="text-muted-foreground">
            Show your nursing pride with our custom-designed shirts
          </p>
        </div>
        
        <Button variant="outline" onClick={() => window.open("https://www.bonfire.com/store/nursing-rocks-concert-series", "_blank")}>
          <Shirt className="mr-2 h-4 w-4" />
          View All T-Shirts
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-red-500">
            Error loading shirts. Please try again later.
          </p>
        </div>
      ) : nursingShirts.length === 0 ? (
        <div className="text-center py-16">
          <p>No nursing shirts available currently. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {nursingShirts.slice(0, 8).map((product) => (
            <div key={product.id} className="h-full">
              <StoreProductCard 
                product={product} 
                featured={false} 
              />
            </div>
          ))}
        </div>
      )}
      
      <div className="flex justify-center mt-8">
        <Button onClick={() => window.open("https://www.bonfire.com/store/nursing-rocks-concert-series", "_blank")}>
          Browse All Nursing T-Shirts
        </Button>
      </div>
    </div>
  );
}