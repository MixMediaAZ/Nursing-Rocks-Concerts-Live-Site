import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Eye, EyeOff, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export const CustomCatApiSettings = () => {
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    checked: boolean;
    configured: boolean;
    message: string;
  }>({
    checked: false,
    configured: false,
    message: "Checking connection status...",
  });
  const { toast } = useToast();

  const toggleApiKeyVisibility = () => {
    setShowApiKey(!showApiKey);
  };

  // Fetch API key on component mount
  useEffect(() => {
    const fetchApiKey = async () => {
      setIsLoading(true);
      try {
        const response = await apiRequest("GET", `/api/settings/CUSTOMCAT_API_KEY`);
        const data = await response.json();
        
        if (data && data.value) {
          setApiKey(data.value);
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
      const response = await apiRequest("GET", "/api/settings/store/customcat-status");
      const data = await response.json();
      
      setConnectionStatus({
        checked: true,
        configured: data.configured,
        message: data.message
      });
    } catch (error) {
      console.error("Error checking connection status:", error);
      setConnectionStatus({
        checked: true,
        configured: false,
        message: "Error checking connection status"
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
      await apiRequest("POST", "/api/settings", {
        key: "CUSTOMCAT_API_KEY",
        value: apiKey,
        description: "CustomCat API Key for store integration",
        is_sensitive: true
      });

      toast({
        title: "API Key Saved",
        description: "CustomCat API key has been saved successfully",
        variant: "default",
      });

      // Check connection status after saving
      await checkConnectionStatus();
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
        await apiRequest("DELETE", "/api/settings/CUSTOMCAT_API_KEY");
        
        setApiKey("");
        toast({
          title: "API Key Cleared",
          description: "CustomCat API key has been removed",
          variant: "default",
        });
        
        // Check connection status after clearing
        await checkConnectionStatus();
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
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">CustomCat API Integration</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Connect your CustomCat account to automatically populate and manage store products.
          An API key is required for this integration to work.
        </p>
        
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
                disabled={isLoading || isSaving}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={toggleApiKeyVisibility}
                disabled={isLoading || isSaving}
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
            disabled={isLoading || isSaving || !apiKey.trim()}
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
            disabled={isLoading || isSaving || !apiKey.trim()}
          >
            Clear API Key
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomCatApiSettings;