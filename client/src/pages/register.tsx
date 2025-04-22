import { useEffect } from "react";
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
import { ShieldCheck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Simple registration schema for account information only
const registerSchema = z.object({
  // Account information
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
  
  // Check if user is already logged in on mount - with improved error handling
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    
    // Check for redirect parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const redirectPath = urlParams.get('redirect');
    
    if (token && user) {
      try {
        // Parse user data to validate it (catches corrupted data)
        JSON.parse(user);
        // User is already logged in, redirect to profile or specified redirect path
        window.location.href = redirectPath || "/profile";
      } catch (error) {
        console.error("Error parsing user data during auth check:", error);
        // Clear invalid data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, []);
  
  // Form definition with validation
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      confirm_password: "",
    }
  });
  
  // Complete registration with account details only
  const registerMutation = useMutation({
    mutationFn: async (values: RegisterFormValues) => {
      // Remove confirm_password as it's not needed in the API
      const { confirm_password, ...registerData } = values;
      
      // Create the user account
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
      
      return {
        user: userData.user,
        token: userData.token
      };
    },
    onSuccess: async (data) => {
      // Store token and user data
      if (data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        toast({
          title: "Registration Successful",
          description: "Welcome to Nursing Rocks!",
        });
        
        // Wait a bit for the token to be properly saved
        setTimeout(() => {
          // Check for redirect parameter in URL
          const urlParams = new URLSearchParams(window.location.search);
          const redirectPath = urlParams.get('redirect');
          
          // Force a full page navigation to ensure auth state is refreshed
          window.location.href = redirectPath || '/profile';
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
  
  // Handle the complete form submission
  function onSubmit(values: RegisterFormValues) {
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
            Create an account to join the Nursing Rocks community
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                type="submit" 
                className="w-full"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Processing..." : "Register"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Button 
              variant="link" 
              onClick={() => {
                // Check if there's a redirect parameter to preserve
                const urlParams = new URLSearchParams(window.location.search);
                const redirectPath = urlParams.get('redirect');
                
                if (redirectPath) {
                  window.location.href = `/login?redirect=${redirectPath}`;
                } else {
                  window.location.href = "/login";
                }
              }} 
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