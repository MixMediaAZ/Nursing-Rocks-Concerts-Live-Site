import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { Eye, EyeOff } from "lucide-react";

// Login form validation schema
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  
  // Form definition with validation
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    }
  });
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (values: LoginFormValues) => {
      // Normalize email to lowercase for case-insensitive login
      const normalizedValues = {
        ...values,
        email: values.email.toLowerCase().trim(),
      };
      const response = await apiRequest("POST", "/api/auth/login", {
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(normalizedValues),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed. Please check your credentials.");
      }
      
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      // Store token and user data
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        // Set isAdmin flag for admin page access
        if (data.user.is_admin) {
          localStorage.setItem("isAdmin", "true");
        } else {
          localStorage.removeItem("isAdmin");
        }
      }
      
      toast({
        title: "Login Successful",
        description: "Welcome back to Nursing Rocks!",
      });
      
      handleLoginSuccess();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
    }
  });
  
  // Redirect after successful login with a consistent approach across platforms
  function handleLoginSuccess() {
    // Check for redirect parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const redirectPath = urlParams.get('redirect');
    
    // Add a short timeout to ensure token is properly saved first
    setTimeout(() => {
      if (redirectPath) {
        // Honor the redirect parameter if present
        window.location.href = redirectPath;
      } else {
        // Direct all successful logins to the dashboard
        window.location.href = "/dashboard";
      }
    }, 100);
  }
  
  // Form submission handler
  function onSubmit(values: LoginFormValues) {
    loginMutation.mutate(values);
  }
  
  return (
    <div className="container max-w-md py-8">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••" 
                          {...field} 
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            Don't have an account yet?{" "}
            <Button 
              variant="link" 
              onClick={() => {
                // Check if there's a redirect parameter to preserve
                const urlParams = new URLSearchParams(window.location.search);
                const redirectPath = urlParams.get('redirect');
                
                if (redirectPath) {
                  window.location.href = `/register?redirect=${redirectPath}`;
                } else {
                  window.location.href = "/register";
                }
              }} 
              className="p-0"
            >
              Create Account
            </Button>
          </div>
          <div className="text-xs text-center text-muted-foreground">
            <Button 
              variant="link" 
              onClick={() => setLocation("/reset-password")} 
              className="p-0 text-xs"
            >
              Forgot your password?
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
