import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { StoreProductCard } from "@/components/store/product-card";
import { 
  ArrowLeft, 
  ShoppingCart, 
  Loader2, 
  Check, 
  AlertTriangle, 
  InfoIcon,
  Tag,
  Calendar,
  Share2,
  Heart
} from "lucide-react";
import { StoreProduct } from "@shared/schema";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const productId = id ? parseInt(id, 10) : 0;
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();
  const { addToCart } = useCart();

  // Fetch product details
  const { 
    data: product, 
    isLoading, 
    error 
  } = useQuery<StoreProduct>({
    queryKey: ["/api/store/products", productId],
    queryFn: async () => {
      const response = await fetch(`/api/store/products/${productId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch product details');
      }
      return response.json();
    },
    enabled: !isNaN(productId)
  });

  // Fetch similar products in the same category
  const { 
    data: similarProducts 
  } = useQuery<StoreProduct[]>({
    queryKey: ["/api/store/products/category", product?.category],
    queryFn: async () => {
      if (!product?.category) {
        return [];
      }
      const response = await fetch(`/api/store/products/category/${product.category}`);
      if (!response.ok) {
        throw new Error('Failed to fetch similar products');
      }
      return response.json();
    },
    enabled: !!product?.category
  });

  const filteredSimilarProducts = similarProducts?.filter(p => p.id !== productId).slice(0, 4) || [];
  
  const handleAddToCart = () => {
    if (product) {
      addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.image_url || '',
        quantity: quantity
      });
      
      toast({
        title: "Added to cart",
        description: `${product.name} (x${quantity}) added to your cart`,
      });
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setQuantity(value);
    }
  };

  const stockQuantity = product?.stock_quantity || 0;
  const isOutOfStock = stockQuantity <= 0;
  const lowStock = stockQuantity > 0 && stockQuantity < 5;

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-md w-full" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">Product not found</h3>
          <p className="text-muted-foreground mb-6">
            We couldn't find the product you're looking for.
          </p>
          <Button asChild>
            <Link href="/store">
              Return to Store
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Button variant="outline" size="sm" asChild className="mb-6">
        <Link href="/store" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Store
        </Link>
      </Button>
      
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Product Image */}
        <div className="bg-muted rounded-lg overflow-hidden">
          <img 
            src={product.image_url || ''} 
            alt={product.name}
            className="w-full h-auto object-cover aspect-square"
          />
        </div>
        
        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between mb-2">
              <Badge variant="outline" className="mb-2">
                {product.category}
              </Badge>
              
              {product.is_featured && (
                <Badge className="ml-2" variant="secondary">
                  Featured
                </Badge>
              )}
            </div>
            
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <p className="text-2xl font-bold text-primary">${product.price}</p>
          </div>
          
          <div className="border-t border-b py-4">
            <p className="text-muted-foreground">
              {product.description}
            </p>
          </div>
          
          {/* Inventory Status */}
          <div>
            {isOutOfStock ? (
              <div className="flex items-center text-destructive gap-2 mb-4">
                <AlertTriangle className="h-4 w-4" />
                <span>Out of Stock</span>
              </div>
            ) : lowStock ? (
              <div className="flex items-center text-amber-500 gap-2 mb-4">
                <InfoIcon className="h-4 w-4" />
                <span>Low Stock (Only {product.stock_quantity} left)</span>
              </div>
            ) : (
              <div className="flex items-center text-green-500 gap-2 mb-4">
                <Check className="h-4 w-4" />
                <span>In Stock</span>
              </div>
            )}
          </div>
          
          {/* Add to Cart Section */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-24">
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={handleQuantityChange}
                  disabled={isOutOfStock}
                />
              </div>
              
              <Button 
                onClick={handleAddToCart} 
                className="flex-1"
                disabled={isOutOfStock}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
            </div>
            
            {/* Product Meta */}
            <div className="pt-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                <span>Category: {product.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Added: {new Date(product.created_at || '').toLocaleDateString()}</span>
              </div>
            </div>
            
            {/* Social Actions */}
            <div className="flex items-center gap-2 pt-4">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Similar Products */}
      {filteredSimilarProducts.length > 0 && (
        <div className="border-t pt-8">
          <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {filteredSimilarProducts.map((similarProduct) => (
              <StoreProductCard key={similarProduct.id} product={similarProduct} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}