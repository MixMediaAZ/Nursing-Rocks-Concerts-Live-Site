import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck, Ticket, Info, CalendarClock, AlertTriangle } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Form validation schema
const newsletterSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  first_name: z.string().min(1, { message: "First name is required" }),
  last_name: z.string().min(1, { message: "Last name is required" })
});

export default function FreeTickets() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);
  
  // Initialize form
  const form = useForm<z.infer<typeof newsletterSchema>>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      email: "",
      first_name: "",
      last_name: ""
    }
  });
  
  // Check authentication status on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    if (token && storedUser) {
      setIsAuthenticated(true);
      try {
        const user = JSON.parse(storedUser);
        setUserData(user);
        setIsVerified(user.is_verified || false);
        
        // Pre-fill the form with user data if available
        form.setValue("email", user.email || "");
        form.setValue("first_name", user.first_name || "");
        form.setValue("last_name", user.last_name || "");
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    } else {
      setIsAuthenticated(false);
      
      // If user is not authenticated, show toast and redirect to register page
      toast({
        title: "Authentication Required",
        description: "Please register or login to access free tickets.",
      });
      setLocation("/register");
    }
  }, []);

  // Handle form submission
  const onSubmit = (data: z.infer<typeof newsletterSchema>) => {
    // Store the data for future processing
    localStorage.setItem("newsletter_data", JSON.stringify(data));
    
    toast({
      title: "Information Saved",
      description: "Your information has been saved. We'll notify you about free tickets.",
    });
  };
  
  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold text-center mb-2">Free Concert Tickets for Nurses</h1>
      <p className="text-center text-muted-foreground mb-8">
        We appreciate your dedication to healthcare. Verify your nursing license to receive free tickets.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-center mb-2">
                <div className="rounded-full bg-primary/10 p-2">
                  <Ticket className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle className="text-center">How It Works</CardTitle>
              <CardDescription className="text-center">
                Simple steps to get your free tickets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center text-primary font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-medium">Create an Account</h3>
                  <p className="text-sm text-muted-foreground">
                    Register with your email and create a password
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center text-primary font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-medium">Verify Your License</h3>
                  <p className="text-sm text-muted-foreground">
                    Submit your nursing license information for verification
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center text-primary font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-medium">Get Your Tickets</h3>
                  <p className="text-sm text-muted-foreground">
                    Once verified, you'll receive free tickets to our concerts
                  </p>
                </div>
              </div>
              
              <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Verification typically takes 1-2 business days. You'll receive an email notification when complete.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Get Free Tickets</CardTitle>
              <CardDescription>
                {isAuthenticated 
                  ? "Complete the process to receive your free concert tickets"
                  : "Register and verify your nursing license to access free tickets"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAuthenticated ? (
                isVerified ? (
                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex gap-4 items-center">
                      <ShieldCheck className="h-8 w-8 text-green-600 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-green-800">Verification Complete</h3>
                        <p className="text-sm text-green-700">
                          Your nursing license has been verified. You are eligible for free concert tickets!
                        </p>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">Subscribe To Our Newsletter</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Stay updated on new concerts and when tickets become available.
                      </p>
                      
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="first_name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>First Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="John" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="last_name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Last Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Doe" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input placeholder="john.doe@example.com" {...field} />
                                </FormControl>
                                <FormDescription>
                                  We'll never share your email with anyone else.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex gap-4">
                            <Button type="submit">
                              Subscribe
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setLocation("/tickets")}>
                              View My Tickets
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex flex-col gap-4">
                      <h3 className="font-medium">Upcoming Concerts with Free Tickets</h3>
                      <div className="border rounded-lg p-4 flex items-center gap-4">
                        <CalendarClock className="h-8 w-8 text-primary/70" />
                        <div>
                          <h4 className="font-medium">The Healing Harmonies</h4>
                          <p className="text-sm text-muted-foreground">
                            June 15, 2025 • City Medical Center Auditorium
                          </p>
                          <div className="mt-2">
                            <Button size="sm" onClick={() => setLocation("/events/1")}>
                              Get Tickets
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4 flex items-center gap-4">
                        <CalendarClock className="h-8 w-8 text-primary/70" />
                        <div>
                          <h4 className="font-medium">Frontline Melody Makers</h4>
                          <p className="text-sm text-muted-foreground">
                            July 22, 2025 • Nurses Memorial Hall
                          </p>
                          <div className="mt-2">
                            <Button size="sm" onClick={() => setLocation("/events/2")}>
                              Get Tickets
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                      <Info className="h-4 w-4" />
                      <AlertTitle>Verification Required</AlertTitle>
                      <AlertDescription>
                        Your nursing license needs to be verified before you can receive free tickets.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="flex flex-col items-center gap-4 py-6">
                      <ShieldCheck className="h-16 w-16 text-muted-foreground/30" />
                      <h3 className="text-lg font-medium">Complete Your Verification</h3>
                      <p className="text-center text-muted-foreground max-w-md">
                        Please complete the license verification process to unlock free tickets to all our concerts.
                      </p>
                      <Button onClick={() => setLocation("/register")}>
                        Verify Your License
                      </Button>
                    </div>
                  </div>
                )
              ) : (
                <div className="space-y-6">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Authentication Required</AlertTitle>
                    <AlertDescription>
                      Please create an account or log in to verify your nursing license and receive free tickets.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex flex-col items-center gap-4 py-6">
                    <ShieldCheck className="h-16 w-16 text-muted-foreground/30" />
                    <h3 className="text-lg font-medium">Sign Up or Log In</h3>
                    <p className="text-center text-muted-foreground max-w-md">
                      Create an account or log in to verify your nursing license and access free concert tickets.
                    </p>
                    <div className="flex gap-4">
                      <Button onClick={() => setLocation("/register")}>
                        Create Account
                      </Button>
                      <Button variant="outline" onClick={() => setLocation("/login")}>
                        Log In
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}