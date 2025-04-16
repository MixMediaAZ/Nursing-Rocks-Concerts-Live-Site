import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, Ticket } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, formatTime } from "@/lib/utils";

export default function TicketsPage() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  // Check authentication status on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please login to view your tickets.",
      });
      setLocation("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, []);
  
  // Fetch tickets
  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['/api/auth/tickets'],
    enabled: isAuthenticated === true,
  });
  
  if (isAuthenticated === false) {
    return null; // Redirecting to login
  }
  
  // Group tickets by used/unused status
  const upcomingTickets = ticketsData?.tickets?.filter((ticket: any) => !ticket.is_used) || [];
  const pastTickets = ticketsData?.tickets?.filter((ticket: any) => ticket.is_used) || [];
  
  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Your Tickets</CardTitle>
          <CardDescription>
            Manage your concert tickets for Nursing Rocks! events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : ticketsData?.tickets?.length > 0 ? (
            <Tabs defaultValue="upcoming">
              <TabsList className="mb-6">
                <TabsTrigger value="upcoming">
                  Upcoming Tickets ({upcomingTickets.length})
                </TabsTrigger>
                <TabsTrigger value="past">
                  Past Tickets ({pastTickets.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upcoming">
                <div className="space-y-6">
                  {upcomingTickets.length > 0 ? (
                    upcomingTickets.map((ticket: any) => (
                      <TicketCard 
                        key={ticket.id} 
                        ticket={ticket} 
                        isUsed={false}
                      />
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground mb-4">You don't have any upcoming tickets.</p>
                      <Button onClick={() => setLocation("/")}>
                        Browse Events
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="past">
                <div className="space-y-6">
                  {pastTickets.length > 0 ? (
                    pastTickets.map((ticket: any) => (
                      <TicketCard 
                        key={ticket.id} 
                        ticket={ticket} 
                        isUsed={true} 
                      />
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground">You don't have any past tickets.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="py-12 text-center space-y-4">
              <div className="text-5xl opacity-20 mx-auto w-fit">
                <Ticket strokeWidth={1} />
              </div>
              <h3 className="text-xl font-medium mt-4">No Tickets Yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                You haven't purchased any tickets for Nursing Rocks! events yet. Browse our upcoming events to find your next concert experience.
              </p>
              <Button onClick={() => setLocation("/")}>
                Browse Events
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface TicketCardProps {
  ticket: any;
  isUsed: boolean;
}

function TicketCard({ ticket, isUsed }: TicketCardProps) {
  const event = ticket.event || {
    title: "Event Title",
    date: new Date().toISOString(),
    start_time: "19:00:00",
    venue: { name: "Venue", location: "Location" }
  };
  
  return (
    <div className={`border rounded-lg overflow-hidden ${isUsed ? 'opacity-75' : ''}`}>
      <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6">
        <div className="md:w-1/4">
          {event.image_url ? (
            <img 
              src={event.image_url} 
              alt={event.title} 
              className="rounded-md w-full h-32 object-cover"
            />
          ) : (
            <div className="bg-muted rounded-md w-full h-32 flex items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
        </div>
        
        <div className="md:w-3/4">
          <div className="flex flex-wrap justify-between items-start gap-2">
            <h3 className="text-lg font-semibold">{event.title}</h3>
            <Badge 
              variant={isUsed ? 'outline' : 'default'}
              className={isUsed 
                ? 'bg-gray-50 text-gray-800 border-gray-200' 
                : 'bg-green-100 text-green-800 border-green-200'
              }
            >
              {isUsed ? 'Used' : 'Valid'}
            </Badge>
          </div>
          
          <div className="mt-2 space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
              {formatDate(event.date)}
            </div>
            
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
              {formatTime(event.start_time)}
            </div>
            
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
              {event.venue?.name || "Venue"}, {event.venue?.location || "Location"}
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t flex flex-wrap justify-between items-center gap-2">
            <div>
              <div className="text-sm font-medium">{ticket.ticket_type}</div>
              <div className="text-lg font-bold">${parseFloat(ticket.price).toFixed(2)}</div>
            </div>
            
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Ticket Code</div>
              <div className="font-mono font-medium">{ticket.ticket_code}</div>
            </div>
          </div>
        </div>
      </div>
      
      {!isUsed && (
        <div className="bg-muted py-2 px-4 md:px-6 flex justify-between items-center">
          <span className="text-sm font-medium">Show this ticket at the event entrance</span>
          <Button size="sm" variant="outline">
            Download
          </Button>
        </div>
      )}
    </div>
  );
}