import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ShoppingCart, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { StoreProduct } from "@shared/schema";

interface ProductCardProps {
  product: StoreProduct;
}

export function StoreProductCard({ product }: ProductCardProps) {
  const { toast } = useToast();
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.image_url || '',
      quantity: 1
    });
    
    toast({
      title: "Added to cart",
      description: `${product.name} added to your cart`,
    });
  };

  const isOutOfStock = product.stock_quantity !== null && product.stock_quantity <= 0;

  return (
    <Link href={`/store/products/${product.id}`}>
      <Card className="overflow-hidden group transition-all duration-300 hover:shadow-md cursor-pointer h-full flex flex-col">
        <div className="relative">
          <div className="aspect-square overflow-hidden bg-muted">
            <img
              src={product.image_url || ''}
              alt={product.name}
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          
          {product.is_featured && (
            <Badge className="absolute top-2 left-2" variant="secondary">
              Featured
            </Badge>
          )}
          
          {isOutOfStock && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Badge variant="destructive" className="text-sm">Out of Stock</Badge>
            </div>
          )}
        </div>
        
        <CardContent className="p-4 flex-grow">
          <div className="space-y-1">
            <Badge variant="outline" className="mb-1">
              {product.category}
            </Badge>
            <h3 className="font-medium group-hover:text-primary transition-colors line-clamp-2">
              {product.name}
            </h3>
            <p className="text-primary font-bold">${product.price}</p>
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0">
          <Button 
            variant="secondary" 
            size="sm" 
            className="w-full"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}