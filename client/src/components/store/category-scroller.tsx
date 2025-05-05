import { useRef, useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ShoppingBag, TagIcon } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { StoreProduct } from "@shared/schema";

export function CategoryScroller() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { 
    data: products, 
    isLoading
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
    ? ["All Products", ...Array.from(new Set(products.map(product => product.category)))]
    : ["All Products"];

  const checkScrollable = () => {
    const scrollArea = scrollRef.current;
    if (scrollArea) {
      setCanScrollLeft(scrollArea.scrollLeft > 0);
      setCanScrollRight(
        scrollArea.scrollWidth > scrollArea.clientWidth &&
        scrollArea.scrollLeft < scrollArea.scrollWidth - scrollArea.clientWidth
      );
    }
  };

  useEffect(() => {
    const scrollArea = scrollRef.current;
    if (scrollArea) {
      checkScrollable();
      scrollArea.addEventListener('scroll', checkScrollable);
      
      // Check again after images might have loaded
      const timer = setTimeout(checkScrollable, 500);
      
      return () => {
        scrollArea.removeEventListener('scroll', checkScrollable);
        clearTimeout(timer);
      };
    }
  }, [products]);

  const scroll = (direction: 'left' | 'right') => {
    const scrollArea = scrollRef.current;
    if (scrollArea) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollArea.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Generate background colors based on category names for visual distinction
  const getCategoryColor = (category: string) => {
    const colors = [
      "bg-primary/10 text-primary hover:bg-primary/20",
      "bg-blue-100 text-blue-700 hover:bg-blue-200",
      "bg-green-100 text-green-700 hover:bg-green-200",
      "bg-purple-100 text-purple-700 hover:bg-purple-200",
      "bg-amber-100 text-amber-700 hover:bg-amber-200",
      "bg-pink-100 text-pink-700 hover:bg-pink-200",
    ];
    
    // Use the first character of the category name to pick a color
    const index = category.charCodeAt(0) % colors.length;
    return colors[index];
  };
  
  // Check if a category is apparel-related (should link to Shopify)
  const isApparelCategory = (category: string): boolean => {
    const lowerCategory = category.toLowerCase();
    return category === "T-shirts" 
      || category === "Apparel" 
      || category === "Shirts"
      || lowerCategory.includes("shirt") 
      || lowerCategory.includes("tee");
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TagIcon className="h-5 w-5 text-primary" />
          Shop By Category
        </h3>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            className={`h-8 w-8 rounded-full ${!canScrollLeft ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Scroll left</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={`h-8 w-8 rounded-full ${!canScrollRight ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Scroll right</span>
          </Button>
        </div>
      </div>
      
      <ScrollArea className="w-full whitespace-nowrap rounded-lg border p-1 pb-0">
        <div
          ref={scrollRef}
          className="flex pb-3 space-x-2 min-w-full"
        >
          {categories.map((category, i) => {
            if (isApparelCategory(category)) {
              // Apparel categories redirect to Shopify
              return (
                <div
                  key={i}
                  onClick={() => window.open("https://rgwrvu-sq.myshopify.com/", "_blank")}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md cursor-pointer transition-colors text-center ${getCategoryColor(category)}`}
                >
                  <ShoppingBag className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium whitespace-nowrap">{category}</span>
                  {products && (
                    <span className="inline-flex items-center justify-center rounded-full bg-white/80 px-1.5 py-0.5 text-xs font-medium text-gray-700 flex-shrink-0">
                      {products.filter(p => p.category === category).length}
                    </span>
                  )}
                </div>
              );
            } else {
              // Non-apparel categories use internal store links
              return (
                <Link 
                  key={i} 
                  href={category === "All Products" ? "/store" : `/store/category/${encodeURIComponent(category)}`}
                >
                  <div 
                    className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md cursor-pointer transition-colors text-center ${getCategoryColor(category)}`}
                  >
                    <ShoppingBag className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium whitespace-nowrap">{category}</span>
                    {products && (
                      <span className="inline-flex items-center justify-center rounded-full bg-white/80 px-1.5 py-0.5 text-xs font-medium text-gray-700 flex-shrink-0">
                        {category === "All Products" 
                          ? products.length 
                          : products.filter(p => p.category === category).length}
                      </span>
                    )}
                  </div>
                </Link>
              );
            }
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}