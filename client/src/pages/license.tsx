import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Loader2, CheckCircle, ShieldCheck, Calendar, Ticket } from "lucide-react";

// Form schema
const licenseSchema = z.object({
  license_number: z.string().min(4, "License number is required"),
  state: z.string().min(2, "State is required"),
  expiration_date: z.string().min(1, "Expiration date is required"),
});

// List of US states
const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

export default function LicensePage() {
  const [isVerified, setIsVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Define form
  const form = useForm<z.infer<typeof licenseSchema>>({
    resolver: zodResolver(licenseSchema),
    defaultValues: {
      license_number: "",
      state: "",
      expiration_date: "",
    },
  });
  
  // License submission mutation
  const submitLicense = useMutation({
    mutationFn: async (data: z.infer<typeof licenseSchema>) => {
      setIsSubmitting(true);
      try {
        const response = await apiRequest(
          "POST", 
          "/api/auth/license", 
          data
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to verify license");
        }
        
        return await response.json();
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "License Verified",
        description: "Your nursing license has been verified successfully!",
      });
      setIsVerified(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: z.infer<typeof licenseSchema>) => {
    submitLicense.mutate(data);
  };
  
  return (
    <div className="container py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Nursing License Verification</h1>
          <p className="text-muted-foreground">
            Verify your nursing license to access exclusive benefits including free concert tickets
          </p>
        </div>
        
        {isVerified ? (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <CheckCircle className="h-6 w-6" />
                <CardTitle>License Verified Successfully</CardTitle>
              </div>
              <CardDescription>
                Your nursing license has been verified. You are now eligible for free tickets and other exclusive benefits.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-white p-4 rounded-lg border flex items-start gap-3">
                  <div className="p-2 rounded-full bg-blue-100">
                    <Ticket className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Free Concert Tickets</h3>
                    <p className="text-sm text-muted-foreground">
                      You can now claim free tickets to select Nursing Rocks concerts. Check the upcoming events page.
                    </p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border flex items-start gap-3">
                  <div className="p-2 rounded-full bg-purple-100">
                    <ShieldCheck className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Store Discounts</h3>
                    <p className="text-sm text-muted-foreground">
                      Enjoy exclusive discounts on Nursing Rocks merchandise in our online store.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center flex-col md:flex-row gap-3">
              <Button asChild className="w-full md:w-auto">
                <a href="/events">Browse Upcoming Concerts</a>
              </Button>
              <Button asChild variant="outline" className="w-full md:w-auto">
                <a href="/store">Shop Discounted Merchandise</a>
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-primary mb-2">
                <ShieldCheck className="h-6 w-6" />
                <CardTitle>Verify Your Nursing License</CardTitle>
              </div>
              <CardDescription>
                Please provide your nursing license information to verify your credentials. Once verified, you'll gain access to free concert tickets and other exclusive benefits.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="license_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your nursing license number" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your nursing license number as it appears on your credentials
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select the state of licensure" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {US_STATES.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The state where your license was issued
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="expiration_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiration Date</FormLabel>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <FormDescription>
                          The date your nursing license expires
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying License...
                      </>
                    ) : (
                      "Verify License"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
        
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="text-lg font-medium mb-2">License Verification FAQ</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">How does verification work?</h4>
              <p className="text-sm text-muted-foreground">
                We verify your nursing license with the state nursing board database. The process is typically instant but may take up to 24 hours in some cases.
              </p>
            </div>
            <div>
              <h4 className="font-medium">Is my information secure?</h4>
              <p className="text-sm text-muted-foreground">
                Yes, your license information is encrypted and only used for verification purposes. We do not share your personal data with third parties.
              </p>
            </div>
            <div>
              <h4 className="font-medium">What benefits do I get?</h4>
              <p className="text-sm text-muted-foreground">
                Verified nurses can access free concert tickets, exclusive merchandise discounts, networking opportunities, and more.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}