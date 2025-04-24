import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import ProductSyncTool from "@/components/admin/product-sync-tool";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProductSyncPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if admin token exists
    const adminToken = localStorage.getItem("adminToken");
    setIsAdmin(!!adminToken);
    
    if (!adminToken) {
      toast({
        title: "Authentication Required",
        description: "You need to log in as an admin to access this page.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const goBack = () => {
    window.history.back();
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-12">
        <Helmet>
          <title>Admin Access Required - Nursing Rocks</title>
        </Helmet>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
              <p className="mb-6">Please log in as an admin to access the product synchronization tool.</p>
              <div className="flex justify-center gap-4">
                <Button onClick={() => window.location.href = "/admin"}>
                  Go to Admin Login
                </Button>
                <Button variant="outline" onClick={goBack}>
                  Go Back
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12">
      <Helmet>
        <title>Product Synchronization - Nursing Rocks</title>
      </Helmet>
      
      <div className="mb-6 flex items-center">
        <Button variant="ghost" className="mr-2" onClick={goBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Product Synchronization</h1>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <ProductSyncTool />
        
        <div className="mt-8 text-sm text-muted-foreground">
          <p>This tool allows you to synchronize your CustomCat product catalog with your Nursing Rocks store.</p>
          <p className="mt-2">Products will be matched by their CustomCat ID to avoid duplicates.</p>
        </div>
      </div>
    </div>
  );
}