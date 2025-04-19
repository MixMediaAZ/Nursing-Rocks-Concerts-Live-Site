import { ShoppingBag, Gift, Truck, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function StoreHero() {
  return (
    <div className="relative flex flex-col items-center justify-center py-16 px-4 mb-12 overflow-hidden rounded-lg">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
      
      {/* Content */}
      <div className="relative z-10 max-w-4xl text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          <span className="text-primary">Nursing Rocks</span> Merchandise
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Show your support with our exclusive collection of healthcare-themed concert merchandise. From t-shirts to accessories, we've got everything for music-loving medical professionals.
        </p>
        
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <Button asChild size="lg">
            <Link href="#featured-products">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Shop Now
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="lg">
            <Link href="/store/category/t-shirts">
              <Gift className="mr-2 h-5 w-5" />
              Browse T-Shirts
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full max-w-5xl relative z-10">
        <div className="bg-background rounded-lg p-6 shadow-sm flex items-start">
          <div className="bg-primary/10 p-3 rounded-full mr-4">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-medium mb-1">Exclusive Designs</h3>
            <p className="text-sm text-muted-foreground">
              Each piece features unique healthcare-themed concert artwork
            </p>
          </div>
        </div>
        
        <div className="bg-background rounded-lg p-6 shadow-sm flex items-start">
          <div className="bg-primary/10 p-3 rounded-full mr-4">
            <Truck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-medium mb-1">Free Shipping</h3>
            <p className="text-sm text-muted-foreground">
              On all orders over $50 anywhere in the United States
            </p>
          </div>
        </div>
        
        <div className="bg-background rounded-lg p-6 shadow-sm flex items-start">
          <div className="bg-primary/10 p-3 rounded-full mr-4">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-medium mb-1">Secure Checkout</h3>
            <p className="text-sm text-muted-foreground">
              100% secure payment with multiple payment options
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}