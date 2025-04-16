import { useEffect } from "react";
import { useLocation } from "wouter";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("token");
    if (token) {
      // Get redirect path from URL if present
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get("redirect") || "/";
      setLocation(redirect);
    }
  }, [setLocation]);
  
  function handleLoginSuccess() {
    // Get redirect path from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get("redirect") || "/";
    setLocation(redirect);
  }
  
  return (
    <div className="container py-10">
      <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Login</h1>
        <p className="text-muted-foreground text-center">
          Sign in to your Nursing Rocks! account to manage your license verification and purchase tickets.
        </p>
        
        <LoginForm onSuccess={handleLoginSuccess} />
      </div>
    </div>
  );
}