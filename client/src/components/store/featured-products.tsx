import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { StoreProductCard } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoreProduct } from "@shared/schema";
import { Loader2, MoreHorizontal } from "lucide-react";

export function FeaturedProducts() {
  const [activeCategory, setActiveCategory] = useState("all");

  // Fetch featured products
  const { 
    data: products, 
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

  // Extract categories from featured products
  const categories = products 
    ? Array.from(new Set(products.map(product => product.category)))
    : [];

  // Filter products by active category
  const filteredProducts = products && activeCategory !== "all"
    ? products.filter(product => product.category === activeCategory)
    : products;

  return (
    <div id="featured-products" className="container py-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">Featured Products</h2>
          <p className="text-muted-foreground">
            Our most popular Nursing Rocks merchandise handpicked for you
          </p>
        </div>
        
        <Button asChild variant="outline">
          <Link href="/store">
            <MoreHorizontal className="mr-2 h-4 w-4" />
            View All Products
          </Link>
        </Button>
      </div>
      
      {categories.length > 0 && (
        <Tabs 
          defaultValue="all" 
          value={activeCategory}
          onValueChange={setActiveCategory}
          className="mb-8"
        >
          <TabsList className="mb-2">
            <TabsTrigger value="all">All</TabsTrigger>
            {categories.map(category => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value={activeCategory}>
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-red-500">
                  Error loading featured products. Please try again later.
                </p>
              </div>
            ) : filteredProducts?.length === 0 ? (
              <div className="text-center py-16">
                <p>No featured products available in this category yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts?.map((product) => (
                  <div key={product.id} className="h-full flex">
                    <StoreProductCard 
                      product={product} 
                      featured={false} 
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
      
      {/* Category Cards section */}
      <div className="mt-16">
        <h3 className="text-xl font-bold mb-8">Shop by Category</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/store/category/apparel">
            <div className="group relative h-64 rounded-lg overflow-hidden bg-muted border">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-10" />
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
              <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                <h4 className="text-white font-medium text-lg">Apparel</h4>
                <p className="text-white/80 text-sm">T-shirts, hoodies, and more</p>
              </div>
            </div>
          </Link>
          
          <Link href="/store/category/accessories">
            <div className="group relative h-64 rounded-lg overflow-hidden bg-muted border">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-10" />
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
              <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                <h4 className="text-white font-medium text-lg">Accessories</h4>
                <p className="text-white/80 text-sm">Bags, pins, and jewelry</p>
              </div>
            </div>
          </Link>
          
          <Link href="/store/category/drinkware">
            <div className="group relative h-64 rounded-lg overflow-hidden bg-muted border">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-10" />
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
              <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                <h4 className="text-white font-medium text-lg">Drinkware</h4>
                <p className="text-white/80 text-sm">Mugs, tumblers, and water bottles</p>
              </div>
            </div>
          </Link>
          
          <Link href="/store/category/home-goods">
            <div className="group relative h-64 rounded-lg overflow-hidden bg-muted border">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-10" />
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
              <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                <h4 className="text-white font-medium text-lg">Home Goods</h4>
                <p className="text-white/80 text-sm">Candles, decor, and more</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}