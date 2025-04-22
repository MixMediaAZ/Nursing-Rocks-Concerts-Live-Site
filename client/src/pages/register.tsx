import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Combined registration schema for both account and license verification
const registerSchema = z.object({
  // Account information
  first_name: z.string().min(2, { message: "First name must be at least 2 characters" }),
  last_name: z.string().min(2, { message: "Last name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirm_password: z.string(),
  
  // License information
  license_number: z.string().min(4, { message: "Please enter a valid license number" }),
  state: z.string().min(1, { message: "Please select your state" }),
  expiration_date: z.date({
    required_error: "Please select an expiration date",
  }).refine(date => date > new Date(), {
    message: "Expiration date must be in the future"
  }),
  agree_to_terms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms to proceed",
  }),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

// Account-only schema for validating the first step
const accountSchema = z.object({
  first_name: z.string().min(2, { message: "First name must be at least 2 characters" }),
  last_name: z.string().min(2, { message: "Last name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [step, setStep] = useState<'account' | 'license'>('account');
  
  // Form definition with validation for the two-step form
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      confirm_password: "",
      license_number: "",
      state: "",
      agree_to_terms: false,
      expiration_date: new Date(new Date().setFullYear(new Date().getFullYear() + 2)),
    }
  });
  
  // Complete registration with account and license details
  const registerMutation = useMutation({
    mutationFn: async (values: RegisterFormValues) => {
      // Remove confirm_password as it's not needed in the API
      const { confirm_password, ...registerData } = values;
      
      // First create the user account
      const userResponse = await apiRequest("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: registerData.first_name,
          last_name: registerData.last_name,
          email: registerData.email,
          password: registerData.password,
        }),
      });
      
      if (!userResponse.ok) {
        const error = await userResponse.json();
        throw new Error(error.message || "Registration failed. Please try again.");
      }
      
      const userData = await userResponse.json();
      
      // Store token and user data
      localStorage.setItem("token", userData.token);
      localStorage.setItem("user", JSON.stringify(userData.user));
      
      // Then submit the license data
      const licenseResponse = await apiRequest("/api/licenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userData.token}`
        },
        body: JSON.stringify({
          license_number: registerData.license_number,
          state: registerData.state,
          expiration_date: registerData.expiration_date instanceof Date && !isNaN(registerData.expiration_date.getTime()) 
            ? format(registerData.expiration_date, "yyyy-MM-dd") 
            : null
        })
      });
      
      if (!licenseResponse.ok) {
        const error = await licenseResponse.json();
        throw new Error(error.message || "License verification failed. Please try again.");
      }
      
      return {
        user: userData.user,
        token: userData.token,
        license: await licenseResponse.json()
      };
    },
    onSuccess: async (data) => {
      // Store token and user data
      if (data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        toast({
          title: "Registration Successful",
          description: "Welcome to Nursing Rocks! Your nursing license verification is being processed.",
        });
        
        // Wait a bit for the token to be properly saved
        setTimeout(() => {
          // Force a full page navigation to ensure auth state is refreshed
          window.location.href = '/profile';
        }, 500);
      } else {
        toast({
          variant: "destructive",
          title: "Registration Error",
          description: "There was a problem with your registration. Please try again.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message,
      });
    }
  });
  
  // Handle the account information step
  function handleAccountStep() {
    // Validate just the account fields
    const accountData = form.getValues();
    const accountResult = accountSchema.safeParse(accountData);
    
    if (accountResult.success) {
      setStep('license');
    } else {
      // Trigger validation to show error messages
      form.trigger(['first_name', 'last_name', 'email', 'password', 'confirm_password']);
    }
  }
  
  // Handle the complete form submission
  function onSubmit(values: RegisterFormValues) {
    // Validate the expiration date before submitting
    if (!values.expiration_date || !(values.expiration_date instanceof Date) || isNaN(values.expiration_date.getTime())) {
      toast({
        variant: "destructive",
        title: "Invalid Date",
        description: "Please select a valid expiration date for your license"
      });
      return;
    }
    
    registerMutation.mutate(values);
  }
  
  return (
    <div className="container max-w-lg py-8">
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <div className="rounded-full bg-primary/10 p-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Nurse Registration</CardTitle>
          <CardDescription className="text-center">
            Create an account and verify your nursing license to receive free concert tickets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {step === 'account' ? (
                <>
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormDescription>
                          Must be at least 8 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="confirm_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="button" 
                    className="w-full"
                    onClick={handleAccountStep}
                  >
                    Continue
                  </Button>
                </>
              ) : (
                <>
                  <div className="bg-primary/5 p-4 rounded-lg mb-6">
                    <h3 className="font-medium text-primary mb-2">Nursing License Verification</h3>
                    <p className="text-sm text-muted-foreground">
                      Please provide your nursing license details below. This information will be verified
                      to grant you access to free concert tickets and exclusive benefits.
                    </p>
                  </div>
                
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
                          Enter your nursing license number exactly as it appears on your license.
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
                              <SelectValue placeholder="Select a state" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="AL">Alabama</SelectItem>
                            <SelectItem value="AK">Alaska</SelectItem>
                            <SelectItem value="AZ">Arizona</SelectItem>
                            <SelectItem value="AR">Arkansas</SelectItem>
                            <SelectItem value="CA">California</SelectItem>
                            <SelectItem value="CO">Colorado</SelectItem>
                            <SelectItem value="CT">Connecticut</SelectItem>
                            <SelectItem value="DE">Delaware</SelectItem>
                            <SelectItem value="FL">Florida</SelectItem>
                            <SelectItem value="GA">Georgia</SelectItem>
                            <SelectItem value="HI">Hawaii</SelectItem>
                            <SelectItem value="ID">Idaho</SelectItem>
                            <SelectItem value="IL">Illinois</SelectItem>
                            <SelectItem value="IN">Indiana</SelectItem>
                            <SelectItem value="IA">Iowa</SelectItem>
                            <SelectItem value="KS">Kansas</SelectItem>
                            <SelectItem value="KY">Kentucky</SelectItem>
                            <SelectItem value="LA">Louisiana</SelectItem>
                            <SelectItem value="ME">Maine</SelectItem>
                            <SelectItem value="MD">Maryland</SelectItem>
                            <SelectItem value="MA">Massachusetts</SelectItem>
                            <SelectItem value="MI">Michigan</SelectItem>
                            <SelectItem value="MN">Minnesota</SelectItem>
                            <SelectItem value="MS">Mississippi</SelectItem>
                            <SelectItem value="MO">Missouri</SelectItem>
                            <SelectItem value="MT">Montana</SelectItem>
                            <SelectItem value="NE">Nebraska</SelectItem>
                            <SelectItem value="NV">Nevada</SelectItem>
                            <SelectItem value="NH">New Hampshire</SelectItem>
                            <SelectItem value="NJ">New Jersey</SelectItem>
                            <SelectItem value="NM">New Mexico</SelectItem>
                            <SelectItem value="NY">New York</SelectItem>
                            <SelectItem value="NC">North Carolina</SelectItem>
                            <SelectItem value="ND">North Dakota</SelectItem>
                            <SelectItem value="OH">Ohio</SelectItem>
                            <SelectItem value="OK">Oklahoma</SelectItem>
                            <SelectItem value="OR">Oregon</SelectItem>
                            <SelectItem value="PA">Pennsylvania</SelectItem>
                            <SelectItem value="RI">Rhode Island</SelectItem>
                            <SelectItem value="SC">South Carolina</SelectItem>
                            <SelectItem value="SD">South Dakota</SelectItem>
                            <SelectItem value="TN">Tennessee</SelectItem>
                            <SelectItem value="TX">Texas</SelectItem>
                            <SelectItem value="UT">Utah</SelectItem>
                            <SelectItem value="VT">Vermont</SelectItem>
                            <SelectItem value="VA">Virginia</SelectItem>
                            <SelectItem value="WA">Washington</SelectItem>
                            <SelectItem value="WV">West Virginia</SelectItem>
                            <SelectItem value="WI">Wisconsin</SelectItem>
                            <SelectItem value="WY">Wyoming</SelectItem>
                            <SelectItem value="DC">District of Columbia</SelectItem>
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
                        <FormLabel>Expiration Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value && field.value instanceof Date && !isNaN(field.value.getTime()) ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value instanceof Date && !isNaN(field.value.getTime()) ? field.value : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  field.onChange(date);
                                }
                              }}
                              disabled={(date) => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                return date < today;
                              }}
                              fromDate={new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          When does your nursing license expire?
                        </FormDescription>
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
                          <FormLabel>
                            I agree to the verification of my nursing license
                          </FormLabel>
                          <FormDescription>
                            By checking this box, you allow Nursing Rocks to verify your license with the appropriate state board of nursing.
                          </FormDescription>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setStep('account')}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Processing..." : "Complete Registration"}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Button 
              variant="link" 
              onClick={() => setLocation("/login")} 
              className="p-0"
            >
              Sign In
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}