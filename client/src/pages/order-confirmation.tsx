import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight,
  CheckCircle, 
  Home,
  ShoppingBag 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrderConfirmationPage() {
  return (
    <div className="container py-16 max-w-2xl mx-auto text-center">
      <div className="mb-8">
        <div className="bg-primary/10 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Thank You for Your Order!</h1>
        <p className="text-muted-foreground mb-8">
          Your order has been placed successfully and is now being processed.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>What Happens Next?</CardTitle>
          <CardDescription>Here's what you can expect</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-bold">1</span>
              </div>
              <div className="text-left">
                <h3 className="font-medium">Order Confirmation</h3>
                <p className="text-muted-foreground text-sm">
                  You will receive an email confirmation with your order details.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-bold">2</span>
              </div>
              <div className="text-left">
                <h3 className="font-medium">Order Processing</h3>
                <p className="text-muted-foreground text-sm">
                  We'll prepare your items and process your payment.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-bold">3</span>
              </div>
              <div className="text-left">
                <h3 className="font-medium">Shipping</h3>
                <p className="text-muted-foreground text-sm">
                  Your order will be shipped and you'll receive tracking information.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-bold">4</span>
              </div>
              <div className="text-left">
                <h3 className="font-medium">Delivery</h3>
                <p className="text-muted-foreground text-sm">
                  Your Nursing Rocks merchandise will be delivered to your doorstep.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button variant="outline" asChild>
          <Link href="/profile">
            View My Orders
            <ArrowRight className="ml-2 h-4 w-4" />
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