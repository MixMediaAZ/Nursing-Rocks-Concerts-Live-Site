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

// Login form validation schema
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  
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
      // #region agent log
      fetch('http://127.0.0.1:7256/ingest/99bf51b4-4988-46a2-ac14-c43ca591cfd4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/src/pages/login.tsx:mutationFn',message:'Login request initiated',data:{email:values.email,hasPassword:!!values.password},timestamp:Date.now(),sessionId:'debug-session',runId:'login-debug',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      const response = await apiRequest("POST", "/api/auth/login", {
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      
      // #region agent log
      fetch('http://127.0.0.1:7256/ingest/99bf51b4-4988-46a2-ac14-c43ca591cfd4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/src/pages/login.tsx:mutationFn',message:'Login response received',data:{status:response.status,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'login-debug',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      
      if (!response.ok) {
        const error = await response.json();
        // #region agent log
        fetch('http://127.0.0.1:7256/ingest/99bf51b4-4988-46a2-ac14-c43ca591cfd4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/src/pages/login.tsx:mutationFn',message:'Login failed',data:{status:response.status,error:error.message||'Unknown error'},timestamp:Date.now(),sessionId:'debug-session',runId:'login-debug',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
        throw new Error(error.message || "Login failed. Please check your credentials.");
      }
      
      const data = await response.json();
      // #region agent log
      fetch('http://127.0.0.1:7256/ingest/99bf51b4-4988-46a2-ac14-c43ca591cfd4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/src/pages/login.tsx:mutationFn',message:'Login response parsed',data:{hasToken:!!data.token,hasUser:!!data.user,userId:data.user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'login-debug',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      return data;
    },
    onSuccess: (data) => {
      // #region agent log
      fetch('http://127.0.0.1:7256/ingest/99bf51b4-4988-46a2-ac14-c43ca591cfd4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/src/pages/login.tsx:onSuccess',message:'Login success handler',data:{hasToken:!!data.token,hasUser:!!data.user},timestamp:Date.now(),sessionId:'debug-session',runId:'login-debug',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      // Store token and user data
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7256/ingest/99bf51b4-4988-46a2-ac14-c43ca591cfd4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/src/pages/login.tsx:onSuccess',message:'Token and user stored in localStorage',data:{tokenStored:!!localStorage.getItem('token'),userStored:!!localStorage.getItem('user')},timestamp:Date.now(),sessionId:'debug-session',runId:'login-debug',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      
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
    // #region agent log
    fetch('http://127.0.0.1:7256/ingest/99bf51b4-4988-46a2-ac14-c43ca591cfd4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/src/pages/login.tsx:handleLoginSuccess',message:'Login success redirect handler',data:{currentPath:window.location.pathname,search:window.location.search},timestamp:Date.now(),sessionId:'debug-session',runId:'login-debug',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    // Check for redirect parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const redirectPath = urlParams.get('redirect');
    
    // #region agent log
    fetch('http://127.0.0.1:7256/ingest/99bf51b4-4988-46a2-ac14-c43ca591cfd4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/src/pages/login.tsx:handleLoginSuccess',message:'Redirect path determined',data:{redirectPath:redirectPath||'/dashboard'},timestamp:Date.now(),sessionId:'debug-session',runId:'login-debug',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    
    // Add a short timeout to ensure token is properly saved first
    setTimeout(() => {
      if (redirectPath) {
        // Honor the redirect parameter if present
        // #region agent log
        fetch('http://127.0.0.1:7256/ingest/99bf51b4-4988-46a2-ac14-c43ca591cfd4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/src/pages/login.tsx:handleLoginSuccess',message:'Redirecting to custom path',data:{redirectPath},timestamp:Date.now(),sessionId:'debug-session',runId:'login-debug',hypothesisId:'H3'})}).catch(()=>{});
        // #endregion
        window.location.href = redirectPath;
      } else {
        // Direct all successful logins to the dashboard
        // #region agent log
        fetch('http://127.0.0.1:7256/ingest/99bf51b4-4988-46a2-ac14-c43ca591cfd4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/src/pages/login.tsx:handleLoginSuccess',message:'Redirecting to dashboard',data:{path:'/dashboard'},timestamp:Date.now(),sessionId:'debug-session',runId:'login-debug',hypothesisId:'H3'})}).catch(()=>{});
        // #endregion
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
                      <Input type="password" placeholder="••••••••" {...field} />
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