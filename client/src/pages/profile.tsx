import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";

export default function ProfilePage() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [userData, setUserData] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Simplified auth checking using token from localStorage
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");
        
        if (!token || !storedUser) {
          // No token or user data found, redirect to login
          setIsAuthenticated(false);
          toast({
            variant: "destructive",
            title: "Authentication Required",
            description: "Please login to view your profile.",
          });
          // Use direct href navigation for more reliable page reload
          window.location.href = "/login";
          return;
        }
        
        // We have token and user data in localStorage
        setIsAuthenticated(true);
        try {
          setUserData(JSON.parse(storedUser));
        } catch (error) {
          console.error("Error parsing user data:", error);
          setUserData(null);
          // Bad user data in localStorage, clear and redirect
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthenticated(false);
        window.location.href = "/login";
      }
    };
    
    checkAuth();
  }, []);
  
  // Fetch licenses
  const { data: licenses = { licenses: [] } } = useQuery<{ licenses: any[] }>({
    queryKey: ['/api/auth/licenses'],
    enabled: isAuthenticated === true,
  });
  
  // Fetch tickets
  const { data: tickets = { tickets: [] } } = useQuery<{ tickets: any[] }>({
    queryKey: ['/api/auth/tickets'],
    enabled: isAuthenticated === true,
  });
  
  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    setLocation("/login");
  };
  
  if (isAuthenticated === false || !userData) {
    return null; // Redirecting to login or loading
  }
  
  // Get initials for avatar
  const getInitials = () => {
    if (userData?.first_name && userData?.last_name) {
      return `${userData.first_name[0]}${userData.last_name[0]}`.toUpperCase();
    }
    return userData?.email?.[0]?.toUpperCase() || "U";
  };
  
  return (
    <div className="container max-w-4xl py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <Avatar className="w-20 h-20 mx-auto">
                <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="mt-4">{userData.first_name} {userData.last_name}</CardTitle>
              <CardDescription>{userData.email}</CardDescription>
              
              <div className="mt-2">
                {userData.is_verified ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200 flex items-center gap-1 mx-auto">
                    <CheckCircle className="h-3 w-3" />
                    Verified Nurse
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100 flex items-center gap-1 mx-auto">
                    <XCircle className="h-3 w-3" />
                    Unverified
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Member Since:</span>
                  <span className="font-medium">{userData.created_at ? formatDate(userData.created_at) : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tickets Purchased:</span>
                  <span className="font-medium">{tickets?.tickets?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Licenses Submitted:</span>
                  <span className="font-medium">{licenses?.licenses?.length || 0}</span>
                </div>
              </div>
              
              <div className="mt-6 space-y-2">
                {!userData.is_verified && (
                  <Button variant="outline" className="w-full" onClick={() => setLocation("/register")}>
                    Verify Your License
                  </Button>
                )}
                <Button variant="outline" className="w-full" onClick={() => setLocation("/tickets")}>
                  Your Tickets
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setLocation("/jobs")}>
                  Jobs Board
                </Button>
                <Button 
                  variant="default" 
                  className="w-full font-medium text-lg py-6 mt-2 mb-2"
                  onClick={() => setLocation("/license-verification")}
                >
                  Get Your Free Tickets
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => window.open("https://www.nursingworld.org/resources/", "_blank")}
                >
                  ANA Resources
                </Button>
                <Button variant="destructive" className="w-full" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Your Account</CardTitle>
              <CardDescription>
                Manage your account information and view your tickets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="licenses">
                <TabsList className="mb-4">
                  <TabsTrigger value="licenses">Licenses</TabsTrigger>
                  <TabsTrigger value="tickets">Tickets</TabsTrigger>
                  <TabsTrigger value="preferences">Preferences</TabsTrigger>
                </TabsList>
                
                <TabsContent value="licenses">
                  {licenses?.licenses?.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Your Nursing Licenses</h3>
                      <div className="border rounded-md divide-y">
                        {licenses.licenses.map((license: any) => (
                          <div key={license.id} className="p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium">License #{license.license_number}</div>
                                <div className="text-sm text-muted-foreground">
                                  {license.state} • Expires: {formatDate(license.expiration_date)}
                                </div>
                              </div>
                              <Badge 
                                variant={license.status === 'verified' ? 'default' : 'outline'}
                                className={license.status === 'verified' 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                  : license.status === 'pending'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                    : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                                }
                              >
                                {license.status === 'verified' 
                                  ? 'Verified' 
                                  : license.status === 'pending'
                                    ? 'Pending'
                                    : 'Invalid'
                                }
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button variant="outline" onClick={() => setLocation("/register")}>
                        Manage Licenses
                      </Button>
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground mb-4">You haven't submitted any nursing licenses yet.</p>
                      <Button onClick={() => setLocation("/register")}>
                        Verify Your License
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="tickets">
                  {tickets?.tickets?.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Your Event Tickets</h3>
                      <div className="border rounded-md divide-y">
                        {tickets.tickets.map((ticket: any) => (
                          <div key={ticket.id} className="p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium">{ticket.event?.title || "Event"}</div>
                                <div className="text-sm text-muted-foreground">
                                  {ticket.ticket_type} • ${parseFloat(ticket.price).toFixed(2)}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Code: {ticket.ticket_code}
                                </div>
                              </div>
                              <Badge 
                                variant={ticket.is_used ? 'outline' : 'default'}
                                className={ticket.is_used 
                                  ? 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100' 
                                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                }
                              >
                                {ticket.is_used ? 'Used' : 'Valid'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button variant="outline" onClick={() => setLocation("/tickets")}>
                        View All Tickets
                      </Button>
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground mb-4">You haven't purchased any tickets yet.</p>
                      <Button onClick={() => setLocation("/")}>
                        Browse Events
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="preferences">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Account Preferences</h3>
                    <p className="text-muted-foreground">
                      Manage your account settings and preferences. This feature is coming soon.
                    </p>
                    <Button variant="outline" disabled>
                      Edit Profile
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}