import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle2, Calendar, Clock, MapPin } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDate, formatTime } from "@/lib/utils";

interface TicketValidationResponse {
  valid: boolean;
  ticket?: {
    code: string;
    type: string;
    price: string | number;
    is_used: boolean;
    event?: {
      title: string;
      date: string;
      location: string;
    };
  };
  message: string;
}

export default function VerifyTicketPage() {
  const [match, params] = useRoute("/verify-ticket/:code");
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const [ticketData, setTicketData] = useState<TicketValidationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!match || !params?.code) {
      setError("No ticket code provided");
      setIsLoading(false);
      return;
    }

    const validateTicket = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/tickets/validate/${params.code}`);

        if (!response.ok) {
          const data = await response.json();
          setError(data.message || "Failed to validate ticket");
          setTicketData(null);
          return;
        }

        const data: TicketValidationResponse = await response.json();
        setTicketData(data);

        if (data.valid && !data.ticket?.is_used) {
          toast({
            title: "✓ Valid Ticket",
            description: "This ticket is valid and ready to use",
          });
        } else if (data.ticket?.is_used) {
          toast({
            variant: "destructive",
            title: "Ticket Already Used",
            description: "This ticket has already been scanned",
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error validating ticket";
        setError(message);
        console.error("Ticket validation error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    validateTicket();
  }, [params?.code, match, toast]);

  if (!match) {
    return (
      <div className="container max-w-2xl py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Invalid request. No ticket code found.</AlertDescription>
        </Alert>
        <Button onClick={() => setLocation("/")} className="mt-4">
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Ticket Verification</CardTitle>
          <CardDescription>
            Validating ticket code: {params.code}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : error ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button onClick={() => setLocation("/")} variant="outline">
                Back to Home
              </Button>
            </div>
          ) : ticketData ? (
            <div className="space-y-4">
              {ticketData.valid ? (
                <div className="space-y-4">
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      {ticketData.message}
                    </AlertDescription>
                  </Alert>

                  {ticketData.ticket && (
                    <div className="border rounded-lg p-6 space-y-4">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {ticketData.ticket.event?.title || "Event"}
                          </h3>
                          <Badge
                            variant={ticketData.ticket.is_used ? "outline" : "default"}
                            className={
                              ticketData.ticket.is_used
                                ? "bg-gray-50 text-gray-800 border-gray-200"
                                : "bg-green-100 text-green-800 border-green-200"
                            }
                          >
                            {ticketData.ticket.is_used ? "Used" : "Valid"}
                          </Badge>
                        </div>
                      </div>

                      {ticketData.ticket.event && (
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                            {formatDate(ticketData.ticket.event.date)}
                          </div>

                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                            {formatTime(ticketData.ticket.event.date)}
                          </div>

                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                            {ticketData.ticket.event.location}
                          </div>
                        </div>
                      )}

                      <div className="border-t pt-4 flex justify-between items-center">
                        <div>
                          <div className="text-sm font-medium">{ticketData.ticket.type}</div>
                          <div className="text-lg font-bold">
                            ${Number(ticketData.ticket.price).toFixed(2)}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Ticket Code</div>
                          <div className="font-mono font-medium text-sm">
                            {ticketData.ticket.code}
                          </div>
                        </div>
                      </div>

                      {!ticketData.ticket.is_used && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                          <strong>Ready to use:</strong> Present this ticket at the venue entrance.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{ticketData.message}</AlertDescription>
                </Alert>
              )}

              <Button onClick={() => setLocation("/tickets")} className="w-full">
                View All Tickets
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
