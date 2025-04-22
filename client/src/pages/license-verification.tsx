import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { NurseLicenseVerification } from "@/components/nurse-license-verification";

export default function LicenseVerificationPage() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  // Check authentication status on mount with improved cross-platform compatibility
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please login to verify your license and get free tickets.",
      });
      // Use direct navigation for better cross-platform consistency
      window.location.href = "/register";
    } else {
      setIsAuthenticated(true);
    }
  }, []);
  
  // Check if user is already verified and has tickets
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.is_verified) {
          // If already verified, direct them to tickets page
          toast({
            title: "Already Verified",
            description: "Your nursing license is already verified. Redirecting to your tickets.",
          });
          // Use setTimeout to ensure toast is shown before redirect
          setTimeout(() => {
            window.location.href = "/tickets";
          }, 200);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        // Clear corrupted data
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
  }, []);
  
  if (isAuthenticated === false) {
    return null; // Will redirect to login
  }
  
  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold text-center mb-2">Nurse License Verification</h1>
      <p className="text-center text-muted-foreground mb-8">
        Verify your nursing license to receive free tickets to our upcoming concerts.
      </p>
      
      <NurseLicenseVerification />
      
      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>Need help with verification? Contact our support at support@nursingrocks.org</p>
      </div>
    </div>
  );
}