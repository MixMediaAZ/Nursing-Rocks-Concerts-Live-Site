import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, ChevronRight, FileCheck, Loader2, ShieldCheck, Ticket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Schema for license verification form
const licenseSchema = z.object({
  first_name: z.string().min(2, "First name is required"),
  last_name: z.string().min(2, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  license_number: z.string().min(4, "License number is too short"),
  state: z.string().min(2, "Please select a state"),
  expiration_date: z.date({
    required_error: "Please select an expiration date",
  }),
  agree_to_terms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions",
  }),
});

const states = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "DC", label: "District of Columbia" },
];

export function NurseLicenseVerification() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("register");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Auth status query
  const { data: authData } = useQuery({
    queryKey: ['/api/auth/status'],
    queryFn: async () => {
      const response = await fetch('/api/auth/status');
      return response.json();
    }
  });
  
  // Update state when auth data changes
  useEffect(() => {
    if (authData) {
      setIsAuthenticated(authData.isAuthenticated);
      setIsVerified(authData.isVerified);
    }
  }, [authData]);

  // License query
  const { data: licenses, isLoading: licensesLoading } = useQuery({
    queryKey: ['/api/licenses'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/licenses', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) {
          console.error("License fetch error:", response.status, response.statusText);
          return [];
        }
        const data = await response.json();
        console.log("License data:", data);
        return data.licenses || data || [];
      } catch (error) {
        console.error("Error fetching licenses:", error);
        return [];
      }
    },
    enabled: isAuthenticated && !isVerified
  });

  // Form for license verification
  const form = useForm<z.infer<typeof licenseSchema>>({
    resolver: zodResolver(licenseSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      license_number: "",
      state: "",
      agree_to_terms: false,
    },
  });
  
  // Mutation for submitting nurse license
  const submitLicenseMutation = useMutation({
    mutationFn: async (formData: z.infer<typeof licenseSchema>) => {
      const response = await fetch('/api/licenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          license_number: formData.license_number,
          state: formData.state,
          expiration_date: format(formData.expiration_date, "yyyy-MM-dd")
        })
      });
      
      // Handle non-OK responses
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error submitting license');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "License submitted successfully",
        description: "Your nursing license is now pending verification.",
      });
      queryClient.invalidateQueries({queryKey: ['/api/licenses']});
      queryClient.invalidateQueries({queryKey: ['/api/auth/status']});
      form.reset();
      // Redirect to profile page after successful submission
      setLocation("/profile");
    },
    onError: (error: any) => {
      toast({
        title: "Error submitting license",
        description: error.message || "There was a problem submitting your license information. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const onSubmit = (data: z.infer<typeof licenseSchema>) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in or create an account first.",
        variant: "destructive",
      });
      setActiveTab("login");
      return;
    }
    
    submitLicenseMutation.mutate(data);
  };

  // If the user is already verified, show success state
  if (isVerified) {
    return (
      <div className="max-w-3xl mx-auto mt-8 p-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <ShieldCheck className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">Nurse License Verified</CardTitle>
            <CardDescription className="text-center text-base">
              Your nursing credentials have been successfully verified in our system!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-white p-4 shadow-sm border border-green-100">
              <div className="flex items-center gap-3 mb-2">
                <FileCheck className="h-5 w-5 text-green-600" />
                <h3 className="font-medium">Verification Complete</h3>
              </div>
              <p className="text-sm text-muted-foreground pl-8">
                Your nursing license has been verified and you now have access to all benefits
                offered to verified healthcare professionals.
              </p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm border border-green-100">
              <div className="flex items-center gap-3 mb-2">
                <Ticket className="h-5 w-5 text-green-600" />
                <h3 className="font-medium">Free Concert Tickets</h3>
              </div>
              <p className="text-sm text-muted-foreground pl-8">
                As a verified nurse, you're eligible for free tickets to Nursing Rocks concerts
                in your area. Check our events page to see upcoming concerts.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Button onClick={() => setLocation("/events")} className="gap-1">
              Browse Concerts <ChevronRight className="h-4 w-4" />
            </Button>
            <Button onClick={() => setLocation("/tickets")} variant="outline">
              My Tickets
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-8 p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">Nurse License Verification</CardTitle>
          <CardDescription className="text-center text-base">
            Verify your nursing license to receive free concert tickets and exclusive benefits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="register">License Verification</TabsTrigger>
              <TabsTrigger value="login">Login / Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="register">
              {!isAuthenticated ? (
                <div className="text-center p-6 bg-muted/50 rounded-lg">
                  <p className="mb-4">Please log in or create an account to verify your nursing license.</p>
                  <Button 
                    variant="default" 
                    onClick={() => setActiveTab("login")}
                  >
                    Login / Register
                  </Button>
                </div>
              ) : (
                <>
                  {licensesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : licenses && licenses.length > 0 ? (
                    <div className="space-y-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <h3 className="font-medium flex items-center gap-2 text-amber-800">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Verification in Progress
                        </h3>
                        <p className="text-sm text-amber-700 mt-1">
                          Your license is currently being verified. This process typically takes 1-2 business days.
                          We'll notify you by email when your verification is complete.
                        </p>
                      </div>
                      
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-muted px-4 py-2 text-sm font-medium">
                          Submitted License
                        </div>
                        <div className="p-4 space-y-3">
                          {licenses.map((license: any) => (
                            <div key={license.id} className="bg-card p-3 rounded border">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">License Number:</span>
                                  <p className="font-medium">{license.license_number}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">State:</span>
                                  <p className="font-medium">
                                    {states.find(s => s.value === license.state)?.label || license.state}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Expiration Date:</span>
                                  <p className="font-medium">
                                    {new Date(license.expiration_date).toLocaleDateString()}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Status:</span>
                                  <p className="font-medium capitalize">
                                    {license.status}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                          <h3 className="font-medium text-blue-700 mb-2">Personal Information</h3>
                          <p className="text-sm text-blue-600 mb-1">
                            Please provide your personal information for verification purposes.
                          </p>
                        </div>
                      
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="first_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your first name" {...field} />
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
                                  <Input placeholder="Enter your last name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="Enter your email address" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="(555) 123-4567" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-2">
                          <h3 className="font-medium text-blue-700 mb-2">License Information</h3>
                          <p className="text-sm text-blue-600 mb-1">
                            Enter your nursing license details exactly as they appear on your license.
                          </p>
                        </div>
                      
                        <FormField
                          control={form.control}
                          name="license_number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nursing License Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your license number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State of License</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select the state of your license" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="max-h-80">
                                  {states.map(state => (
                                    <SelectItem key={state.value} value={state.value}>
                                      {state.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="expiration_date"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>License Expiration Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={`w-full pl-3 text-left font-normal ${
                                        !field.value && "text-muted-foreground"
                                      }`}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Pick an expiration date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date < new Date()}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="agree_to_terms"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <p className="font-medium text-sm">
                                  I acknowledge that the information provided is accurate and complete
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  By checking this box, you confirm that your nursing license is valid and current.
                                </p>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            By submitting your license information, you authorize Nursing Rocks to verify your credentials
                            with the appropriate licensing board. Your information will be kept secure and used only for
                            verification purposes.
                          </p>
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={submitLicenseMutation.isPending}
                        >
                          {submitLicenseMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit License for Verification"
                          )}
                        </Button>
                      </form>
                    </Form>
                  )}
                </>
              )}
            </TabsContent>
            
            <TabsContent value="login">
              <div className="space-y-4 text-center">
                <p>
                  Please log in to your existing account or create a new account to proceed with license verification.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    variant="default" 
                    size="lg"
                    onClick={() => setLocation("/login?redirect=/license")}
                  >
                    Login
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => setLocation("/register?redirect=/license")}
                  >
                    Create Account
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold text-center">Benefits of License Verification</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Free Concert Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Verified nurses receive complimentary tickets to Nursing Rocks concerts in their area.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Exclusive Merchandise</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Access special edition merchandise and discounts only available to verified healthcare professionals.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">VIP Experiences</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Opportunity to participate in meet-and-greets with artists and backstage tours.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Community Recognition</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Be recognized at events for your contributions to healthcare and your community.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}