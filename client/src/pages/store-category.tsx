import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { StoreProductCard } from "@/components/store/product-card";
import { Loader2, ArrowLeft, ShoppingBag } from "lucide-react";
import { StoreProduct } from "@shared/schema";

export default function StoreCategoryPage() {
  const { category } = useParams();
  const decodedCategory = category ? decodeURIComponent(category) : "";
  const [displayCategory, setDisplayCategory] = useState<string>("");

  // Format category for display (capitalize first letter of each word)
  useEffect(() => {
    if (decodedCategory) {
      setDisplayCategory(
        decodedCategory
          .split(" ")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      );
    }
  }, [decodedCategory]);

  // Fetch products from the specific category
  const { 
    data: products, 
    isLoading, 
    error 
  } = useQuery<StoreProduct[]>({
    queryKey: ["/api/store/products/category", decodedCategory],
    queryFn: async () => {
      const response = await fetch(`/api/store/products/category/${decodedCategory}`);
      if (!response.ok) {
        throw new Error('Failed to fetch category products');
      }
      return response.json();
    },
    enabled: !!decodedCategory
  });

  return (
    <div className="container py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/store" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Store
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{displayCategory} Collection</h1>
      </div>

      <div className="bg-gradient-to-br from-primary/5 to-primary/20 rounded-lg p-6 mb-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold mb-2">Shop Our {displayCategory} Items</h2>
          <p className="text-muted-foreground">
            Browse our collection of Nursing Rocks {displayCategory.toLowerCase()} products, designed specifically for healthcare professionals who love music.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <p className="text-red-500">Error loading products. Please try again later.</p>
        </div>
      ) : !products || products.length === 0 ? (
        <div className="py-12 text-center">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No products found</h3>
          <p className="text-muted-foreground mb-6">
            We couldn't find any products in this category.
          </p>
          <Button asChild>
            <Link href="/store">
              View All Products
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <StoreProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}