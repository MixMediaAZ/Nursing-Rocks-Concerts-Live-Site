import { useState } from "react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import {
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  CreditCard,
  Loader2,
  MinusCircle,
  PlusCircle,
  ShoppingBag,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CheckoutForm } from "@/components/store/checkout-form";

export default function CartPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { 
    cartItems, 
    updateItemQuantity, 
    removeFromCart, 
    clearCart,
    totalItems,
    subtotal
  } = useCart();
  
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async (formData: any) => {
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please log in to complete your purchase",
        variant: "destructive"
      });
      navigate("/login?redirect=/cart");
      return;
    }

    try {
      setIsProcessing(true);
      
      // Create an order
      const orderData = {
        order: {
          user_id: user?.id,
          contact_email: formData.email,
          contact_phone: formData.phone,
          total_amount: subtotal.toFixed(2),
          status: "pending",
          payment_status: "pending",
          shipping_address: {
            name: formData.name,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country
          }
        },
        items: cartItems.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          price_at_time: item.price,
          subtotal: (parseFloat(item.price) * item.quantity).toFixed(2)
        }))
      };
      
      const response = await apiRequest('/api/store/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
      
      clearCart();
      
      toast({
        title: "Order placed successfully!",
        description: `Order #${response.id} has been placed.`
      });
      
      navigate("/store/order-confirmation");
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout failed",
        description: "There was an error processing your order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="container py-16 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
        <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Looks like you haven't added any products to your cart yet. 
          Check out our products and find something you like!
        </p>
        <Button asChild size="lg">
          <Link href="/store">
            Continue Shopping
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
        <Button variant="outline" asChild>
          <Link href="/store">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Continue Shopping
          </Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Cart Items ({totalItems})</CardTitle>
              <CardDescription>Review your items before checkout</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Product</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cartItems.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell>
                        <div className="w-[80px] h-[80px] rounded-md overflow-hidden bg-muted flex items-center justify-center">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Link href={`/store/products/${item.productId}`}>
                            <p className="font-medium hover:text-primary cursor-pointer">{item.name}</p>
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell>${item.price}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <MinusCircle className="h-3.5 w-3.5" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                          >
                            <PlusCircle className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => removeFromCart(item.productId)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={clearCart}>
                Clear Cart
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>$0.00</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Sheet>
                <SheetTrigger asChild>
                  <Button className="w-full">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Proceed to Checkout
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="sm:max-w-xl w-full">
                  <SheetHeader>
                    <SheetTitle>Complete Your Order</SheetTitle>
                    <SheetDescription>
                      Fill in your shipping information to complete your purchase.
                    </SheetDescription>
                  </SheetHeader>
                  
                  {!isAuthenticated && (
                    <Alert className="mt-4" variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Login Required</AlertTitle>
                      <AlertDescription>
                        Please <Link href="/login?redirect=/cart" className="font-medium underline">login</Link> to complete your purchase.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="mt-6">
                    <CheckoutForm 
                      onSubmit={handleCheckout}
                      isProcessing={isProcessing}
                      isDisabled={!isAuthenticated}
                      cartItems={cartItems}
                      subtotal={subtotal}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}