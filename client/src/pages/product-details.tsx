import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { 
  ChevronLeft, 
  Loader2, 
  MinusCircle, 
  PlusCircle, 
  Share2, 
  ShoppingCart, 
  Tag 
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { StoreProduct } from "@shared/schema";
import { useCart } from "@/hooks/use-cart";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  // Fetch product details
  const { data: product, isLoading, error } = useQuery<StoreProduct>({
    queryKey: [`/api/store/products/${id}`],
  });

  // Fetch products in same category for related products
  const { data: relatedProducts } = useQuery<StoreProduct[]>({
    queryKey: ['/api/store/products'],
    enabled: !!product,
    select: (data) => data.filter(p => p.id !== product?.id && p.category === product?.category).slice(0, 4)
  });

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity > 0 && (!product?.stock_quantity || newQuantity <= product.stock_quantity)) {
      setQuantity(newQuantity);
    }
  };

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
        description: `${quantity} x ${product.name} added to your cart`,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Product not found</h2>
        <p className="text-muted-foreground mb-6">
          The product you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild>
          <Link href="/store">Back to Store</Link>
        </Button>
      </div>
    );
  }

  const isOutOfStock = product.stock_quantity !== null && product.stock_quantity <= 0;

  return (
    <div className="container py-8">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/store">Store</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/store/category/${product.category}`}>{product.category}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>{product.name}</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="relative">
          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-4">
            <img 
              src={product.image_url || ''}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {product.is_featured && (
            <Badge className="absolute top-4 left-4" variant="secondary">
              Featured
            </Badge>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <Link href={`/store/category/${product.category}`}>
              <Badge className="mb-2 cursor-pointer" variant="outline">
                {product.category}
              </Badge>
            </Link>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-2xl font-bold text-primary mt-2">${product.price}</p>
          </div>

          <Separator />

          {product.description && (
            <div>
              <h3 className="text-lg font-medium mb-2">Description</h3>
              <p className="text-muted-foreground">{product.description}</p>
            </div>
          )}

          <div className="pt-4">
            {isOutOfStock ? (
              <div className="bg-destructive/10 text-destructive rounded-md py-2 px-3 mb-4">
                Currently out of stock
              </div>
            ) : (
              <>
                <div className="flex items-center mb-4">
                  <span className="text-sm font-medium mr-3">Quantity:</span>
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                    >
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                    <span className="mx-3 text-center w-8">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={product.stock_quantity !== null && quantity >= product.stock_quantity}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  {product.stock_quantity !== null && (
                    <span className="text-sm text-muted-foreground ml-4">
                      {product.stock_quantity} available
                    </span>
                  )}
                </div>
                <Button 
                  className="w-full sm:w-auto mr-2 mb-2"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
              </>
            )}
            <Button variant="outline" className="w-full sm:w-auto mb-2">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>

          {product.is_featured && (
            <div className="bg-muted rounded-lg p-4 mt-4">
              <div className="flex items-start">
                <Tag className="h-5 w-5 text-primary mr-2 mt-0.5" />
                <div>
                  <p className="font-medium">Limited Edition</p>
                  <p className="text-sm text-muted-foreground">
                    This is a featured item from our Nursing Rocks collection.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {relatedProducts && relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">You may also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((related) => (
              <Link key={related.id} href={`/store/products/${related.id}`}>
                <div className="group cursor-pointer">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3">
                    <img 
                      src={related.image_url || ''}
                      alt={related.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <h3 className="font-medium group-hover:text-primary transition-colors">
                    {related.name}
                  </h3>
                  <p className="text-primary font-semibold">${related.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}