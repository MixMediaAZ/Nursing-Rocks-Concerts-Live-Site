import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ShoppingCart, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { StoreProduct } from "@shared/schema";
import { EditableImage } from "@/components/editable-image";

interface ProductCardProps {
  product: StoreProduct;
  featured?: boolean;
}

export function StoreProductCard({ product, featured = false }: ProductCardProps) {
  const { toast } = useToast();
  const { addToCart } = useCart();
  
  // Helper function to check if product is out of stock
  const isOutOfStock = (p: StoreProduct): boolean => {
    return p.stock_quantity !== undefined && 
           p.stock_quantity !== null && 
           p.stock_quantity <= 0;
  };

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

  return (
    <Card className={`overflow-hidden transition-all duration-200 hover:shadow-md ${featured ? 'md:col-span-2' : ''}`}>
      <Link href={`/store/product/${product.id}`}>
        <div className="relative h-60 overflow-hidden bg-muted flex items-center justify-center">
          {product.is_featured && !featured && (
            <Badge className="absolute top-2 right-2 z-10" variant="secondary">
              Featured
            </Badge>
          )}
          
          {isOutOfStock(product) && (
            <Badge 
              className="absolute top-2 left-2 z-10" 
              variant="destructive"
            >
              Out of Stock
            </Badge>
          )}
          
          <div className="flex items-center justify-center w-full h-full">
            <EditableImage 
              src={product.image_url || ''} 
              alt={product.name}
              id={product.id} // Add product ID to make each image uniquely identifiable
              className={`max-w-full max-h-full object-contain transition-transform duration-300 hover:scale-105 featured-product-image-${product.id}`} 
              triggerPosition="bottom-right"
              productId={product.id} // Pass product ID as additional prop for context
            />
          </div>
        </div>
        
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-xs text-muted-foreground mb-1 uppercase">
                {product.category}
              </div>
              <h3 className="font-semibold line-clamp-1">{product.name}</h3>
            </div>
            <div className="text-primary font-medium">
              ${product.price}
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        </CardContent>
        
        <CardFooter className="p-4 pt-0 flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = `/store/product/${product.id}`;
            }}
          >
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Button>
          
          <Button 
            size="sm" 
            className="flex-1"
            onClick={handleAddToCart}
            disabled={isOutOfStock(product)}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        </CardFooter>
      </Link>
    </Card>
  );
}