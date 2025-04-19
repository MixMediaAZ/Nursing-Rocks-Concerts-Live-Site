import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trash2, ShoppingCart, ArrowLeft, Loader2 } from "lucide-react";
import { CartItem, useCart } from "@/hooks/use-cart";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export default function CartPage() {
  const { items, totalPrice, totalItems, removeFromCart, updateQuantity, clearCart } = useCart();
  const { toast } = useToast();
  const { isLoggedIn } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      setIsSubmitting(true);
      const response = await apiRequest('/api/store/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            priceAtTime: item.price
          }))
        })
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Order placed successfully!",
        description: "Your order has been received and is being processed.",
      });
      clearCart();
      setIsSubmitting(false);
      // Here you would navigate to an order confirmation page
    },
    onError: (error) => {
      console.error("Order error:", error);
      toast({
        title: "Failed to place order",
        description: "There was an error processing your order. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  });

  const handleQuantityChange = (item: CartItem, value: string) => {
    const quantity = parseInt(value, 10);
    if (!isNaN(quantity)) {
      updateQuantity(item.productId, quantity);
    }
  };

  const handleCheckout = () => {
    if (!isLoggedIn) {
      toast({
        title: "Login required",
        description: "Please log in to complete your purchase",
        variant: "destructive",
      });
      return;
    }
    
    createOrderMutation.mutate();
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Shopping Cart</h1>
        <p className="text-muted-foreground">
          Review your items and proceed to checkout
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-medium mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">
            Looks like you haven't added any items to your cart yet.
          </p>
          <Button asChild>
            <Link href="/store">
              Continue Shopping
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Product</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell>
                        <div className="w-[80px] h-[80px] rounded bg-muted overflow-hidden">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link href={`/store/products/${item.productId}`}>
                          <span className="hover:text-primary cursor-pointer">
                            {item.name}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>${item.price}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item, e.target.value)}
                          className="w-16"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(item.productId)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" asChild>
                <Link href="/store" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Continue Shopping
                </Link>
              </Button>
              <Button variant="destructive" onClick={clearCart}>
                Clear Cart
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-md border p-4 space-y-4">
              <h2 className="font-semibold text-lg">Order Summary</h2>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({totalItems} items)</span>
                  <span>${totalPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>Free</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${totalPrice}</span>
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                onClick={handleCheckout}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Checkout"
                )}
              </Button>
              
              {!isLoggedIn && (
                <p className="text-xs text-muted-foreground text-center">
                  You need to <Link href="/login"><span className="text-primary hover:underline cursor-pointer">login</span></Link> to checkout
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}