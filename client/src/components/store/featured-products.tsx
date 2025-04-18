import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, MoveRight } from "lucide-react";
import { StoreProductCard } from "./product-card";
import { StoreProduct } from "@shared/schema";

export function FeaturedProducts() {
  // Fetch featured products
  const { data: featuredProducts, isLoading, error } = useQuery<StoreProduct[]>({
    queryKey: ["/api/store/products/featured"], 
  });

  if (isLoading) {
    return (
      <div id="featured-products" className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !featuredProducts || featuredProducts.length === 0) {
    return null;
  }

  return (
    <div id="featured-products" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Featured Products</h2>
          <p className="text-muted-foreground">
            Handpicked items from our Nursing Rocks collection
          </p>
        </div>
        <Button variant="ghost" asChild>
          <Link href="/store" className="flex items-center">
            View all
            <MoveRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {featuredProducts.map((product) => (
          <StoreProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}