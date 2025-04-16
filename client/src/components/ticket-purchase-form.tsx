import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";

const ticketFormSchema = z.object({
  ticket_type: z.string({
    required_error: "Please select a ticket type",
  }),
  quantity: z.coerce
    .number({
      required_error: "Please enter a quantity",
      invalid_type_error: "Quantity must be a number",
    })
    .int()
    .min(1, { message: "Quantity must be at least 1" })
    .max(10, { message: "Maximum 10 tickets per purchase" }),
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
  
  // Form definition
  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      ticket_type: "",
      quantity: 1,
    },
  });
  
  // Check if user is verified on mount
  useState(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsVerified(false);
      return;
    }
    
    // Fetch verification status
    apiRequest("/api/auth/verification-status")
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
  });
  
  // Purchase ticket mutation
  const purchaseTicketMutation = useMutation({
    mutationFn: async (values: TicketFormValues) => {
      const selectedTicket = ticketOptions.find((option) => option.type === values.ticket_type);
      if (!selectedTicket) {
        throw new Error("Invalid ticket type selected");
      }
      
      const response = await apiRequest("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_id: eventId,
          ticket_type: values.ticket_type,
          quantity: values.quantity,
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
        description: "Your ticket(s) have been purchased successfully.",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to purchase ticket. Please try again.",
      });
    },
  });
  
  // Form submission handler
  function onSubmit(values: TicketFormValues) {
    purchaseTicketMutation.mutate(values);
  }
  
  const selectedTicketType = form.watch("ticket_type");
  const selectedTicket = ticketOptions.find((option) => option.type === selectedTicketType);
  const quantity = form.watch("quantity") || 0;
  const subtotal = selectedTicket ? selectedTicket.price * quantity : 0;
  
  if (isVerified === null) {
    return <p>Loading verification status...</p>;
  }
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Purchase Tickets</h3>
      
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
                          {option.type} - ${option.price.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the type of ticket you want to purchase
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={10} {...field} />
                  </FormControl>
                  <FormDescription>
                    Maximum of 10 tickets per purchase
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {selectedTicketType && (
              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm mb-2">
                  <span>Ticket Price:</span>
                  <span>${selectedTicket?.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Quantity:</span>
                  <span>{quantity}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full"
              disabled={purchaseTicketMutation.isPending}
            >
              {purchaseTicketMutation.isPending ? "Processing..." : "Purchase Tickets"}
            </Button>
          </form>
        </Form>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800">
          <h4 className="font-medium mb-2">Nurse Verification Required</h4>
          <p className="text-sm mb-4">
            To purchase tickets for {eventTitle}, you need to verify your nursing license. This is a one-time process that ensures our events remain exclusive to healthcare professionals.
          </p>
          <Button 
            variant="outline"
            onClick={() => window.location.href = "/license"}
          >
            Verify Your License
          </Button>
        </div>
      )}
    </div>
  );
}