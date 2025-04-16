import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, BadgeCheck, Clock, QrCode, Ticket } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatDate } from "@/lib/utils";

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      // Redirect to login if not logged in
      setLocation("/login?redirect=/profile");
    } else {
      setIsLoggedIn(true);
    }
  }, [setLocation]);
  
  const { data: tickets = [], isLoading: ticketsLoading } = useQuery<any[]>({
    queryKey: ["/api/tickets"],
    enabled: isLoggedIn,
  });
  
  if (!isLoggedIn) {
    return null;
  }
  
  return (
    <div className="container py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>
        
        <Tabs defaultValue="tickets" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tickets">My Tickets</TabsTrigger>
            <TabsTrigger value="account">Account Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tickets" className="mt-6">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                My Concert Tickets
              </h2>
              
              {ticketsLoading ? (
                <p>Loading your tickets...</p>
              ) : tickets.length > 0 ? (
                <div className="grid gap-4">
                  {tickets.map((ticket: any) => (
                    <Card key={ticket.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{ticket.event?.title || "Event Name"}</CardTitle>
                            <CardDescription>
                              {ticket.event?.date ? formatDate(ticket.event.date) : "Date TBD"} • {ticket.event?.venue?.name || "Venue"}
                            </CardDescription>
                          </div>
                          <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <QrCode className="h-4 w-4" />
                            View Ticket
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center text-sm">
                          <div>
                            <p className="text-muted-foreground">Ticket Type</p>
                            <p className="font-medium">{ticket.ticket_type}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Purchase Date</p>
                            <p className="font-medium">{formatDate(ticket.created_at)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Price</p>
                            <p className="font-medium">${ticket.price}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Status</p>
                            <p className={`font-medium ${ticket.is_used ? "text-amber-500" : "text-green-500"}`}>
                              {ticket.is_used ? "Used" : "Valid"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-5 w-5" />
                  <AlertTitle>No tickets found</AlertTitle>
                  <AlertDescription>
                    You haven't purchased any tickets yet. Browse our upcoming concerts to find your next event!
                  </AlertDescription>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setLocation("/")}
                  >
                    Browse Concerts
                  </Button>
                </Alert>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="account" className="mt-6">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Account Settings</h2>
              
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Manage your account details and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">user@example.com</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Name</p>
                      <p className="font-medium">John Doe</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Member Since</p>
                      <p className="font-medium">January 1, 2023</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">License Status</p>
                      <div className="flex items-center gap-2">
                        <BadgeCheck className="h-5 w-5 text-green-500" />
                        <span className="text-green-500 font-medium">Verified</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button variant="outline">Edit Profile</Button>
                      <Button variant="outline" className="text-red-500">Change Password</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}