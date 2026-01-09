import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Briefcase,
  Building2,
  Users,
  CheckCircle,
  Clock,
  Eye,
  Mail,
  LogOut,
  Plus,
  CreditCard,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { Elements, CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

type PurchaseType = "perPost" | "pass" | "lifetime";

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#32325d",
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: "antialiased",
      fontSize: "16px",
      "::placeholder": {
        color: "#aab7c4",
      },
    },
    invalid: {
      color: "#fa755a",
      iconColor: "#fa755a",
    },
  },
};

function EmployerJobPostingPaymentForm(props: {
  purchaseType: PurchaseType;
  quantity: number;
  onSuccess: () => void;
}) {
  const { purchaseType, quantity, onSuccess } = props;
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  const startPayment = async () => {
    try {
      setPaymentError(null);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/employer/job-posting/payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ purchaseType, quantity }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to initialize payment");
      }
      const data = await res.json();
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
    } catch (e: any) {
      setPaymentError(e.message || "Unable to initialize payment");
    }
  };

  const confirmPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements || isProcessing) return;
    if (!clientSecret || !paymentIntentId) return;

    setIsProcessing(true);
    setPaymentError(null);

    // If no Stripe key, simulate (server also supports simulation)
    if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/employer/job-posting/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ paymentIntentId, purchaseType, quantity }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Payment confirmation failed");
        }
        toast({ title: "Payment successful!", description: "Job posting access has been granted." });
        onSuccess();
      } catch (e: any) {
        setPaymentError(e.message || "Payment confirmation failed");
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    const card = elements.getElement(CardElement);
    if (!card) {
      setIsProcessing(false);
      setPaymentError("Card input not ready. Please refresh and try again.");
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });

      if (error) {
        setPaymentError(error.message || "Payment failed");
      } else if (paymentIntent?.status === "succeeded") {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/employer/job-posting/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ paymentIntentId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Payment confirmation failed");
        }

        toast({ title: "Payment successful!", description: "Job posting access has been granted." });
        onSuccess();
      } else {
        setPaymentError("Payment not completed. Please try again.");
      }
    } catch (e: any) {
      setPaymentError(e.message || "Payment error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {!clientSecret ? (
        <Button onClick={startPayment} className="w-full">
          <CreditCard className="h-4 w-4 mr-2" />
          Start payment
        </Button>
      ) : (
        <form onSubmit={confirmPayment} className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium">Card Details</label>
            <div className="p-3 border rounded-md shadow-sm bg-white">
              <CardElement options={CARD_ELEMENT_OPTIONS} />
            </div>
          </div>

          {paymentError && (
            <div className="flex items-center gap-2 p-3 rounded bg-destructive/10 text-destructive text-sm">
              <AlertTriangle className="h-4 w-4" />
              {paymentError}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={!stripe || isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay now
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}

export default function EmployerDashboard() {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [selectedPurchaseType, setSelectedPurchaseType] = useState<PurchaseType>("perPost");
  const [perPostQuantity, setPerPostQuantity] = useState(1);
  
  // Check if employer is logged in
  const employerData = localStorage.getItem("employer");
  const employer = employerData ? JSON.parse(employerData) : null;
  
  if (!employer) {
    navigate("/login");
    return null;
  }
  
  // Fetch employer's job listings
  const { data: jobListings, isLoading: isLoadingJobs } = useQuery({
    queryKey: ["/api/employer/jobs"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await apiRequest("GET", "/api/employer/jobs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch job listings");
      return res.json();
    },
  });
  
  // Fetch contact requests
  const { data: contactRequests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ["/api/employer/contact-requests"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await apiRequest("GET", "/api/employer/contact-requests", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch contact requests");
      return res.json();
    },
  });

  const { data: entitlementsData, isLoading: isLoadingEntitlements } = useQuery({
    queryKey: ["/api/employer/job-posting/entitlements"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await apiRequest("GET", "/api/employer/job-posting/entitlements", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch job posting access");
      return res.json();
    },
  });
  
  // Logout handler
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("employer");
    localStorage.removeItem("loginAsType");
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
    navigate("/");
  }
  
  // Account status badge
  const getAccountStatusBadge = () => {
    if (employer.account_status === "active" && employer.is_verified) {
      return <Badge className="bg-green-500">Verified & Active</Badge>;
    } else if (employer.account_status === "pending") {
      return <Badge variant="secondary">Pending Approval</Badge>;
    } else if (employer.account_status === "suspended") {
      return <Badge variant="destructive">Suspended</Badge>;
    }
    return <Badge>{employer.account_status}</Badge>;
  };
  
  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Employer Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, <span className="font-semibold">{employer.company_name}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {getAccountStatusBadge()}
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
      
      {/* Pending approval message */}
      {employer.account_status === "pending" && (
        <Card className="mb-8 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900 mb-1">Account Pending Approval</h3>
                <p className="text-sm text-orange-800">
                  Your employer account is currently under review by our admin team. You'll be able to post jobs and view applications once your account is approved.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingJobs ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                Array.isArray(jobListings) ? jobListings.filter((j: any) => j.is_active).length : 0
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingJobs ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                Array.isArray(jobListings) ? jobListings.reduce((sum: number, j: any) => sum + (j.applications_count || 0), 0) : 0
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Contact Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingRequests ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                Array.isArray(contactRequests) ? contactRequests.filter((r: any) => r.status === 'pending').length : 0
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingJobs ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                Array.isArray(jobListings) ? jobListings.reduce((sum: number, j: any) => sum + (j.views_count || 0), 0) : 0
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content Tabs */}
      <Tabs defaultValue="jobs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="jobs">My Job Listings</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="contact">Contact Requests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="jobs">
          {/* Job Posting Access / Payment */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Job Posting Access (Beta)</CardTitle>
              <CardDescription>
                Purchase job posting access if you don’t have an active entitlement.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingEntitlements ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Loading access...
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      Credits: {entitlementsData?.entitlements?.credits ?? 0}
                    </Badge>
                    <Badge variant="secondary">
                      Pass: {entitlementsData?.entitlements?.passExpiresAt ? new Date(entitlementsData.entitlements.passExpiresAt).toLocaleDateString() : "none"}
                    </Badge>
                    <Badge variant="secondary">
                      Lifetime: {entitlementsData?.entitlements?.lifetime ? "yes" : "no"}
                    </Badge>
                    <Badge variant={entitlementsData?.entitlements?.canPost ? "default" : "destructive"}>
                      Can post: {entitlementsData?.entitlements?.canPost ? "yes" : "no"}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={selectedPurchaseType === "perPost" ? "default" : "outline"}
                      onClick={() => setSelectedPurchaseType("perPost")}
                      disabled={!entitlementsData?.options?.perPost}
                    >
                      Per-post
                    </Button>
                    <Button
                      type="button"
                      variant={selectedPurchaseType === "pass" ? "default" : "outline"}
                      onClick={() => setSelectedPurchaseType("pass")}
                      disabled={!entitlementsData?.options?.pass}
                    >
                      Pass
                    </Button>
                    <Button
                      type="button"
                      variant={selectedPurchaseType === "lifetime" ? "default" : "outline"}
                      onClick={() => setSelectedPurchaseType("lifetime")}
                      disabled={!entitlementsData?.options?.lifetime}
                    >
                      Lifetime
                    </Button>
                  </div>

                  {selectedPurchaseType === "perPost" && (
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">Quantity:</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPerPostQuantity((q) => Math.max(1, q - 1))}
                      >
                        -
                      </Button>
                      <span className="min-w-6 text-center">{perPostQuantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPerPostQuantity((q) => q + 1)}
                      >
                        +
                      </Button>
                    </div>
                  )}

                  <Elements stripe={stripePromise}>
                    <EmployerJobPostingPaymentForm
                      purchaseType={selectedPurchaseType}
                      quantity={selectedPurchaseType === "perPost" ? perPostQuantity : 1}
                      onSuccess={async () => {
                        await queryClient.refetchQueries({ queryKey: ["/api/employer/job-posting/entitlements"] });
                        toast({
                          title: "Access updated",
                          description: "Your job posting access has been refreshed.",
                        });
                      }}
                    />
                  </Elements>

                  {!entitlementsData?.options?.perPost &&
                    !entitlementsData?.options?.pass &&
                    !entitlementsData?.options?.lifetime && (
                      <p className="text-sm text-muted-foreground">
                        Your admin has not enabled any payment options for this employer yet.
                      </p>
                    )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Job Listings</CardTitle>
                  <CardDescription>Manage your active and inactive job postings</CardDescription>
                </div>
                <Button disabled={employer.account_status !== 'active' || !entitlementsData?.entitlements?.canPost}>
                  <Plus className="h-4 w-4 mr-2" />
                  Post New Job
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingJobs ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : Array.isArray(jobListings) && jobListings.length > 0 ? (
                <div className="space-y-4">
                  {jobListings.map((job: any) => (
                    <Card key={job.id} className="border">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{job.title}</h3>
                              {job.is_featured && (
                                <Badge variant="secondary">Featured</Badge>
                              )}
                              <Badge variant={job.is_active ? "default" : "secondary"}>
                                {job.is_active ? "Active" : "Inactive"}
                              </Badge>
                              {job.is_approved ? (
                                <Badge className="bg-green-500">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approved
                                </Badge>
                              ) : (
                                <Badge variant="outline">Pending Approval</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">
                              {job.location} • {job.job_type} • {job.specialty}
                            </div>
                            <div className="flex gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                {job.views_count || 0} views
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {job.applications_count || 0} applications
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            View Applications
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No job listings yet</p>
                  <p className="text-sm">
                    {employer.account_status === 'active' 
                      ? "Create your first job listing to start receiving applications"
                      : "Once your account is approved, you can post job listings"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>All Applications</CardTitle>
              <CardDescription>View anonymized applications across all your job listings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Applications view will be implemented in the next phase</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Contact Requests</CardTitle>
              <CardDescription>Track your requests for applicant contact information</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRequests ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : Array.isArray(contactRequests) && contactRequests.length > 0 ? (
                <div className="space-y-4">
                  {contactRequests.map((request: any) => (
                    <Card key={request.id} className="border">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold mb-1">
                              Application #{request.application_id}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              Job: {request.job?.title || "N/A"}
                            </p>
                            <div className="text-xs text-muted-foreground">
                              Requested: {new Date(request.requested_at).toLocaleDateString()}
                            </div>
                          </div>
                          <Badge variant={
                            request.status === 'approved' ? 'default' :
                            request.status === 'denied' ? 'destructive' :
                            'secondary'
                          }>
                            {request.status}
                          </Badge>
                        </div>
                        {request.status === 'approved' && request.applicant && (
                          <div className="mt-4 p-4 bg-muted rounded-md">
                            <h4 className="font-semibold text-sm mb-2">Contact Information</h4>
                            <div className="text-sm space-y-1">
                              <p><strong>Name:</strong> {request.applicant.first_name} {request.applicant.last_name}</p>
                              <p><strong>Email:</strong> {request.applicant.email}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No contact requests yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

