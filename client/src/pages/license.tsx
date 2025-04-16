import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { LicenseForm } from "@/components/auth/license-form";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  BadgeCheck, 
  Clock, 
  AlertTriangle, 
  XCircle 
} from "lucide-react";

export default function LicensePage() {
  const [, setLocation] = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoggedIn(false);
      setLocation("/login?redirect=/license");
    } else {
      setIsLoggedIn(true);
    }
  }, [setLocation]);
  
  const { data: licenses = [], isLoading, error } = useQuery<any[]>({
    queryKey: ["/api/license"],
    enabled: isLoggedIn,
  });
  
  function handleVerificationSuccess() {
    // Refetch the licenses after successful submission
    window.location.reload();
  }
  
  function getStatusIcon(status: string) {
    switch (status) {
      case "verified":
        return <BadgeCheck className="h-6 w-6 text-green-500" />;
      case "pending":
        return <Clock className="h-6 w-6 text-amber-500" />;
      case "rejected":
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-gray-500" />;
    }
  }
  
  function getStatusText(status: string) {
    switch (status) {
      case "verified":
        return "Verified";
      case "pending":
        return "Verification Pending";
      case "rejected":
        return "Verification Failed";
      default:
        return "Unknown Status";
    }
  }
  
  if (!isLoggedIn) {
    return null;
  }
  
  return (
    <div className="container py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">RN License Verification</h1>
        
        <Alert className="mb-6">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Verification Required</AlertTitle>
          <AlertDescription>
            To purchase tickets for Nursing Rocks! concerts, you need to verify your nursing license. 
            This is a one-time process that ensures our events remain exclusive to healthcare professionals.
          </AlertDescription>
        </Alert>
        
        {isLoading ? (
          <p>Loading your license information...</p>
        ) : error ? (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was an error loading your license information. Please try again later.
            </AlertDescription>
          </Alert>
        ) : licenses && licenses.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Your Nursing Licenses</h2>
            
            <div className="grid gap-4">
              {licenses.map((license: any) => (
                <Card key={license.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-lg">License #{license.license_number}</CardTitle>
                      <CardDescription>State: {license.state}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(license.verification_status)}
                      <span className={`text-sm font-medium ${
                        license.verification_status === "verified" 
                          ? "text-green-500" 
                          : license.verification_status === "pending" 
                            ? "text-amber-500" 
                            : "text-red-500"
                      }`}>
                        {getStatusText(license.verification_status)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Expiration Date</p>
                        <p>{new Date(license.expiration_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Submission Date</p>
                        <p>{new Date(license.created_at).toLocaleDateString()}</p>
                      </div>
                      {license.verification_date && (
                        <div>
                          <p className="text-muted-foreground">Verification Date</p>
                          <p>{new Date(license.verification_date).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                    
                    {license.verification_status === "rejected" && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertTitle>Verification Failed</AlertTitle>
                        <AlertDescription>
                          We could not verify your nursing license. Please check the information and try again, 
                          or contact support for assistance.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {license.verification_status === "pending" && (
                      <Alert className="mt-4">
                        <Clock className="h-5 w-5" />
                        <AlertTitle>Verification in Progress</AlertTitle>
                        <AlertDescription>
                          Your license is being verified. This process typically takes a few minutes.
                          You'll receive a notification once the verification is complete.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {license.verification_status === "verified" && (
                      <Alert className="mt-4 bg-green-50 text-green-800 border-green-200">
                        <BadgeCheck className="h-5 w-5 text-green-500" />
                        <AlertTitle>License Verified</AlertTitle>
                        <AlertDescription>
                          Your nursing license has been successfully verified. You can now purchase tickets
                          for any Nursing Rocks! concerts.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <h2 className="text-xl font-semibold mb-4">Add Another License</h2>
              <LicenseForm onSuccess={handleVerificationSuccess} />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Submit Your Nursing License</h2>
            <p className="text-muted-foreground mb-6">
              Please submit your nursing license information below. Once verified, you'll be able to purchase tickets
              for Nursing Rocks! concerts.
            </p>
            
            <LicenseForm onSuccess={handleVerificationSuccess} />
          </div>
        )}
      </div>
    </div>
  );
}