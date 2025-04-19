import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Heart, Gift, Send, Loader2 } from "lucide-react";
import { StoreProduct } from "@shared/schema";

export function SupportANurse() {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [sendAsGift, setSendAsGift] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { addToCart } = useCart();

  // Fetch featured support-a-nurse products
  const { data: products, isLoading } = useQuery<StoreProduct[]>({
    queryKey: ['/api/store/products/category/support-a-nurse'],
    queryFn: async () => {
      const response = await fetch('/api/store/products/category/support-a-nurse');
      if (!response.ok) {
        throw new Error('Failed to fetch support-a-nurse products');
      }
      return response.json();
    }
  });

  const handleGiftSubmit = async (productId: number, productName: string, price: string, imageUrl: string) => {
    if (sendAsGift && (!recipientEmail || !recipientName)) {
      toast({
        title: "Please fill in all fields",
        description: "Recipient name and email are required when sending as a gift.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Add item to cart with gift information if needed
      addToCart({
        productId,
        name: productName,
        price,
        imageUrl,
        quantity: 1,
        ...(sendAsGift && {
          isGift: true,
          giftRecipient: recipientName,
          giftRecipientEmail: recipientEmail,
          giftMessage: personalMessage
        })
      });

      toast({
        title: "Added to cart!",
        description: sendAsGift 
          ? `Gift for ${recipientName} has been added to your cart.` 
          : "Item has been added to your cart.",
      });

      // Reset form if it was a gift
      if (sendAsGift) {
        setRecipientEmail("");
        setRecipientName("");
        setPersonalMessage("");
        setSendAsGift(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem adding this item to your cart.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center max-w-3xl mx-auto">
        <div className="flex justify-center mb-4">
          <div className="p-2 bg-primary/10 rounded-full">
            <Heart className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-2">Support a Nurse</h2>
        <p className="text-muted-foreground">
          Purchase special merchandise to support nursing professionals. You can buy for yourself or send as a gift to a nurse who made a difference in your life.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !products || products.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No support-a-nurse products found. Please check back later.</p>
          </div>
        ) : (
          products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div 
                className="h-48 bg-cover bg-center" 
                style={{ backgroundImage: `url(${product.image_url})` }}
              />
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                <CardDescription>
                  {product.description?.substring(0, 100)}
                  {product.description && product.description.length > 100 ? "..." : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold">${product.price}</span>
                  <span className="text-sm bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                    Support a Nurse
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <Checkbox 
                    id={`gift-${product.id}`} 
                    checked={sendAsGift} 
                    onCheckedChange={(checked) => setSendAsGift(checked as boolean)} 
                  />
                  <Label 
                    htmlFor={`gift-${product.id}`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    Send as a gift to a nurse
                  </Label>
                </div>

                {sendAsGift && (
                  <div className="mt-4 space-y-3 bg-slate-50 p-3 rounded-md">
                    <div className="grid gap-1.5">
                      <Label htmlFor="recipient-name">Nurse's Name</Label>
                      <Input 
                        id="recipient-name" 
                        placeholder="Enter recipient's name"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="recipient-email">Nurse's Email</Label>
                      <Input 
                        id="recipient-email" 
                        type="email"
                        placeholder="Enter recipient's email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="personal-message">Personal Message (Optional)</Label>
                      <Textarea 
                        id="personal-message" 
                        placeholder="Add a personal thank you message..."
                        value={personalMessage}
                        onChange={(e) => setPersonalMessage(e.target.value)}
                        className="resize-none"
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button 
                  className="w-full gap-2" 
                  onClick={() => handleGiftSubmit(product.id, product.name, product.price, product.image_url || '')}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : sendAsGift ? (
                    <>
                      <Gift className="h-4 w-4" />
                      Send as Gift
                    </>
                  ) : (
                    <>
                      <Heart className="h-4 w-4" />
                      Add to Cart
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  asChild
                >
                  <Link href={`/store/products/${product.id}`}>View Details</Link>
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      <Separator className="my-8" />

      <div className="bg-primary/5 rounded-lg p-6 max-w-3xl mx-auto">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-primary/10 rounded-full flex-shrink-0 mt-1">
            <Send className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Nominate a Nurse</h3>
            <p className="text-muted-foreground mb-4">
              Know a nurse who deserves recognition? Nominate them to receive a free Support-a-Nurse gift package sponsored by our partners.
            </p>
            <Button asChild>
              <Link href="/store/nominate-nurse">Nominate a Nurse</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}