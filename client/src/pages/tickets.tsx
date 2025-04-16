import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, Clock, QrCode, Ticket } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatDate } from "@/lib/utils";

export default function TicketsPage() {
  const [, setLocation] = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      // Redirect to login if not logged in
      setLocation("/login?redirect=/tickets");
    } else {
      setIsLoggedIn(true);
    }
  }, [setLocation]);
  
  const { data: tickets = [], isLoading: ticketsLoading, error } = useQuery<any[]>({
    queryKey: ["/api/tickets"],
    enabled: isLoggedIn,
  });
  
  if (!isLoggedIn) {
    return null;
  }
  
  return (
    <div className="container py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">My Tickets</h1>
        <p className="text-muted-foreground mb-6">
          Manage your purchased tickets for upcoming Nursing Rocks! concerts
        </p>
        
        {ticketsLoading ? (
          <p>Loading your tickets...</p>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was an error loading your tickets. Please try again later.
            </AlertDescription>
          </Alert>
        ) : tickets.length > 0 ? (
          <div className="grid gap-6">
            <div className="grid gap-4">
              {tickets.map((ticket: any) => (
                <Card key={ticket.id} className="overflow-hidden">
                  <div className="md:flex">
                    <div 
                      className="bg-gradient-to-r from-primary/20 to-primary/10 w-full md:w-24 flex items-center justify-center p-4"
                    >
                      <Ticket className="h-12 w-12 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{ticket.event?.title || "Event Name"}</CardTitle>
                            <CardDescription className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {ticket.event?.date ? formatDate(ticket.event.date) : "Date TBD"}
                              <span className="mx-1">•</span>
                              <Clock className="h-3 w-3" />
                              {ticket.event?.start_time || "Time TBD"}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Venue</p>
                            <p className="font-medium">{ticket.event?.venue?.name || "Venue"}</p>
                          </div>
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
                        </div>
                        
                        <div className="flex justify-between items-center mt-4 pt-4 border-t">
                          <div>
                            <p className={`font-medium ${ticket.is_used ? "text-amber-500" : "text-green-500"}`}>
                              {ticket.is_used ? "Ticket Used" : "Valid Ticket"}
                            </p>
                            <p className="text-xs text-muted-foreground">Ticket #{ticket.ticket_code}</p>
                          </div>
                          <Button className="flex items-center gap-2">
                            <QrCode className="h-4 w-4" />
                            View Ticket
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
              <Ticket className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No tickets found</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              You haven't purchased any tickets yet. Browse our upcoming concerts to find your next event!
            </p>
            <Button 
              onClick={() => setLocation("/")}
            >
              Browse Concerts
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}