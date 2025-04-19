import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { StoreProductCard } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  ShoppingCart,
  Heart,
  Star,
  TruckIcon,
  ArrowLeft,
  Loader2,
  Info,
  BadgeCheck,
  ShieldCheck,
} from "lucide-react";
import { StoreProduct } from "@shared/schema";

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const productId = parseInt(id, 10);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToCart } = useCart();
  const { toast } = useToast();

  // Fetch product details
  const {
    data: product,
    isLoading,
    error,
  } = useQuery<StoreProduct>({
    queryKey: [`/api/store/products/${productId}`],
    queryFn: async () => {
      const response = await fetch(`/api/store/products/${productId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch product details');
      }
      return response.json();
    },
    enabled: !isNaN(productId),
  });

  // Fetch similar products
  const { data: similarProducts } = useQuery<StoreProduct[]>({
    queryKey: ['/api/store/products/category', product?.category],
    queryFn: async () => {
      const response = await fetch(`/api/store/products/category/${product?.category}`);
      if (!response.ok) {
        throw new Error('Failed to fetch similar products');
      }
      return response.json();
    },
    enabled: !!product?.category,
  });

  const handleAddToCart = () => {
    if (!product) return;
    
    setIsAddingToCart(true);
    
    setTimeout(() => {
      addToCart({
        productId: product.id,
        name: product.name,
        price: product.price.toString(),
        imageUrl: product.image_url || '/placeholder-product.jpg',
        quantity: quantity,
      });
      
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      });
      
      setIsAddingToCart(false);
    }, 600);
  };

  const isOutOfStock = (p?: StoreProduct): boolean => {
    if (!p) return false;
    return p.stock_quantity !== undefined && p.stock_quantity !== null && p.stock_quantity <= 0;
  };

  if (isLoading) {
    return (
      <div className="container py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The product you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild>
          <Link href="/store">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Store
          </Link>
        </Button>
      </div>
    );
  }

  // Filter out the current product from similar products
  const filteredSimilarProducts = similarProducts
    ? similarProducts.filter(p => p.id !== product.id).slice(0, 4)
    : [];

  return (
    <div className="container py-8">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-muted-foreground mb-8">
        <Link href="/store">
          <span className="hover:text-primary cursor-pointer">Store</span>
        </Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <Link href={`/store/category/${product.category}`}>
          <span className="hover:text-primary cursor-pointer capitalize">
            {product.category}
          </span>
        </Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {/* Product Image */}
        <div className="rounded-lg overflow-hidden bg-muted aspect-square relative">
          {product.is_featured && (
            <Badge className="absolute top-4 left-4 z-10">Featured</Badge>
          )}
          {isOutOfStock(product) && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
              <Badge variant="destructive" className="text-lg py-2 px-4">Out of Stock</Badge>
            </div>
          )}
          <img
            src={product.image_url || '/placeholder-product.jpg'}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-2xl font-bold">${Number(product.price).toFixed(2)}</span>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= 4 // Default rating of 4 stars
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-muted"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                24 reviews
              </span>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-muted-foreground mb-4">
              {product.description || "No description available."}
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-primary" />
                <span className="text-sm">
                  {isOutOfStock(product) ? "Currently out of stock" : "In stock and ready to ship"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TruckIcon className="h-5 w-5 text-primary" />
                <span className="text-sm">Free shipping on orders over $50</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span className="text-sm">30-day return policy</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Add to Cart Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={isOutOfStock(product)}
                >
                  <span className="text-lg">-</span>
                </Button>
                <div className="w-12 text-center font-medium">{quantity}</div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={isOutOfStock(product)}
                >
                  <span className="text-lg">+</span>
                </Button>
              </div>
              <div className="flex-1">
                <Button
                  className="w-full"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || isOutOfStock(product)}
                >
                  {isAddingToCart ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to Cart
                    </>
                  )}
                </Button>
              </div>
              <Button variant="ghost" size="icon">
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            {isOutOfStock(product) && (
              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                <Info className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm">
                    This item is currently out of stock. Sign up to be notified when it's back in stock.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Tabs */}
      <Tabs defaultValue="details" className="mb-16">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="shipping">Shipping & Returns</TabsTrigger>
          <TabsTrigger value="reviews">Customer Reviews</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-4">
          <h3 className="text-lg font-medium">Product Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-muted-foreground">
                {product.description || "No description available."}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Features</h4>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                <li>Premium quality materials</li>
                <li>Nursing Rocks branded</li>
                <li>Supports healthcare scholarships</li>
                <li>Limited edition design</li>
              </ul>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="shipping" className="space-y-4">
          <h3 className="text-lg font-medium">Shipping & Returns</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Shipping Information</h4>
              <p className="text-muted-foreground mb-2">
                Orders typically ship within 1-2 business days. Free shipping is available on all orders over $50. 
                Standard shipping typically takes 3-7 business days.
              </p>
              <p className="text-muted-foreground">
                Express shipping options are available at checkout for an additional fee.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Return Policy</h4>
              <p className="text-muted-foreground">
                We offer a 30-day return policy on most items. Products must be returned in their original condition 
                and packaging. Please note that shipping costs are non-refundable.
              </p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="reviews" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Customer Reviews</h3>
            <Button variant="outline" size="sm">Write a Review</Button>
          </div>
          
          {true ? ( // Always show reviews
            <div className="space-y-6">
              {/* Sample reviews - in a real app, these would come from the API */}
              <Card className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium">Jane D.</div>
                    <div className="text-sm text-muted-foreground">Purchased 2 months ago</div>
                  </div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= 5 ? "text-yellow-400 fill-yellow-400" : "text-muted"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm">
                  Absolutely love this! Great quality and the design is beautiful. Will definitely be ordering more for my nursing colleagues.
                </p>
              </Card>
              
              <Card className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium">Michael R.</div>
                    <div className="text-sm text-muted-foreground">Purchased 1 month ago</div>
                  </div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= 4 ? "text-yellow-400 fill-yellow-400" : "text-muted"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm">
                  Good quality and fast shipping. The only reason I'm not giving 5 stars is because it was a bit smaller than I expected.
                </p>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                This product doesn't have any reviews yet. Be the first to leave one!
              </p>
              <Button>Write a Review</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Similar Products */}
      {filteredSimilarProducts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">You Might Also Like</h2>
            <Button asChild variant="outline">
              <Link href={`/store/category/${product.category}`}>
                View All
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredSimilarProducts.map((similarProduct) => (
              <StoreProductCard key={similarProduct.id} product={similarProduct} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}