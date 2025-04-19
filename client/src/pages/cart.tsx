import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { CheckoutForm } from "@/components/store/checkout-form";
import { 
  ShoppingCart, 
  Trash, 
  ArrowLeft, 
  CreditCard, 
  Loader2,
  AlertTriangle,
  Lock
} from "lucide-react";

export default function CartPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout'>('cart');
  const { items, updateQuantity, removeFromCart, totalPrice, isEmpty } = useCart();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const handleQuantityChange = (itemId: number, newQuantity: string) => {
    const quantity = parseInt(newQuantity, 10);
    if (!isNaN(quantity) && quantity > 0) {
      updateQuantity(itemId, quantity);
    }
  };

  const handleRemoveItem = (itemId: number, itemName: string) => {
    removeFromCart(itemId);
    toast({
      title: "Item removed",
      description: `${itemName} has been removed from your cart`,
    });
  };

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      // Redirect to login page with return URL
      const returnUrl = encodeURIComponent("/cart?checkout=true");
      navigate(`/login?returnUrl=${returnUrl}`);
      toast({
        title: "Please sign in",
        description: "You need to be signed in to complete your purchase",
      });
      return;
    }
    
    setCheckoutStep('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContinueShopping = () => {
    navigate("/store");
  };

  if (checkoutStep === 'checkout') {
    return (
      <div className="container py-12">
        <div className="max-w-3xl mx-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-6"
            onClick={() => setCheckoutStep('cart')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </Button>
          
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Checkout</h1>
            <div className="flex items-center text-primary">
              <Lock className="mr-2 h-4 w-4" />
              <span className="text-sm font-medium">Secure Checkout</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <CheckoutForm />
            </div>
            
            <div>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
                  
                  <div className="space-y-4 mb-4">
                    {items.map((item) => (
                      <div key={item.productId} className="flex justify-between text-sm">
                        <span>{item.name} (x{item.quantity})</span>
                        <span>${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${totalPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>Free</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg mt-4">
                      <span>Total</span>
                      <span>${totalPrice}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
      
      {isEmpty() ? (
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-medium mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-8">
            Looks like you haven't added any items to your cart yet.
          </p>
          <Button size="lg" onClick={handleContinueShopping}>
            Continue Shopping
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="border rounded-lg divide-y">
              {items.map((item) => (
                <div key={item.productId} className="p-4 flex items-start gap-4">
                  <div className="w-20 h-20 rounded bg-muted overflow-hidden flex-shrink-0">
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                      <div>
                        <Link href={`/store/product/${item.productId}`}>
                          <h3 className="font-medium hover:text-primary">{item.name}</h3>
                        </Link>
                        <p className="text-muted-foreground text-sm mt-1">
                          ${item.price} each
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="w-24">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                            className="h-9"
                          />
                        </div>
                        
                        <div className="text-right">
                          <div className="font-medium">
                            ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-muted-foreground mt-1 h-auto p-0"
                            onClick={() => handleRemoveItem(item.productId, item.name)}
                          >
                            <Trash className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex justify-between">
              <Button variant="outline" onClick={handleContinueShopping}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Continue Shopping
              </Button>
            </div>
          </div>
          
          <div>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
                
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between">
                    <span>Subtotal ({items.reduce((acc, item) => acc + item.quantity, 0)} items)</span>
                    <span>${totalPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${totalPrice}</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleProceedToCheckout}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Proceed to Checkout
                    </>
                  )}
                </Button>
                
                <div className="mt-4 text-sm text-muted-foreground text-center">
                  <p>Secure payment processing</p>
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-6 p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Order Information</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Orders typically ship within 1-2 business days. For any questions or concerns about your order, please contact customer support.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}