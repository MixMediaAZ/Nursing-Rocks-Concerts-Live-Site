import { useEffect } from "react";
import { useLocation } from "wouter";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("token");
    if (token) {
      setLocation("/");
    }
  }, [setLocation]);
  
  function handleRegistrationSuccess() {
    // Redirect to license verification page after successful registration
    setLocation("/license");
  }
  
  return (
    <div className="container py-10">
      <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Create an Account</h1>
        <p className="text-muted-foreground text-center">
          Join the Nursing Rocks! community and get exclusive access to concerts for healthcare professionals.
        </p>
        
        <RegisterForm onSuccess={handleRegistrationSuccess} />
      </div>
    </div>
  );
}