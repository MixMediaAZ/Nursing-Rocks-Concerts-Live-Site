import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Eye, EyeOff, RefreshCw, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { HeadersInit } from "node-fetch";

export const CustomCatApiSettings = () => {
  // Added ID to the component for direct scrolling from Quick Actions
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Track authentication state
  const [connectionStatus, setConnectionStatus] = useState<{
    checked: boolean;
    configured: boolean;
    message: string;
    status?: string;
  }>({
    checked: false,
    configured: false,
    message: "Checking connection status...",
  });
  const { toast } = useToast();

  const toggleApiKeyVisibility = () => {
    setShowApiKey(!showApiKey);
  };

  // Helper function to get JWT token auth header
  const getAuthHeader = (): HeadersInit => {
    const token = localStorage.getItem("adminToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch API key on component mount
  useEffect(() => {
    const fetchApiKey = async () => {
      setIsLoading(true);
      try {
        const response = await apiRequest("GET", `/api/settings/CUSTOMCAT_API_KEY`, {
          headers: {
            ...getAuthHeader()
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data && data.value) {
            setApiKey(data.value);
          }
        } else if (response.status === 401 || response.status === 403) {
          toast({
            title: "Authentication Error",
            description: "You don't have permission to access this resource. Please try logging in again.",
            variant: "destructive",
          });
        }
        
        // Check connection status
        checkConnectionStatus();
      } catch (error) {
        console.error("Error fetching API key:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApiKey();
  }, []);

  // Check CustomCat API connection status
  const checkConnectionStatus = async () => {
    try {
      console.log("Checking CustomCat API connection status...");
      const response = await apiRequest("GET", "/api/settings/store/customcat-status", {
        headers: {
          ...getAuthHeader()
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("API status response:", data);
        
        setConnectionStatus({
          checked: true,
          configured: data.configured,
          message: data.message,
          status: data.status
        });

        // If connection was successful, show a toast
        if (data.configured && (data.status === "connected" || data.status === "configured")) {
          toast({
            title: "API Key Configured",
            description: "CustomCat API key is set up correctly",
            variant: "default",
          });
        }
        // If API key is configured but connection failed, show error toast
        else if (data.configured && data.status === "error") {
          toast({
            title: "Connection Warning",
            description: data.message || "API key is configured but we're using simulated data for development",
            variant: "default",
          });
        }
      } else if (response.status === 401 || response.status === 403) {
        setIsAuthenticated(false);
        setConnectionStatus({
          checked: true,
          configured: false,
          message: "Authentication error. Please log in again with admin credentials.",
          status: "error"
        });
        
        toast({
          title: "Authentication Required",
          description: "You need admin access to manage API settings. Please log in as admin.",
          variant: "destructive",
        });
      } else {
        const errorText = await response.text().catch(() => "Unknown error");
        console.error("Error response:", response.status, errorText);
        
        setConnectionStatus({
          checked: true,
          configured: false,
          message: `Error checking connection status: ${response.status}`
        });
        
        toast({
          title: "Connection Check Failed",
          description: `Error: ${response.status} - ${errorText.substring(0, 100)}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error checking connection status:", error);
      setConnectionStatus({
        checked: true,
        configured: false,
        message: `Error checking connection status: ${error instanceof Error ? error.message : "Unknown error"}`
      });
      
      toast({
        title: "Connection Check Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Save the API key
  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter a valid CustomCat API key",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader()
        },
        body: JSON.stringify({
          key: "CUSTOMCAT_API_KEY",
          value: apiKey,
          description: "CustomCat API Key for store integration",
          is_sensitive: true
        })
      });
      
      if (response.ok) {
        toast({
          title: "API Key Saved",
          description: "CustomCat API key has been saved successfully",
          variant: "default",
        });
        
        // Check connection status after saving
        await checkConnectionStatus();
      } else if (response.status === 401 || response.status === 403) {
        toast({
          title: "Authentication Error",
          description: "You don't have permission to save API settings. Please try logging in again.",
          variant: "destructive",
        });
      } else {
        throw new Error("Failed to save API key");
      }
    } catch (error) {
      console.error("Error saving API key:", error);
      toast({
        title: "Error",
        description: "Failed to save CustomCat API key",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Clear the API key
  const clearApiKey = async () => {
    const confirmClear = window.confirm("Are you sure you want to clear the CustomCat API key? This will disable the store integration.");
    
    if (confirmClear) {
      setIsSaving(true);
      try {
        const response = await fetch("/api/settings/CUSTOMCAT_API_KEY", {
          method: "DELETE",
          headers: {
            ...getAuthHeader()
          }
        });
        
        if (response.ok) {
          setApiKey("");
          toast({
            title: "API Key Cleared",
            description: "CustomCat API key has been removed",
            variant: "default",
          });
          
          // Check connection status after clearing
          await checkConnectionStatus();
        } else if (response.status === 401 || response.status === 403) {
          toast({
            title: "Authentication Error",
            description: "You don't have permission to delete API settings. Please try logging in again.",
            variant: "destructive",
          });
        } else {
          throw new Error("Failed to clear API key");
        }
      } catch (error) {
        console.error("Error clearing API key:", error);
        toast({
          title: "Error",
          description: "Failed to clear CustomCat API key",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div id="customcat-api-settings">
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">CustomCat API Integration</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Connect your CustomCat account to automatically populate and manage store products.
          An API key is required for this integration to work.
        </p>
        
        {/* Authentication Warning Alert */}
        {!isAuthenticated && (
          <Alert variant="destructive" className="mb-6 animate-pulse">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              You need to log in as an admin to manage API settings. Please make sure you have admin permissions.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Connection Status Card */}
        <Card className={`mb-6 ${connectionStatus.configured ? 'border-green-500/50 bg-green-50/50' : 'border-amber-500/50 bg-amber-50/50'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              {connectionStatus.configured ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-amber-500" />
              )}
              <div>
                <p className="font-medium">
                  {connectionStatus.configured ? "Connected" : "Not Connected"}
                </p>
                <p className="text-sm text-muted-foreground">{connectionStatus.message}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-auto"
                onClick={checkConnectionStatus}
                disabled={isLoading || isSaving}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Key Input Form */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="apiKey" className="text-base">CustomCat API Key</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                placeholder="Enter your CustomCat API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-10"
                disabled={isLoading || isSaving || !isAuthenticated}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={toggleApiKeyVisibility}
                disabled={isLoading || isSaving || !isAuthenticated}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Your API key is stored securely and never displayed in full after saving.
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={saveApiKey}
            disabled={isLoading || isSaving || !apiKey.trim() || !isAuthenticated}
            className="bg-[#5D3FD3] hover:bg-[#5D3FD3]/90 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save API Key"
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={clearApiKey}
            disabled={isLoading || isSaving || !apiKey.trim() || !isAuthenticated}
          >
            Clear API Key
          </Button>
        </div>
        
        {!isAuthenticated && (
          <p className="text-sm text-red-500 mt-2">
            You must be logged in as an admin to modify API settings
          </p>
        )}
      </div>
    </div>
  );
};

export default CustomCatApiSettings;