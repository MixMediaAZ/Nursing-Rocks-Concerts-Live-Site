import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Download, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { HeadersInit } from "node-fetch";

interface SyncResult {
  success: boolean;
  message: string;
  results?: {
    total: number;
    added: number;
    updated: number;
    skipped: number;
    errors: number;
  };
}

export const ProductSyncTool = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const { toast } = useToast();

  // Helper function to get JWT token auth header
  const getAuthHeader = (): HeadersInit => {
    const token = localStorage.getItem("adminToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const syncProducts = async () => {
    if (!confirm("This will sync products from CustomCat to your store. Continue?")) {
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);
    
    try {
      const response = await fetch("/api/store/customcat/sync-products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader()
        }
      });
      
      if (!response.ok) {
        let errorMessage = "Failed to sync products";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If JSON parsing fails, use default error message
        }
        
        setSyncResult({
          success: false,
          message: errorMessage
        });
        
        if (response.status === 401 || response.status === 403) {
          toast({
            title: "Authentication Error",
            description: "You don't have permission to sync products. Please try logging in again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sync Failed",
            description: errorMessage,
            variant: "destructive",
          });
        }
        return;
      }
      
      const data = await response.json();
      setSyncResult(data);
      
      toast({
        title: "Products Synced",
        description: `Successfully synced ${data.results?.total || 0} products from CustomCat`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error syncing products:", error);
      setSyncResult({
        success: false,
        message: "An error occurred while syncing products"
      });
      
      toast({
        title: "Sync Error",
        description: "An error occurred while syncing products from CustomCat",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" /> Product Synchronization
        </CardTitle>
        <CardDescription>
          Sync your CustomCat products to populate your store with merchandise offerings
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {syncResult && (
            <Alert variant={syncResult.success ? "default" : "destructive"}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {syncResult.success ? "Sync Completed" : "Sync Failed"}
              </AlertTitle>
              <AlertDescription>
                {syncResult.message}
                {syncResult.success && syncResult.results && (
                  <div className="mt-2 space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Total Products:</span> {syncResult.results.total}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Added:</span> {syncResult.results.added}
                      </div>
                      <div>
                        <span className="font-medium">Updated:</span> {syncResult.results.updated}
                      </div>
                      <div>
                        <span className="font-medium">Skipped:</span> {syncResult.results.skipped}
                      </div>
                      <div>
                        <span className="font-medium">Errors:</span> {syncResult.results.errors}
                      </div>
                    </div>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              This will fetch all products from your CustomCat account and import them into your store.
              Products are matched by their CustomCat ID to avoid duplicates.
            </p>
            
            {isSyncing && (
              <div className="py-4 space-y-2">
                <Progress value={45} className="h-2" />
                <p className="text-sm text-center text-muted-foreground animate-pulse">
                  Syncing products from CustomCat...
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={syncProducts}
          disabled={isSyncing}
          className="bg-white"
        >
          {isSyncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Products
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductSyncTool;