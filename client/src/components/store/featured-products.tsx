import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { StoreProductCard } from "@/components/store/product-card";
import { ChevronRight, Loader2 } from "lucide-react";
import { StoreProduct } from "@shared/schema";

export function FeaturedProducts() {
  const { 
    data: featuredProducts, 
    isLoading, 
    error 
  } = useQuery<StoreProduct[]>({
    queryKey: ['/api/store/products/featured'],
    queryFn: async () => {
      const response = await fetch('/api/store/products/featured');
      if (!response.ok) {
        throw new Error('Failed to fetch featured products');
      }
      return response.json();
    }
  });

  const [categories, setCategories] = useState<string[]>([]);

  // Extract unique categories from featured products
  useEffect(() => {
    if (featuredProducts && featuredProducts.length > 0) {
      const uniqueCategories = Array.from(
        new Set(featuredProducts.map(product => product.category))
      );
      setCategories(uniqueCategories);
    }
  }, [featuredProducts]);

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center items-center" id="featured-products">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !featuredProducts || featuredProducts.length === 0) {
    return null;
  }

  return (
    <div className="py-12" id="featured-products">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold">Featured Products</h2>
            <p className="text-muted-foreground mt-1">
              Discover our most popular healthcare-themed merchandise
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            {categories.map((category) => (
              <Button 
                key={category} 
                variant="outline" 
                size="sm" 
                asChild
              >
                <Link href={`/store/category/${encodeURIComponent(category.toLowerCase())}`}>
                  {category}
                </Link>
              </Button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <StoreProductCard 
              key={product.id} 
              product={product} 
              featured={product.id === featuredProducts[0]?.id}
            />
          ))}
        </div>
        
        <div className="mt-10 text-center">
          <Button 
            variant="outline" 
            size="lg" 
            asChild
          >
            <Link href="/store" className="inline-flex items-center">
              View All Products
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}