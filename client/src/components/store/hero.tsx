import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Heart, TruckIcon, CreditCard, TagIcon } from "lucide-react";

export function StoreHero() {
  return (
    <div className="relative bg-primary/10 overflow-hidden">
      <div className="container py-20 flex flex-col items-center text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Nursing Rocks Merchandise
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Show your support for healthcare professionals with our exclusive collection of 
            Nursing Rocks apparel and merchandise. A portion of every purchase goes to support 
            healthcare scholarships.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link href="#featured-products">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Shop Now
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg">
              <Link href="/store/category/new-arrivals">
                <TagIcon className="mr-2 h-5 w-5" />
                New Arrivals
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-16 border-t">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center">
            <div className="bg-primary/10 p-3 rounded-full mb-4">
              <TruckIcon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium mb-1">Free Shipping</h3>
            <p className="text-sm text-muted-foreground">
              On all orders over $50
            </p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-primary/10 p-3 rounded-full mb-4">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium mb-1">Secure Payments</h3>
            <p className="text-sm text-muted-foreground">
              100% secure payment processing
            </p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-primary/10 p-3 rounded-full mb-4">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium mb-1">Supporting Healthcare</h3>
            <p className="text-sm text-muted-foreground">
              Proceeds support nursing scholarships
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}