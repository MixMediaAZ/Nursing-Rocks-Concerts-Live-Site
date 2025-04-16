import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";

// License form validation schema
const licenseSchema = z.object({
  license_number: z.string().min(4, { message: "License number must be at least 4 characters" }),
  state: z.string().min(2, { message: "Please select a state" }),
  expiration_date: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date > new Date();
  }, { message: "Expiration date must be in the future" }),
});

type LicenseFormValues = z.infer<typeof licenseSchema>;

const US_STATES = [
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

export default function LicensePage() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("submit");
  
  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please login or register to verify your nursing license.",
      });
      setLocation("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, []);
  
  // Form definition with validation
  const form = useForm<LicenseFormValues>({
    resolver: zodResolver(licenseSchema),
    defaultValues: {
      license_number: "",
      state: "",
      expiration_date: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0],
    }
  });
  
  // Fetch existing licenses
  const { data: licenses, isLoading: isLoadingLicenses, refetch } = useQuery({
    queryKey: ['/api/auth/licenses'],
    enabled: isAuthenticated === true,
  });
  
  // License submission mutation
  const submitLicenseMutation = useMutation({
    mutationFn: async (values: LicenseFormValues) => {
      const response = await apiRequest("/api/auth/license", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "License submission failed. Please try again.");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "License Submitted Successfully",
        description: "Your nursing license verification is now pending review.",
      });
      
      // Switch to status tab and refresh license list
      setActiveTab("status");
      refetch();
      handleVerificationSuccess();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "License Submission Failed",
        description: error.message,
      });
    }
  });
  
  // Handle after verification
  function handleVerificationSuccess() {
    // Update local user data if any license is verified
    if (licenses?.licenses?.some(license => license.status === 'verified')) {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      userData.is_verified = true;
      localStorage.setItem("user", JSON.stringify(userData));
    }
  }
  
  // Form submission handler
  function onSubmit(values: LicenseFormValues) {
    submitLicenseMutation.mutate(values);
  }
  
  // Get status icon based on verification status
  function getStatusIcon(status: string) {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'invalid':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-amber-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  }
  
  // Get text label for verification status
  function getStatusText(status: string) {
    switch (status) {
      case 'verified':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Verified</Badge>;
      case 'invalid':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Invalid</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Unknown</Badge>;
    }
  }
  
  if (isAuthenticated === false) {
    return null; // Redirecting to login
  }
  
  return (
    <div className="container max-w-3xl py-8">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Nursing License Verification</CardTitle>
          <CardDescription className="text-center">
            Verify your nursing license to access exclusive events and ticket purchases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="submit" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="submit">Submit License</TabsTrigger>
              <TabsTrigger value="status">Verification Status</TabsTrigger>
            </TabsList>
            <TabsContent value="submit">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="license_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Number</FormLabel>
                        <FormControl>
                          <Input placeholder="RN123456" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter your nursing license number exactly as it appears on your credential
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
                        <FormLabel>State of Issue</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {US_STATES.map(state => (
                              <SelectItem key={state.value} value={state.value}>
                                {state.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the state that issued your nursing license
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
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter the expiration date of your license
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Alert className="my-6 bg-blue-50 border-blue-200">
                    <AlertTitle className="text-blue-800">Verification Process</AlertTitle>
                    <AlertDescription className="text-blue-700">
                      Your license information will be verified with the appropriate nursing board.
                      This typically takes just a few moments, but may require manual review in some cases.
                    </AlertDescription>
                  </Alert>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={submitLicenseMutation.isPending}
                  >
                    {submitLicenseMutation.isPending ? "Submitting..." : "Submit License for Verification"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="status">
              {isLoadingLicenses ? (
                <div className="py-8 text-center">Loading license information...</div>
              ) : licenses?.licenses?.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Your Submitted Licenses</h3>
                  <div className="border rounded-md divide-y">
                    {licenses.licenses.map((license: any) => (
                      <div key={license.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              License #{license.license_number}
                              <span className="text-sm text-muted-foreground">({license.state})</span>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Submitted on {formatDate(license.created_at || new Date().toISOString())}
                            </div>
                            <div className="text-sm mt-1">
                              Expiration: {formatDate(license.expiration_date)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(license.status)}
                            {getStatusText(license.status)}
                          </div>
                        </div>
                        
                        {license.status === 'verified' && (
                          <div className="mt-3 p-2 bg-green-50 text-green-800 text-sm rounded">
                            Your license has been verified. You can now purchase tickets to all events!
                          </div>
                        )}
                        
                        {license.status === 'invalid' && (
                          <div className="mt-3 p-2 bg-red-50 text-red-800 text-sm rounded">
                            We could not verify this license. Please check your information and try again.
                          </div>
                        )}
                        
                        {license.status === 'pending' && (
                          <div className="mt-3 p-2 bg-amber-50 text-amber-800 text-sm rounded">
                            Your license verification is in progress. This typically takes a few moments.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {licenses.licenses.some((license: any) => license.status === 'verified') ? (
                    <Alert className="bg-green-50 border-green-200">
                      <AlertTitle className="text-green-800">Verification Complete</AlertTitle>
                      <AlertDescription className="text-green-700">
                        Your nursing license is verified! You now have full access to purchase tickets for all Nursing Rocks! events.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Button onClick={() => setActiveTab("submit")} className="w-full mt-4">
                      Submit Another License
                    </Button>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center space-y-4">
                  <div className="text-muted-foreground">You haven't submitted any licenses yet.</div>
                  <Button onClick={() => setActiveTab("submit")}>
                    Submit a License
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-center text-muted-foreground">
            Need help with your license verification?{" "}
            <Button 
              variant="link" 
              onClick={() => window.location.href = "mailto:support@nursingrocks.com"} 
              className="p-0"
            >
              Contact Support
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}