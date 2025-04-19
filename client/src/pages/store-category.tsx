import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { StoreProductCard } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight, Loader2, Filter, Search, ShoppingBag } from "lucide-react";
import { StoreProduct } from "@shared/schema";

export default function StoreCategoryPage() {
  const { category } = useParams<{ category: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<string>("featured");

  // Format category for display (convert-dash-case to Title Case)
  const formattedCategory = category
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Fetch products by category
  const { 
    data: products, 
    isLoading, 
    error 
  } = useQuery<StoreProduct[]>({
    queryKey: [`/api/store/products/category/${category}`],
    queryFn: async () => {
      const response = await fetch(`/api/store/products/category/${category}`);
      if (!response.ok) {
        throw new Error('Failed to fetch category products');
      }
      return response.json();
    }
  });

  // Filter and sort products
  const filteredProducts = products 
    ? products.filter(product => {
        return searchQuery
          ? product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.description ? product.description.toLowerCase().includes(searchQuery.toLowerCase()) : false)
          : true;
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
    setSortOrder("featured");
  };

  return (
    <div className="container py-12">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-muted-foreground mb-8">
        <Link href="/store">
          <span className="hover:text-primary cursor-pointer">Store</span>
        </Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <span className="text-foreground">{formattedCategory}</span>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{formattedCategory}</h1>
          <p className="text-muted-foreground">
            Browse our collection of {formattedCategory.toLowerCase()} merchandise
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
                Sort
              </h3>
              {sortOrder !== "featured" && (
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
          
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <h3 className="font-medium">Shop by Category</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/store/category/apparel">
                  <span className={`text-sm hover:text-primary cursor-pointer ${category === 'apparel' ? 'font-medium text-primary' : ''}`}>
                    Apparel
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/store/category/accessories">
                  <span className={`text-sm hover:text-primary cursor-pointer ${category === 'accessories' ? 'font-medium text-primary' : ''}`}>
                    Accessories
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/store/category/drinkware">
                  <span className={`text-sm hover:text-primary cursor-pointer ${category === 'drinkware' ? 'font-medium text-primary' : ''}`}>
                    Drinkware
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/store/category/home-goods">
                  <span className={`text-sm hover:text-primary cursor-pointer ${category === 'home-goods' ? 'font-medium text-primary' : ''}`}>
                    Home Goods
                  </span>
                </Link>
              </li>
            </ul>
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
  );
}