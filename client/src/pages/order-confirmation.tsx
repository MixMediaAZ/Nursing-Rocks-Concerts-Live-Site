import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Package, CalendarClock, ReceiptText, ArrowRight, MapPin } from "lucide-react";

export default function OrderConfirmationPage() {
  // Generate a random order number and shipping date
  const orderNumber = `NR-${Math.floor(10000 + Math.random() * 90000)}`;
  const today = new Date();
  const shippingDate = new Date(today);
  shippingDate.setDate(today.getDate() + 2); // 2 days from now
  
  const deliveryDate = new Date(today);
  deliveryDate.setDate(today.getDate() + 7); // 7 days from now
  
  // Format dates
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="container py-16 max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <CheckCircle2 className="mx-auto h-16 w-16 text-primary mb-6" />
        <h1 className="text-3xl font-bold mb-3">Thank You for Your Order!</h1>
        <p className="text-lg text-muted-foreground">
          Your order has been received and is now being processed.
        </p>
      </div>
      
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between mb-6">
            <div>
              <h2 className="text-lg font-medium mb-2">Order Information</h2>
              <p className="text-muted-foreground text-sm">
                Please save the order number for your records.
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end">
              <span className="text-sm text-muted-foreground">Order Date</span>
              <span>{formatDate(today)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ReceiptText className="h-5 w-5 text-primary" />
                <span className="font-medium">Order Number</span>
              </div>
              <p className="text-2xl font-bold">{orderNumber}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <span className="font-medium">Shipping Date</span>
              </div>
              <p>{formatDate(shippingDate)}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-primary" />
                <span className="font-medium">Estimated Delivery</span>
              </div>
              <p>{formatDate(deliveryDate)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-primary" />
              Shipping Information
            </h3>
            <p className="font-medium">Jane Doe</p>
            <p className="text-muted-foreground">123 Main Street</p>
            <p className="text-muted-foreground">Apt 4B</p>
            <p className="text-muted-foreground">New York, NY 10001</p>
            <p className="text-muted-foreground">United States</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium mb-4">Payment Information</h3>
            <p className="font-medium">Payment Method</p>
            <p className="text-muted-foreground mb-4">Credit Card (ending in 1234)</p>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>$75.00</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>$6.00</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>$81.00</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-8 border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <h3 className="font-medium mb-4">What Happens Next?</h3>
          
          <ol className="space-y-4">
            <li className="flex gap-3">
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-medium">
                1
              </div>
              <div>
                <p className="font-medium">Order Processing</p>
                <p className="text-sm text-muted-foreground">
                  Your order is being processed and prepared for shipping. You'll receive an email confirmation shortly.
                </p>
              </div>
            </li>
            
            <li className="flex gap-3">
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-medium">
                2
              </div>
              <div>
                <p className="font-medium">Shipping</p>
                <p className="text-sm text-muted-foreground">
                  Once your order ships, you'll receive another email with tracking information so you can monitor your delivery.
                </p>
              </div>
            </li>
            
            <li className="flex gap-3">
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-medium">
                3
              </div>
              <div>
                <p className="font-medium">Delivery</p>
                <p className="text-sm text-muted-foreground">
                  Your order should arrive within 5-7 business days. Be sure to check your delivery once it arrives.
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>
      
      <div className="text-center space-y-6">
        <p className="text-muted-foreground">
          An order confirmation has been sent to your email address.
          If you have any questions or concerns, please contact our customer service team.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link href="/store">
              Continue Shopping
            </Link>
          </Button>
          
          <Button variant="outline" asChild>
            <Link href="/account/orders">
              View Order History <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}