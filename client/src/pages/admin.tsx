import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
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
  Lock
} from "lucide-react";

// Admin PIN setup - in production, this should be stored securely
const ADMIN_PIN = "1234567";

export default function AdminPage() {
  const [pin, setPin] = useState<string>("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Check existing authentication
  useEffect(() => {
    // Check if user has already been authenticated
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    const adminPinVerified = localStorage.getItem("adminPinVerified") === "true";
    
    if (isAdmin || adminPinVerified) {
      setAuthenticated(true);
    } else {
      setAuthenticated(false);
      setPin("");
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

  const handleSubmit = () => {
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      if (pin === ADMIN_PIN) {
        setAuthenticated(true);
        localStorage.setItem("isAdmin", "true");
        // Also set the flag for admin PIN verification for gallery access
        localStorage.setItem("adminPinVerified", "true");
        toast({
          title: "Authentication Successful",
          description: "Welcome to the admin dashboard",
          variant: "default",
        });
      } else {
        toast({
          title: "Authentication Failed",
          description: "Invalid PIN code. Please try again.",
          variant: "destructive",
        });
        setPin("");
      }
      setLoading(false);
    }, 1000);
  };

  const handleLogout = () => {
    setAuthenticated(false);
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("adminPinVerified");
    setPin("");
    toast({
      title: "Logged Out",
      description: "You have been logged out of the admin dashboard",
      variant: "default",
    });
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
    
    // Direct navigation to gallery with admin access
    const openGalleryWithAdminAccess = () => {
      localStorage.setItem("adminPinVerified", "true");
      window.location.href = "/gallery";
    };
    
    // Open live site in admin mode for editing
    const openLiveSiteInAdminMode = () => {
      localStorage.setItem("isAdmin", "true");
      localStorage.setItem("adminPinVerified", "true");
      localStorage.setItem("editMode", "true");
      window.location.href = "/";
    };

    return (
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-7 w-7" /> Admin Dashboard
          </h1>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Logout
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2 md:grid-cols-6 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="store">Store</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" /> Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">4</p>
                  <p className="text-sm text-muted-foreground">Upcoming events</p>
                  <Button variant="link" className="p-0 h-auto mt-2" onClick={() => setActiveTab("events")}>
                    Manage Events
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" /> Store
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">23</p>
                  <p className="text-sm text-muted-foreground">Products</p>
                  <Button variant="link" className="p-0 h-auto mt-2" onClick={() => setActiveTab("store")}>
                    Manage Store
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" /> Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">152</p>
                  <p className="text-sm text-muted-foreground">Registered users</p>
                  <Button variant="link" className="p-0 h-auto mt-2" onClick={() => setActiveTab("users")}>
                    Manage Users
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Highlighted button for editing live site in admin mode */}
                  <Button 
                    className="h-auto py-6 flex flex-col items-center justify-center gap-2 bg-[#5D3FD3] hover:bg-[#5D3FD3]/90 text-white"
                    onClick={() => {
                      openLiveSiteInAdminMode();
                      toast({
                        title: "Admin Edit Mode Activated",
                        description: "Opening live site in admin edit mode...",
                        variant: "default",
                      });
                    }}
                  >
                    <FileEdit className="h-8 w-8" />
                    <span className="text-lg font-bold">Open Live Site in Admin Mode</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto py-6 flex flex-col items-center justify-center gap-2"
                    onClick={() => {
                      openGalleryWithAdminAccess();
                      toast({
                        title: "Gallery Access",
                        description: "Opening gallery with admin access...",
                        variant: "default",
                      });
                    }}
                  >
                    <ImageIcon className="h-8 w-8" />
                    <span className="text-lg font-semibold">Manage Gallery</span>
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                    onClick={() => {
                      setActiveTab("events");
                      toast({
                        title: "Event Management",
                        description: "Opening event management interface...",
                        variant: "default",
                      });
                    }}
                  >
                    <Calendar className="h-6 w-6" />
                    <span>Add New Event</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                    onClick={() => {
                      setActiveTab("store");
                      toast({
                        title: "Store Management",
                        description: "Opening store management interface...",
                        variant: "default",
                      });
                    }}
                  >
                    <Store className="h-6 w-6" />
                    <span>Manage Store</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                    onClick={() => {
                      setActiveTab("content");
                      toast({
                        title: "Content Management",
                        description: "Opening content management interface...",
                        variant: "default",
                      });
                    }}
                  >
                    <Settings className="h-6 w-6" />
                    <span>Site Settings</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
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
            <Card>
              <CardHeader>
                <CardTitle>Store Management</CardTitle>
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