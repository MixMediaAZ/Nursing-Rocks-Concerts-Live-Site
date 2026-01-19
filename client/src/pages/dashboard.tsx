import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle,
  XCircle,
  Ticket,
  CalendarDays,
  Store,
  CreditCard,
  User,
  LogOut,
  Heart,
  Bell,
  Settings,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
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
            description: "Please login to view your dashboard.",
          });
          // Redirect to login page with redirect back to dashboard after login
          window.location.href = "/login?redirect=/dashboard";
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
          window.location.href = "/login?redirect=/dashboard";
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthenticated(false);
        window.location.href = "/login?redirect=/dashboard";
      }
    };
    
    checkAuth();
  }, []);
  
  // Fetch licenses
  const { data: licenses = { licenses: [] } } = useQuery<{ licenses: any[] }>({
    queryKey: ['/api/licenses'],
    enabled: isAuthenticated === true,
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await fetch('/api/licenses', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch licenses');
      const data = await response.json();
      return Array.isArray(data) ? { licenses: data } : data;
    },
  });
  
  // Fetch tickets
  const { data: tickets = { tickets: [] } } = useQuery<{ tickets: any[] }>({
    queryKey: ['/api/tickets'],
    enabled: isAuthenticated === true,
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await fetch('/api/tickets', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch tickets');
      const data = await response.json();
      return Array.isArray(data) ? { tickets: data } : data;
    },
  });
  
  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    window.location.href = "/login";
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
  
  const upcomingTickets = tickets?.tickets?.filter((ticket: any) => 
    new Date(ticket.event_date) >= new Date()
  ) || [];
  
  const pastTickets = tickets?.tickets?.filter((ticket: any) => 
    new Date(ticket.event_date) < new Date()
  ) || [];
  
  return (
    <div className="container py-8">
      <Helmet>
        <title>My Dashboard | Nursing Rocks</title>
        <meta name="description" content="Manage your Nursing Rocks account, tickets, and licenses" />
      </Helmet>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <div className="col-span-1 lg:col-span-3">
          <Card>
            <CardHeader className="text-center">
              <Avatar className="w-20 h-20 mx-auto">
                <AvatarImage src={userData.avatar_url || ""} alt={`${userData.first_name} ${userData.last_name}`} />
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
                  <span>Licenses Verified:</span>
                  <span className="font-medium">{licenses?.licenses?.length || 0}</span>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = "/profile"}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = "/tickets"}>
                  <Ticket className="mr-2 h-4 w-4" />
                  My Tickets
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = "/license-verification"}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  License Verification
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start opacity-60 cursor-not-allowed" 
                  disabled
                  title="Coming Soon"
                >
                  <Store className="mr-2 h-4 w-4" />
                  Shop Merchandise (Coming Soon)
                </Button>
                <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="col-span-1 lg:col-span-9">
          <div className="mb-6 border border-gray-300 rounded-lg p-6 bg-white/10 shadow-sm">
            <h1 className="text-3xl font-bold mb-2">Welcome back, {userData.first_name}!</h1>
            <p className="text-muted-foreground">
              Manage your Nursing Rocks account, view upcoming events, and access your tickets.
            </p>
          </div>
          
          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="border-primary/20 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-primary" /> My Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{tickets?.tickets?.length || 0}</p>
                <p className="text-sm text-muted-foreground mb-2">Total tickets purchased</p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full text-primary hover:text-primary border-primary/30 hover:border-primary/60"
                  onClick={() => window.location.href = "/tickets"}
                >
                  Manage Tickets
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="border-primary/20 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" /> Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{upcomingTickets.length}</p>
                <p className="text-sm text-muted-foreground mb-2">Events you're attending</p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full text-primary hover:text-primary border-primary/30 hover:border-primary/60"
                  onClick={() => window.location.href = "/"}
                >
                  Browse Events
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="border-primary/20 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary" /> Nursing License
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {userData.is_verified ? "Verified" : "Unverified"}
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  {userData.is_verified 
                    ? "Your nursing license has been verified" 
                    : "Verify your nursing license for benefits"}
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full text-primary hover:text-primary border-primary/30 hover:border-primary/60"
                  onClick={() => window.location.href = "/license-verification"}
                >
                  {userData.is_verified ? "View License Info" : "Verify License"}
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          {/* Tickets Section */}
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Your Tickets</CardTitle>
                <CardDescription>
                  View and manage your concert tickets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="upcoming">
                  <TabsList>
                    <TabsTrigger value="upcoming">Upcoming ({upcomingTickets.length})</TabsTrigger>
                    <TabsTrigger value="past">Past Events ({pastTickets.length})</TabsTrigger>
                  </TabsList>
                  <TabsContent value="upcoming">
                    {upcomingTickets.length > 0 ? (
                      <div className="space-y-4 mt-4">
                        {upcomingTickets.map((ticket: any) => (
                          <Card key={ticket.id} className="overflow-hidden border-primary/20">
                            <div className="flex flex-col md:flex-row">
                              <div className="w-full md:w-1/4 bg-primary/10 p-4 flex flex-col justify-center items-center">
                                <div className="text-center">
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(ticket.event_date).toLocaleDateString('en-US', { 
                                      month: 'short'
                                    }).toUpperCase()}
                                  </p>
                                  <p className="text-3xl font-bold">
                                    {new Date(ticket.event_date).getDate()}
                                  </p>
                                  <p className="text-sm font-medium">
                                    {new Date(ticket.event_date).toLocaleDateString('en-US', { 
                                      year: 'numeric'
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div className="w-full md:w-3/4 p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="font-bold text-xl">{ticket.event_name}</h3>
                                    <p className="text-muted-foreground">{ticket.venue}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge variant="outline">{ticket.ticket_type}</Badge>
                                      <p className="text-sm text-muted-foreground">
                                        {ticket.time || "Doors 7PM, Show 8PM"}
                                      </p>
                                    </div>
                                  </div>
                                  <Button variant="outline" onClick={() => window.location.href = "/tickets"}>
                                    View Ticket
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Ticket className="h-12 w-12 mx-auto text-muted-foreground opacity-30" />
                        <h3 className="mt-4 font-medium">No upcoming tickets</h3>
                        <p className="text-muted-foreground mt-1 mb-4">
                          You don't have any tickets for upcoming events
                        </p>
                        <Button onClick={() => window.location.href = "/"}>
                          Browse Events
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="past">
                    {pastTickets.length > 0 ? (
                      <div className="space-y-4 mt-4">
                        {pastTickets.map((ticket: any) => (
                          <Card key={ticket.id} className="overflow-hidden opacity-80">
                            <div className="flex flex-col md:flex-row">
                              <div className="w-full md:w-1/4 bg-muted p-4 flex flex-col justify-center items-center">
                                <div className="text-center">
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(ticket.event_date).toLocaleDateString('en-US', { 
                                      month: 'short'
                                    }).toUpperCase()}
                                  </p>
                                  <p className="text-3xl font-bold">
                                    {new Date(ticket.event_date).getDate()}
                                  </p>
                                  <p className="text-sm font-medium">
                                    {new Date(ticket.event_date).toLocaleDateString('en-US', { 
                                      year: 'numeric'
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div className="w-full md:w-3/4 p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="font-bold text-xl">{ticket.event_name}</h3>
                                    <p className="text-muted-foreground">{ticket.venue}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge variant="outline">{ticket.ticket_type}</Badge>
                                      <Badge variant="secondary">Past Event</Badge>
                                    </div>
                                  </div>
                                  <Button variant="outline" onClick={() => window.location.href = "/tickets"}>
                                    View Details
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground opacity-30" />
                        <h3 className="mt-4 font-medium">No past tickets</h3>
                        <p className="text-muted-foreground mt-1">
                          You haven't attended any past events yet
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}