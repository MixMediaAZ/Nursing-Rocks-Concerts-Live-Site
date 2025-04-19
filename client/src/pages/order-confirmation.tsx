import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, ShoppingBag, Clock } from "lucide-react";
import { useCart } from "@/hooks/use-cart";

export default function OrderConfirmationPage() {
  const [, setLocation] = useLocation();
  const { clearCart } = useCart();
  
  // Extract order information from URL parameters
  const searchParams = new URLSearchParams(window.location.search);
  const orderId = searchParams.get("orderId");
  
  useEffect(() => {
    // If accessed directly without an order ID, redirect to store
    if (!orderId) {
      setLocation("/store");
    }
    
    // Clear the cart after successful order
    clearCart();
  }, [orderId, setLocation, clearCart]);

  if (!orderId) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container py-12 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
        <p className="text-muted-foreground mb-4">
          Thank you for your purchase. Your order has been received and is being processed.
        </p>
        <div className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-1 text-sm">
          <span className="font-medium text-primary">Order #{orderId}</span>
        </div>
      </div>

      <div className="bg-muted rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">What Happens Next?</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
              1
            </div>
            <div>
              <h3 className="font-medium">Order Processing</h3>
              <p className="text-muted-foreground">
                Our team is preparing your items for shipment. You'll receive an email with tracking details soon.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
              2
            </div>
            <div>
              <h3 className="font-medium">Shipment</h3>
              <p className="text-muted-foreground">
                Items will be shipped within 1-2 business days.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
              3
            </div>
            <div>
              <h3 className="font-medium">Delivery</h3>
              <p className="text-muted-foreground">
                Expected delivery is 3-5 business days after shipment.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Order details summary would typically go here - simplified for this example */}
      <div className="border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
          Order Details
        </h2>
        <p className="text-muted-foreground mb-2">
          A confirmation email has been sent to your email address with detailed order information.
        </p>
        <p className="text-muted-foreground">
          You can also view your order history in your account dashboard.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button asChild variant="outline">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Return Home
          </Link>
        </Button>
        <Button asChild>
          <Link href="/store">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Continue Shopping
          </Link>
        </Button>
      </div>
    </div>
  );
}