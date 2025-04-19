import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { StoreHero } from "@/components/store/hero";
import { StoreProductCard } from "@/components/store/product-card";
import { FeaturedProducts } from "@/components/store/featured-products";
import { CategoryScroller } from "@/components/store/category-scroller";
import { PromotionsSection } from "@/components/store/promotions-section";
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
      
      <PromotionsSection />
      
      <div className="container py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">All Products</h2>
            <p className="text-muted-foreground">
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
            
            <div className="hidden md:block space-y-4 p-4 bg-muted rounded-lg">
              <h3 className="font-medium">Need Help?</h3>
              <p className="text-sm text-muted-foreground">
                Have questions about our merchandise or need assistance with your order?
              </p>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/contact">Contact Support</Link>
              </Button>
            </div>
          </div>
          
          {/* Product grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="py-12 text-center">
                <p className="text-red-500">Error loading products. Please try again later.</p>
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="py-12 text-center">
                <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No products found</h3>
                <p className="text-muted-foreground mb-6">
                  We couldn't find any products matching your criteria.
                </p>
                <Button onClick={handleReset}>
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