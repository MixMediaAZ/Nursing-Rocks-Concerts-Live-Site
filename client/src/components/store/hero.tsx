import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";

export function StoreHero() {
  return (
    <div className="relative overflow-hidden rounded-lg">
      <div className="bg-gradient-to-br from-primary/10 to-primary/30 p-8 md:p-12">
        <div className="max-w-2xl relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Official Nursing Rocks Merchandise
          </h1>
          <p className="text-lg text-muted-foreground mb-6 max-w-lg">
            Show your passion for nursing and music with our exclusive collection of Nursing Rocks merchandise. Perfect for concerts, clinicals, or casual wear!
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg">
              <a href="#featured-products">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Featured Items
              </a>
            </Button>
            <Button variant="outline" asChild size="lg">
              <Link href="/store/category/Apparel">
                Shop Apparel
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Medical-themed decorative elements */}
        <div className="absolute right-[-5%] bottom-[-5%] md:right-0 md:bottom-0 w-40 h-40 md:w-64 md:h-64 opacity-10 rotate-12">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-primary">
            <path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z" />
          </svg>
        </div>
        
        <div className="absolute left-[-5%] top-[-5%] w-32 h-32 md:w-48 md:h-48 opacity-10 -rotate-12">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-primary">
            <path d="M12.01 4c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.02-9-9-9zm3.23 13.61-3.24-1.9-3.24 1.9.87-3.71-2.87-2.47 3.84-.32 1.4-3.53 1.4 3.53 3.84.32-2.87 2.47.87 3.71z" />
          </svg>
        </div>
      </div>
    </div>
  );
}