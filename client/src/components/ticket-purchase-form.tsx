import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";

const ticketFormSchema = z.object({
  ticket_type: z.string({
    required_error: "Please select a ticket type",
  }),
  quantity: z.literal(1),
});

type TicketFormValues = z.infer<typeof ticketFormSchema>;

interface TicketPurchaseFormProps {
  eventId: number;
  eventTitle: string;
  ticketOptions: {
    type: string;
    price: number;
  }[];
  onSuccess?: () => void;
}

export function TicketPurchaseForm({ 
  eventId, 
  eventTitle, 
  ticketOptions, 
  onSuccess 
}: TicketPurchaseFormProps) {
  const { toast } = useToast();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  
  // Form definition (one ticket per purchase)
  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      ticket_type: "",
      quantity: 1,
    },
  });
  
  // Check if user is verified on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsVerified(false);
      return;
    }

    // Fetch verification status
    apiRequest("GET", "/api/auth/verification-status")
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        throw new Error("Failed to fetch verification status");
      })
      .then((data) => {
        setIsVerified(data.isVerified);
      })
      .catch((error) => {
        console.error("Error fetching verification status:", error);
        setIsVerified(false);
      });
  }, []);
  
  // Purchase ticket mutation
  const purchaseTicketMutation = useMutation({
    mutationFn: async (values: TicketFormValues) => {
      const selectedTicket = ticketOptions.find((option) => option.type === values.ticket_type);
      if (!selectedTicket) {
        throw new Error("Invalid ticket type selected");
      }
      
      const response = await apiRequest("POST", "/api/tickets/purchase", {
        headers: {
          "Content-Type": "application/json",
          ...(typeof localStorage !== "undefined" && localStorage.getItem("token")
            ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
            : {}),
        },
        body: JSON.stringify({
          event_id: eventId,
          ticket_type: values.ticket_type,
          quantity: 1,
          price: selectedTicket.price,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to purchase ticket");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your free ticket has been reserved.",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to reserve ticket. Please try again.",
      });
    },
  });
  
  // Form submission handler
  function onSubmit(values: TicketFormValues) {
    purchaseTicketMutation.mutate(values);
  }
  
  const selectedTicketType = form.watch("ticket_type");
  const selectedTicket = ticketOptions.find((option) => option.type === selectedTicketType);
  const subtotal = selectedTicket ? selectedTicket.price : 0;
  
  if (isVerified === null) {
    return <p>Loading verification status...</p>;
  }
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Claim your free ticket</h3>
      <p className="text-sm text-muted-foreground">
        Verified nurses receive one free ticket per event. Some venues also offer presale or door-only tickets for guests—see event details.
      </p>
      
      {isVerified ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="ticket_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticket Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a ticket type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ticketOptions.map((option) => (
                        <SelectItem key={option.type} value={option.type}>
                          {option.type}
                          {option.price === 0 ? " (Free)" : ` – $${option.price.toFixed(2)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select your ticket type (free for verified nurses)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {selectedTicketType && (
              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm mb-2">
                  <span>Ticket type:</span>
                  <span>{selectedTicket?.type}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total (1 ticket):</span>
                  <span>{selectedTicket?.price === 0 ? "Free" : `$${subtotal.toFixed(2)}`}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">One free ticket per event for verified nurses.</p>
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full"
              disabled={purchaseTicketMutation.isPending}
            >
              {purchaseTicketMutation.isPending ? "Processing..." : "Claim free ticket"}
            </Button>
          </form>
        </Form>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800">
          <h4 className="font-medium mb-2">Nurse verification required</h4>
          <p className="text-sm mb-4">
            Tickets are free for verified nurses. To claim your free ticket for {eventTitle}, register and verify your nursing license (one-time).
          </p>
          <Button 
            variant="outline"
            onClick={() => window.location.href = "/register"}
          >
            Register as a Nurse
          </Button>
        </div>
      )}
    </div>
  );
}