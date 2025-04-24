import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { 
  Key, 
  KeyRound, 
  Delete,
  LayoutDashboard, 
  Settings, 
  Calendar, 
  ImageIcon, 
  Music, 
  Users, 
  Store, 
  FileEdit, 
  Lock,
  Edit,
  LogOut,
  Shield
} from "lucide-react";
import CustomCatApiSettings from "@/components/admin/custom-cat-api-settings";
import ProductSyncTool from "@/components/admin/product-sync-tool";

// Admin PIN setup - in production, this should be stored securely
const ADMIN_PIN = "1234567";

export default function AdminPage() {
  const [pin, setPin] = useState<string>("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Check existing authentication
  useEffect(() => {
    // For development - set to true to bypass authentication
    const bypassAuth = true;

    if (bypassAuth) {
      // Set admin authentication for testing
      localStorage.setItem("adminToken", "test-token");
      localStorage.setItem("isAdmin", "true");
      localStorage.setItem("adminPinVerified", "true");
      setAuthenticated(true);
    } else {
      // Check if user has already been authenticated
      const isAdmin = localStorage.getItem("isAdmin") === "true";
      const adminPinVerified = localStorage.getItem("adminPinVerified") === "true";
      
      if (isAdmin || adminPinVerified) {
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
        setPin("");
      }
    }
  }, []);

  const handlePinInput = (digit: string) => {
    if (pin.length < 7) {
      const newPin = pin + digit;
      setPin(newPin);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin("");
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      if (pin === ADMIN_PIN) {
        // Request a JWT token from the server
        const response = await fetch('/api/admin/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pin }),
        });
        
        if (response.ok) {
          const { token } = await response.json();
          
          // Store the token in localStorage for API requests
          localStorage.setItem("adminToken", token);
          localStorage.setItem("isAdmin", "true");
          // Also set the flag for admin PIN verification for gallery access
          localStorage.setItem("adminPinVerified", "true");
          
          setAuthenticated(true);
          toast({
            title: "Authentication Successful",
            description: "Welcome to the admin dashboard",
            variant: "default",
          });
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to authenticate');
        }
      } else {
        toast({
          title: "Authentication Failed",
          description: "Invalid PIN code. Please try again.",
          variant: "destructive",
        });
        setPin("");
      }
    } catch (error) {
      console.error('Admin authentication error:', error);
      toast({
        title: "Authentication Failed",
        description: error.message || "An error occurred during authentication.",
        variant: "destructive",
      });
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear authentication state
    setAuthenticated(false);
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("adminPinVerified");
    localStorage.removeItem("adminToken");
    
    // Also clear editing mode state
    localStorage.removeItem("editMode");
    
    // Reset PIN input
    setPin("");
    
    toast({
      title: "Logged Out",
      description: "You have been logged out of the admin dashboard and editing mode has been disabled",
      variant: "default",
    });
    
    // Small delay before redirecting to home page
    setTimeout(() => {
      window.location.href = "/";
    }, 1500);
  };

  // PIN pad component
  const PinPad = () => (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <Card className="w-full max-w-md mx-auto bg-white shadow-xl">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <Lock className="h-6 w-6 text-primary" /> Admin Authentication
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Enter your 7-digit PIN to access admin dashboard</p>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex justify-center mb-8">
            <div className="flex gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`w-9 h-12 border-2 rounded-md flex items-center justify-center text-xl font-bold transition-all
                    ${pin[i] ? "border-primary bg-primary/10" : "border-gray-300"}`}
                >
                  {pin[i] ? "•" : ""}
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <Button 
                key={num} 
                variant="outline" 
                className="h-16 text-xl font-semibold hover:bg-primary/5 hover:border-primary/50 active:scale-95 transition-all"
                onClick={() => handlePinInput(num.toString())}
              >
                {num}
              </Button>
            ))}
            <Button 
              variant="outline" 
              className="h-16 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 active:scale-95 transition-all"
              onClick={handleClear}
            >
              Clear
            </Button>
            <Button 
              variant="outline" 
              className="h-16 text-xl font-semibold hover:bg-primary/5 hover:border-primary/50 active:scale-95 transition-all"
              onClick={() => handlePinInput("0")}
            >
              0
            </Button>
            <Button 
              variant="outline" 
              className="h-16 flex items-center justify-center hover:bg-primary/5 hover:border-primary/50 active:scale-95 transition-all"
              onClick={handleBackspace}
            >
              <Delete className="h-6 w-6" />
            </Button>
          </div>
          
          <Button 
            className="w-full h-14 mt-2 text-lg font-bold bg-[#5D3FD3] hover:bg-[#5D3FD3]/90 text-white shadow-md hover:shadow-lg transition-all"
            onClick={handleSubmit}
            disabled={pin.length !== 7 || loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <KeyRound className="w-5 h-5" /> Sign In
              </span>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  // Admin Dashboard Component
  const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState("overview");
    
    // Admin mode state - controls access to editing features
    const [isAdminMode, setIsAdminMode] = useState(true);
    
    // PIN verification dialog state
    const [showPinDialog, setShowPinDialog] = useState(false);
    const [pinInput, setPinInput] = useState("");
    
    // Direct navigation to gallery with admin access
    const openGalleryWithAdminAccess = () => {
      localStorage.setItem("adminPinVerified", "true");
      window.location.href = "/gallery";
    };
    
    // Direct navigation to store settings for CustomCat integration
    const openCustomCatSettings = () => {
      setActiveTab("store");
    };
    
    // Check if element editing mode is active
    const [isEditModeActive, setIsEditModeActive] = useState(
      localStorage.getItem("editMode") === "true"
    );
    
    // Open live site in admin mode for editing
    const openLiveSiteInAdminMode = (editMode = true) => {
      localStorage.setItem("isAdmin", "true");
      localStorage.setItem("adminPinVerified", "true");
      localStorage.setItem("editMode", editMode ? "true" : "false");
      setIsEditModeActive(editMode);
      
      if (editMode) {
        window.location.href = "/";
      } else {
        toast({
          title: "Element Edit Mode Disabled",
          description: "Element editing has been turned off",
          variant: "default",
        });
      }
    };

    // Function to handle PIN verification for admin mode toggle
    const handleVerifyPinForAdminMode = () => {
      if (pinInput === ADMIN_PIN) {
        setIsAdminMode(true);
        setShowPinDialog(false);
        setPinInput("");
        
        toast({
          title: "Admin Mode Activated",
          description: "You now have full admin editing capabilities",
          variant: "default",
        });
      } else {
        toast({
          title: "Invalid PIN",
          description: "The PIN you entered is incorrect",
          variant: "destructive",
        });
        setPinInput("");
      }
    };
    
    return (
      <div className="flex flex-col">
        {/* Admin Mode Toggle Bar */}
        <div className="w-full mb-6 p-4 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden">
          <div className="flex flex-wrap justify-between items-center gap-y-3">
            <div className="flex items-center flex-shrink-0">
              <Badge variant={isAdminMode ? "default" : "outline"} className="mr-2 py-1.5">
                <Shield className="h-4 w-4 mr-1" /> ADMIN
              </Badge>
              
              <span className="text-sm font-medium mr-3">
                Mode: <span className="font-bold">{isAdminMode ? "Active" : "Inactive"}</span>
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2 bg-white py-1 px-3 rounded-full border flex-shrink-0">
                <Label htmlFor="admin-mode-toggle" className="text-sm whitespace-nowrap">
                  Admin Mode
                </Label>
                <Switch
                  id="admin-mode-toggle"
                  checked={isAdminMode}
                  onCheckedChange={(checked) => {
                    if (!checked) {
                      // Turning admin mode off
                      setIsAdminMode(false);
                      localStorage.removeItem("adminToken");
                      toast({
                        title: "Admin Mode Disabled",
                        description: "You have exited admin mode. PIN will be required to re-enter.",
                        variant: "default",
                      });
                    } else {
                      // Show PIN dialog to re-enable admin mode
                      setShowPinDialog(true);
                    }
                  }}
                />
              </div>
              
              <Button 
                variant="destructive"
                onClick={handleLogout}
                className="flex items-center gap-2 flex-shrink-0 h-9 px-4"
              >
                <LogOut className="h-4 w-4 mr-1" /> Logout
              </Button>
            </div>
          </div>
        </div>
        
        {/* Admin Active Status Alert */}
        {isAdminMode && (
          <Alert className="mb-4 bg-green-50 border-green-300">
            <LayoutDashboard className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-800 font-bold">Admin Mode Active</AlertTitle>
            <AlertDescription className="text-green-700">
              You are currently signed in as an administrator with full editing capabilities.
              All dashboard features are available. Use the toggle above to exit admin mode.
            </AlertDescription>
          </Alert>
        )}
        
        {/* PIN Verification Dialog */}
        <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" /> Enter Admin PIN
              </DialogTitle>
              <DialogDescription>
                Please enter your 7-digit admin PIN to enable admin mode
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex justify-center my-4">
              <div className="flex gap-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-8 h-11 border-2 rounded-md flex items-center justify-center text-xl font-bold transition-all
                      ${pinInput[i] ? "border-primary bg-primary/10" : "border-gray-300"}`}
                  >
                    {pinInput[i] ? "•" : ""}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <Button 
                  key={num} 
                  variant="outline" 
                  className="h-12 text-lg font-semibold hover:bg-primary/5 hover:border-primary/50"
                  onClick={() => {
                    if (pinInput.length < 7) {
                      setPinInput(prev => prev + num.toString());
                    }
                  }}
                >
                  {num}
                </Button>
              ))}
              <Button 
                variant="outline" 
                className="h-12 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => setPinInput("")}
              >
                Clear
              </Button>
              <Button 
                variant="outline" 
                className="h-12 text-lg font-semibold hover:bg-primary/5 hover:border-primary/50"
                onClick={() => {
                  if (pinInput.length < 7) {
                    setPinInput(prev => prev + "0");
                  }
                }}
              >
                0
              </Button>
              <Button 
                variant="outline" 
                className="h-12 flex items-center justify-center hover:bg-primary/5 hover:border-primary/50"
                onClick={() => setPinInput(prev => prev.slice(0, -1))}
              >
                <Delete className="h-5 w-5" />
              </Button>
            </div>
            
            <DialogFooter>
              <Button
                className="w-full bg-primary"
                disabled={pinInput.length !== 7}
                onClick={handleVerifyPinForAdminMode}
              >
                <KeyRound className="h-4 w-4 mr-2" /> Verify PIN
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <div className="flex flex-wrap justify-between items-center gap-y-4 mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-7 w-7" /> Admin Dashboard
          </h1>
          
          {/* Live Editing Toggle - only shown when admin mode is active */}
          {isAdminMode && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2 p-2 rounded-md bg-slate-50 border border-slate-200 min-w-[160px]">
                <Switch
                  id="edit-mode"
                  checked={isEditModeActive}
                  onCheckedChange={(checked) => {
                    openLiveSiteInAdminMode(checked);
                    toast({
                      title: checked ? "Element Edit Mode Enabled" : "Element Edit Mode Disabled",
                      description: checked ? "You can now edit elements on the site" : "Element editing has been turned off",
                      variant: "default",
                    });
                  }}
                />
                <Label htmlFor="edit-mode" className="flex items-center gap-1 text-sm font-medium whitespace-nowrap">
                  <Edit className="h-4 w-4" /> Live Edit Mode
                </Label>
              </div>
              
              <Button 
                variant="default"
                size="sm"
                className="bg-primary"
                onClick={() => openLiveSiteInAdminMode(true)}
              >
                <Edit className="h-4 w-4 mr-1" /> Open Editor
              </Button>
            </div>
          )}
        </div>

        <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2 md:grid-cols-7 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="editor">
              <div className="flex items-center gap-1">
                <Edit className="h-4 w-4" /> Editor
              </div>
            </TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="store">Store</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Element Editing Card */}
              <Card 
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${isEditModeActive ? "bg-primary/5 border-primary/50" : "hover:border-primary"}`}
                onClick={() => {
                  openLiveSiteInAdminMode(true);
                  toast({
                    title: "Opening Live Site",
                    description: "Opening site with editing enabled...",
                    variant: "default",
                  });
                }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5" /> Element Editor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold">{isEditModeActive ? "Enabled" : "Disabled"}</p>
                      <p className="text-sm text-muted-foreground">Visual element editor</p>
                    </div>
                    <Switch
                      checked={isEditModeActive}
                      onCheckedChange={(checked) => {
                        openLiveSiteInAdminMode(checked);
                      }}
                    />
                  </div>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto mt-2" 
                  >
                    Open Editor
                  </Button>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:border-primary transition-all duration-200 hover:shadow-md"
                onClick={() => setActiveTab("events")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" /> Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">4</p>
                  <p className="text-sm text-muted-foreground">Upcoming events</p>
                  <Button variant="link" className="p-0 h-auto mt-2">
                    Manage Events
                  </Button>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:border-primary transition-all duration-200 hover:shadow-md"
                onClick={() => setActiveTab("store")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" /> Store
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">23</p>
                  <p className="text-sm text-muted-foreground">Products</p>
                  <Button variant="link" className="p-0 h-auto mt-2">
                    Manage Store
                  </Button>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:border-primary transition-all duration-200 hover:shadow-md"
                onClick={() => setActiveTab("users")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" /> Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">152</p>
                  <p className="text-sm text-muted-foreground">Registered users</p>
                  <Button variant="link" className="p-0 h-auto mt-2">
                    Manage Users
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            {/* Admin Action Cards Section */}
            <div className="mt-6 mb-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="M11 4h10"/><path d="M11 12h10"/><path d="M11 20h10"/></svg>
                Admin Actions
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="hover:shadow-md transition-all duration-200 border-primary/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileEdit className="h-5 w-5 text-primary" /> Edit Website Content
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Start editing website content directly on the live pages
                    </p>
                    <Button 
                      className="w-full bg-primary"
                      onClick={() => {
                        openLiveSiteInAdminMode(true);
                        toast({
                          title: "Edit Mode Activated",
                          description: "Opening live site with editing enabled...",
                          variant: "default",
                        });
                      }}
                    >
                      Open Editor
                    </Button>
                  </CardContent>
                </Card>
              
                <Card className="hover:shadow-md transition-all duration-200 border-primary/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-primary" /> Manage Gallery
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Upload, organize, and manage gallery images
                    </p>
                    <Button
                      onClick={() => {
                        openGalleryWithAdminAccess();
                        toast({
                          title: "Gallery Access",
                          description: "Opening gallery with admin access...",
                          variant: "default",
                        });
                      }}
                      className="w-full"
                    >
                      Manage Gallery
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-md transition-all duration-200 border-primary/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Settings className="h-5 w-5 text-primary" /> CustomCat Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Configure CustomCat API integration for store products
                    </p>
                    <Button
                      onClick={() => {
                        // First update the active tab state
                        setActiveTab("store");
                        toast({
                          title: "CustomCat API",
                          description: "Opening CustomCat API configuration...",
                          variant: "default",
                        });
                        
                        // Then refresh tabs component to show the correct content
                        const tabsElement = document.querySelector('[role="tablist"]');
                        if (tabsElement) {
                          const storeTab = tabsElement.querySelector('[data-value="store"]');
                          if (storeTab && storeTab instanceof HTMLElement) {
                            storeTab.click();
                            
                            // Scroll to CustomCat API settings after tab switch completes
                            setTimeout(() => {
                              const element = document.getElementById('customcat-api-settings');
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth' });
                                // Highlight the element briefly
                                element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
                                setTimeout(() => {
                                  element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
                                }, 2000);
                              }
                            }, 300);
                          }
                        }
                      }}
                      className="w-full"
                    >
                      Configure API
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="editor">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Editor Status Card */}
              <Card 
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${isEditModeActive ? "bg-primary/5 border-primary/50" : "hover:border-primary"}`}
                onClick={() => {
                  const newState = !isEditModeActive;
                  localStorage.setItem("editMode", newState ? "true" : "false");
                  setIsEditModeActive(newState);
                  toast({
                    title: newState ? "Editor Enabled" : "Editor Disabled",
                    description: newState 
                      ? "Element editor is now active. Click the button below to visit a page with editing." 
                      : "Element editor has been deactivated.",
                    variant: "default",
                  });
                }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5" /> Element Editor Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xl font-bold">{isEditModeActive ? "Active" : "Inactive"}</p>
                      <p className="text-sm text-muted-foreground">Visual element editor state</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="editor-toggle"
                        checked={isEditModeActive}
                        onCheckedChange={(checked) => {
                          localStorage.setItem("editMode", checked ? "true" : "false");
                          setIsEditModeActive(checked);
                          toast({
                            title: checked ? "Editor Enabled" : "Editor Disabled",
                            description: checked 
                              ? "Element editor is now active. Visit any page to edit elements." 
                              : "Element editor has been deactivated.",
                            variant: "default",
                          });
                        }}
                      />
                      <Label htmlFor="editor-toggle">
                        {isEditModeActive ? "Enabled" : "Disabled"}
                      </Label>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Button 
                      className="w-full bg-[#5D3FD3] hover:bg-[#5D3FD3]/90 text-white"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click from firing
                        openLiveSiteInAdminMode(true);
                        toast({
                          title: "Opening Live Site in Edit Mode",
                          description: "The site will open with element editing enabled",
                          variant: "default",
                        });
                      }}
                      disabled={!isEditModeActive}
                    >
                      <FileEdit className="mr-2 h-4 w-4" /> Open Site in Edit Mode
                    </Button>
                    
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                      <h3 className="font-medium text-amber-800 mb-2 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        How to Use Element Editor
                      </h3>
                      <ul className="text-sm text-amber-700 space-y-1 list-disc pl-5">
                        <li>Enable the editor using the toggle above</li>
                        <li>Navigate to any page on the site</li>
                        <li>Hover over elements to see edit options</li>
                        <li>Click on elements to select them for editing</li>
                        <li>Use the toolbar to replace images, edit text, and more</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Editor Settings Card */}
              <Card
                className="cursor-pointer hover:border-primary transition-all duration-200 hover:shadow-md"
                onClick={() => {
                  toast({
                    title: "Editor Settings",
                    description: "Configure your editing experience",
                    variant: "default",
                  });
                }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" /> Editor Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-4 cursor-pointer hover:bg-blue-100 transition-colors duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = "/edit-demo";
                      toast({
                        title: "Opening Edit Demo",
                        description: "Redirecting to the element editing demo page...",
                        variant: "default",
                      });
                    }}
                  >
                    <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-1">
                      <Edit className="h-4 w-4" /> Try the Edit Demo
                    </h3>
                    <p className="text-sm text-blue-700 mb-3">
                      Visit our interactive demo page to test how the element editing works. You can edit text and replace images in a controlled environment.
                    </p>
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = "/edit-demo";
                        toast({
                          title: "Opening Edit Demo",
                          description: "Redirecting to the element editing demo page...",
                          variant: "default",
                        });
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" /> Open Edit Demo
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Highlight Elements on Hover</Label>
                        <p className="text-sm text-muted-foreground">Show highlight box around elements when hovering</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Control Panel</Label>
                        <p className="text-sm text-muted-foreground">Display editing controls when element is selected</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Direct Image Replacement</Label>
                        <p className="text-sm text-muted-foreground">Allow replacing images with gallery selection</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Confirm Before Saving</Label>
                        <p className="text-sm text-muted-foreground">Show confirmation dialog before saving changes</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <Button 
                        variant="outline" 
                        className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                        onClick={handleLogout}
                      >
                        Logout from Admin Dashboard
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 gap-6 mt-6">
              <Card
                className="cursor-pointer hover:border-primary transition-all duration-200 hover:shadow-md"
                onClick={() => {
                  toast({
                    title: "Edit History",
                    description: "View and manage your recent element edits",
                    variant: "default",
                  });
                }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h10"/><path d="M9 6H1v12h8"/><path d="M14 6v12"/><path d="M18 6v12"/><path d="M22 6v12"/></svg>
                    Recently Edited Elements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-md bg-gray-50">
                    No recently edited elements found.
                  </div>
                  
                  <div className="flex flex-col gap-2 mt-4">
                    <div 
                      className="w-full py-2 px-4 flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer shadow-sm hover:shadow transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast({
                          title: "View Edit History",
                          description: "This feature will be available in a future update",
                          variant: "default",
                        });
                      }}
                    >
                      <span className="font-medium">View Edit History</span>
                    </div>
                    
                    <div 
                      className="w-full py-2 px-4 flex items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 mt-4 cursor-pointer shadow-sm hover:shadow transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLogout();
                      }}
                    >
                      <span className="font-medium">Logout from Admin Dashboard</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>Event Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Manage concert events, venues, schedules, and ticket sales.</p>
                <div className="mt-4 space-y-4">
                  <div className="flex flex-col gap-2">
                    <h3 className="font-semibold">Upcoming Events</h3>
                    {["The Healing Harmonies - Chicago", "Heroes in Scrubs - New York", "Nurse Beats - Los Angeles", "Stethoscope Symphony - Miami"].map((event, i) => (
                      <div key={i} className="p-3 border rounded-md flex justify-between items-center">
                        <span>{event}</span>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              toast({
                                title: "Edit Event",
                                description: `Editing ${event}...`,
                                variant: "default",
                              });
                            }}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500"
                            onClick={() => {
                              toast({
                                title: "Delete Event",
                                description: `${event} has been deleted.`,
                                variant: "destructive",
                              });
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    className="bg-[#5D3FD3] hover:bg-[#5D3FD3]/90 text-white"
                    onClick={() => {
                      toast({
                        title: "Add New Event",
                        description: "Opening event creation form...",
                        variant: "default",
                      });
                    }}
                  >
                    Add New Event
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="gallery">
            <Card>
              <CardHeader>
                <CardTitle>Gallery Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Access the gallery to manage photos, videos, and content categorization.</p>
                
                <Button
                  className="w-full h-14 mt-2 text-lg font-bold bg-[#5D3FD3] hover:bg-[#5D3FD3]/90 text-white shadow-md hover:shadow-lg transition-all"
                  onClick={openGalleryWithAdminAccess}
                >
                  <ImageIcon className="mr-2 h-5 w-5" />
                  Open Gallery Manager
                </Button>
                
                <h3 className="font-semibold mt-8 mb-3">Media Management Features</h3>
                <div className="space-y-2">
                  <div className="p-3 border rounded-md flex items-center">
                    <ImageIcon className="h-5 w-5 mr-3 text-[#5D3FD3]" />
                    <span>Upload and organize media content</span>
                  </div>
                  <div className="p-3 border rounded-md flex items-center">
                    <span className="mr-3 text-[#5D3FD3] font-bold">⟲</span>
                    <span>Replace images with properly sized alternatives</span>
                  </div>
                  <div className="p-3 border rounded-md flex items-center">
                    <span className="mr-3 text-[#5D3FD3] font-bold">⟻</span>
                    <span>Copy and paste media between sections</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>Content Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Edit website content, homepage features, and SEO settings.</p>
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Homepage Settings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            onClick={() => {
                              toast({
                                title: "Hero Banner Editor",
                                description: "Opening hero banner editor...",
                                variant: "default",
                              });
                            }}
                          >
                            Edit Hero Banner
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            onClick={() => {
                              toast({
                                title: "Featured Events Editor",
                                description: "Opening featured events editor...",
                                variant: "default",
                              });
                            }}
                          >
                            Featured Events
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            onClick={() => {
                              toast({
                                title: "Testimonials Editor",
                                description: "Opening testimonials editor...",
                                variant: "default",
                              });
                            }}
                          >
                            Testimonials
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">SEO Settings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            onClick={() => {
                              toast({
                                title: "Meta Tags Editor",
                                description: "Opening meta tags editor...",
                                variant: "default",
                              });
                            }}
                          >
                            Meta Tags
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            onClick={() => {
                              toast({
                                title: "Site Description Editor",
                                description: "Opening site description editor...",
                                variant: "default",
                              });
                            }}
                          >
                            Site Description
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            onClick={() => {
                              toast({
                                title: "Social Sharing Editor",
                                description: "Opening social sharing editor...",
                                variant: "default",
                              });
                            }}
                          >
                            Social Sharing
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="store">
            <div className="grid grid-cols-1 gap-6">
              {/* Store Integration Settings */}
              <div id="customcat-api-settings">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" /> Store Integration Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CustomCatApiSettings />
                  </CardContent>
                </Card>
              </div>
              
              {/* Product Synchronization Tool */}
              <ProductSyncTool />

              {/* Store Products Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Store Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Manage products, orders, and promotions.</p>
                  <div className="mt-4 space-y-4">
                    <div className="flex flex-col gap-2">
                      <h3 className="font-semibold">Products</h3>
                      <div className="border rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Product
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Price
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Stock
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {[
                              { name: "Nursing Rocks T-Shirt", price: "$24.99", stock: 45 },
                              { name: "Concert Mug", price: "$12.99", stock: 78 },
                              { name: "Support a Nurse Bundle", price: "$49.99", stock: 23 },
                              { name: "Exclusive Hoodie", price: "$39.99", stock: 12 },
                            ].map((product, i) => (
                              <tr key={i}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">{product.price}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">{product.stock}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => {
                                        toast({
                                          title: "Edit Product",
                                          description: `Editing ${product.name}...`,
                                          variant: "default",
                                        });
                                      }}
                                    >
                                      Edit
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-red-500"
                                      onClick={() => {
                                        toast({
                                          title: "Delete Product",
                                          description: `${product.name} has been deleted.`,
                                          variant: "destructive",
                                        });
                                      }}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <Button 
                      className="bg-[#5D3FD3] hover:bg-[#5D3FD3]/90 text-white"
                      onClick={() => {
                        toast({
                          title: "Add New Product",
                          description: "Opening product creation form...",
                          variant: "default",
                        });
                      }}
                    >
                      Add New Product
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Manage user accounts, permissions, and credentials.</p>
                <div className="mt-4 space-y-4">
                  <div className="flex flex-col gap-2">
                    <h3 className="font-semibold">Recent Users</h3>
                    <div className="border rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {[
                            { name: "Jane Smith", email: "jane.smith@example.com", status: "Active" },
                            { name: "John Doe", email: "john.doe@example.com", status: "Active" },
                            { name: "Alex Johnson", email: "alex.johnson@example.com", status: "Inactive" },
                            { name: "Sarah Williams", email: "sarah.williams@example.com", status: "Active" },
                          ].map((user, i) => (
                            <tr key={i}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  user.status === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                }`}>
                                  {user.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      toast({
                                        title: "User Details",
                                        description: `Viewing details for ${user.name}...`,
                                        variant: "default",
                                      });
                                    }}
                                  >
                                    View
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | Nursing Rocks Concert Series</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          {authenticated ? <AdminDashboard /> : <PinPad />}
        </div>
      </section>
    </>
  );
}