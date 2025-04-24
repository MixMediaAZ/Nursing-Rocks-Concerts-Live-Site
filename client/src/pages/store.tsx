import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { StoreHero } from "@/components/store/hero";
import { StoreProductCard } from "@/components/store/product-card";
import { FeaturedProducts } from "@/components/store/featured-products";
import { CategoryScroller } from "@/components/store/category-scroller";
import { PromotionsSection } from "@/components/store/promotions-section";
import { CustomNursingShirts } from "@/components/store/custom-nursing-shirts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Filter, Search, ShoppingBag } from "lucide-react";
import { StoreProduct } from "@shared/schema";

export default function StorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("featured");

  // Fetch all products
  const { 
    data: products, 
    isLoading, 
    error 
  } = useQuery<StoreProduct[]>({
    queryKey: ['/api/store/products'],
    queryFn: async () => {
      const response = await fetch('/api/store/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    }
  });

  // Extract unique categories from products
  const categories = products 
    ? Array.from(new Set(products.map(product => product.category)))
    : [];

  // Filter and sort products
  const filteredProducts = products 
    ? products.filter(product => {
        const matchesSearch = searchQuery
          ? product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.description ? product.description.toLowerCase().includes(searchQuery.toLowerCase()) : false)
          : true;
        
        const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
          
        return matchesSearch && matchesCategory;
      })
    : [];

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortOrder) {
      case "price-low-high":
        return Number(a.price) - Number(b.price);
      case "price-high-low":
        return Number(b.price) - Number(a.price);
      case "newest":
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      case "featured":
      default:
        // Featured items first, then by id
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        return a.id - b.id;
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleReset = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSortOrder("featured");
  };

  return (
    <div>
      <StoreHero />
      
      <div className="container py-8">
        <CategoryScroller />
      </div>
      
      <FeaturedProducts />
      
      {/* Custom Nursing Shirts Section */}
      <div className="bg-muted/30 py-12">
        <CustomNursingShirts />
      </div>
      
      <PromotionsSection />
      
      <div className="container py-12">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold mb-2">All Products</h2>
            <p className="text-muted-foreground max-w-md">
              Browse our complete collection of Nursing Rocks merchandise
            </p>
          </div>
          
          <form 
            onSubmit={handleSearch}
            className="w-full md:w-auto"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-10 w-full md:w-[240px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters sidebar */}
          <div className="w-full md:w-64 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </h3>
                {(searchQuery || selectedCategory !== "all" || sortOrder !== "featured") && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleReset}
                  >
                    Reset
                  </Button>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select 
                    value={selectedCategory} 
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort By</label>
                  <Select 
                    value={sortOrder} 
                    onValueChange={setSortOrder}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Featured" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                      <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="hidden md:block space-y-4 p-6 bg-muted rounded-lg text-center">
              <h3 className="font-medium text-lg">Need Help?</h3>
              <p className="text-sm text-muted-foreground">
                Have questions about our merchandise or need assistance with your order?
              </p>
              <Button asChild variant="outline" size="sm" className="w-full mt-2">
                <Link href="/contact">Contact Support</Link>
              </Button>
            </div>
          </div>
          
          {/* Product grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex flex-col justify-center items-center py-16 bg-muted/10 rounded-lg">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading products...</p>
              </div>
            ) : error ? (
              <div className="py-16 text-center bg-muted/20 rounded-lg">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h3 className="text-2xl font-medium mb-3">Error Loading Products</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  We couldn't load the product list at this time. Please try again later.
                </p>
                <Button variant="outline" className="px-8" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="py-16 text-center bg-muted/20 rounded-lg">
                <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-2xl font-medium mb-3">No products found</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  We couldn't find any products matching your criteria. Try adjusting your filters for better results.
                </p>
                <Button onClick={handleReset} size="lg" className="px-8">
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedProducts.map((product) => (
                  <StoreProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}