import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, ShoppingBag, ChevronRight, Download, Calendar } from "lucide-react";

export default function OrderConfirmationPage() {
  const [, navigate] = useLocation();
  const { clearCart } = useCart();
  
  // Clear the cart when the confirmation page loads
  useEffect(() => {
    clearCart();
  }, [clearCart]);
  
  // Generate a random order number for demo purposes
  const orderNumber = Math.floor(10000000 + Math.random() * 90000000);
  const orderDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return (
    <div className="py-12">
      <div className="container max-w-3xl">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-2">Thank You for Your Order!</h1>
          <p className="text-muted-foreground text-lg">
            Your order has been confirmed and will be processed shortly.
          </p>
        </div>
        
        <Card className="p-6 mb-8">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Order Number</p>
                <p className="font-medium"># {orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{orderDate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                  <span className="font-medium">Confirmed</span>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <h3 className="font-medium mb-4 flex items-center">
                <Calendar className="mr-2 h-4 w-4 text-primary" />
                What's Next
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <div className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <p>
                    <span className="font-medium">Order Processing</span> - Your order is now being processed. You'll receive an email confirmation with your order details shortly.
                  </p>
                </li>
                <li className="flex items-start gap-2">
                  <div className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <p>
                    <span className="font-medium">Shipping</span> - Once your order has been packed, you'll receive another email with tracking information.
                  </p>
                </li>
                <li className="flex items-start gap-2">
                  <div className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <p>
                    <span className="font-medium">Delivery</span> - Your items will be delivered within 3-5 business days (standard shipping) or 1-2 business days (express shipping).
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </Card>
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Button asChild className="flex-1">
            <Link href="/store">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Continue Shopping
            </Link>
          </Button>
          
          <Button variant="outline" className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Download Receipt
          </Button>
        </div>
        
        <div className="bg-primary/5 rounded-lg p-5">
          <h3 className="font-medium mb-2">Need Help With Your Order?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Our customer support team is here to assist you with any questions or concerns about your order.
          </p>
          <Button variant="link" className="p-0 h-auto" asChild>
            <Link href="/contact">
              Contact Support
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}