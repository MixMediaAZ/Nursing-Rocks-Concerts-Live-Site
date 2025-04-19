import { useState } from "react";
import { useLocation } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { CheckoutForm } from "@/components/store/checkout-form";
import { StripePaymentForm } from "@/components/store/stripe-payment-form";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, ChevronLeft, CircleDollarSign, ShieldCheck, Truck } from "lucide-react";

export default function CheckoutPage() {
  const [, navigate] = useLocation();
  const { items, totalPrice, totalItems } = useCart();
  const [customerDetails, setCustomerDetails] = useState<any>(null);
  const [step, setStep] = useState<'details' | 'payment'>('details');

  // If cart is empty, redirect to store
  if (totalItems === 0) {
    navigate("/store");
    return null;
  }

  const handleDetailsSubmitted = (data: any) => {
    setCustomerDetails({
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      address: {
        line1: data.address1,
        line2: data.address2 || "",
        city: data.city,
        state: data.state,
        postal_code: data.zipCode,
        country: data.country,
      }
    });
    setStep('payment');
    window.scrollTo(0, 0);
  };

  const handlePaymentSuccess = () => {
    navigate("/store/order-confirmation");
  };

  return (
    <div className="py-10">
      <div className="container max-w-6xl">
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => navigate("/store/cart")}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </Button>
          
          <h1 className="text-3xl font-bold">Checkout</h1>
          
          <div className="flex items-center mt-4 space-x-4">
            <div className={`flex items-center ${step === 'details' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-2 
                ${step === 'details' ? 'bg-primary text-white' : 'bg-muted'}`}>
                1
              </div>
              <span className="font-medium">Your Details</span>
            </div>
            
            <div className="flex-1 h-px bg-border"></div>
            
            <div className={`flex items-center ${step === 'payment' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-2 
                ${step === 'payment' ? 'bg-primary text-white' : 'bg-muted'}`}>
                2
              </div>
              <span className="font-medium">Payment</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {step === 'details' ? (
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-6">Your Information</h2>
                <CheckoutForm onSubmit={handleDetailsSubmitted} />
              </div>
            ) : (
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
                <p className="text-muted-foreground mb-6">
                  Please enter your payment details to complete your purchase.
                </p>
                
                <div className="mb-4 p-3 bg-primary/5 rounded-md flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Secure Checkout</p>
                    <p className="text-xs text-muted-foreground">
                      Your payment information is encrypted and secure.
                    </p>
                  </div>
                </div>
                
                <StripePaymentForm 
                  onSuccess={handlePaymentSuccess}
                  customerDetails={customerDetails}
                />
                
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setStep('details')}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back to Details
                </Button>
              </div>
            )}
            
            <div className="mt-8 bg-primary/5 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h3 className="font-medium">Shipping Information</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Standard shipping (3-5 business days) is included in your order.
                    Express shipping options are available at checkout.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Order Summary</h2>
                <ShoppingBag className="h-5 w-5 text-muted-foreground" />
              </div>
              
              <Separator className="my-4" />
              
              <ScrollArea className="h-[240px] pr-4">
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={`${item.productId}`} className="flex items-start gap-3">
                      <div 
                        className="w-16 h-16 rounded bg-muted flex-shrink-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${item.imageUrl})` }}
                      ></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                        <p className="text-sm font-medium mt-1">${item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${totalPrice}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${(parseFloat(totalPrice) * 0.08).toFixed(2)}</span>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <div className="flex items-center">
                  <CircleDollarSign className="mr-2 h-4 w-4 text-primary" />
                  <span>${(parseFloat(totalPrice) * 1.08).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}