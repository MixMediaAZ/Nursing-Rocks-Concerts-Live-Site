import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  Pencil,
  Trash2,
  FileText,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { Elements, CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Helmet } from "react-helmet";

// Schema for posting/editing a job
const jobFormSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  location: z.string().min(2, "Location is required"),
  job_type: z.string().min(1, "Job type is required"),
  work_arrangement: z.string().min(1, "Work arrangement is required"),
  specialty: z.string().min(1, "Specialty is required"),
  experience_level: z.string().min(1, "Experience level is required"),
  responsibilities: z.string().optional(),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  salary_min: z.string().optional(),
  salary_max: z.string().optional(),
  salary_period: z.string().optional(),
  application_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  contact_email: z.string().email("Must be a valid email").optional().or(z.literal("")),
});
type JobFormValues = z.infer<typeof jobFormSchema>;

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Per Diem", "Travel"];
const WORK_ARRANGEMENTS = ["On-site", "Remote", "Hybrid"];
const EXPERIENCE_LEVELS = ["Entry", "Mid", "Senior"];
const SPECIALTIES = [
  "ICU", "ER/Trauma", "OR", "PACU", "Labor & Delivery", "NICU", "Pediatrics",
  "Med-Surg", "Oncology", "Cardiac", "Neurology", "Psych", "Home Health",
  "Long-Term Care", "Telemetry", "Float Pool", "Other",
];

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
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: e.message || "Unable to initialize payment. This feature may not be available yet.",
      });
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
        toast({
          variant: "destructive",
          title: "Payment Failed",
          description: e.message || "Payment confirmation failed",
        });
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
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: e.message || "Payment error occurred",
      });
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

  // Job management modal state
  const [postJobOpen, setPostJobOpen] = useState(false);
  const [editJobTarget, setEditJobTarget] = useState<any | null>(null);
  const [viewAppsJobId, setViewAppsJobId] = useState<number | null>(null);

  // Job form
  const jobForm = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: "", description: "", location: "", job_type: "", work_arrangement: "",
      specialty: "", experience_level: "", responsibilities: "", requirements: "",
      benefits: "", salary_min: "", salary_max: "", salary_period: "annual",
      application_url: "", contact_email: "",
    },
  });
  
  // Fetch employer profile
  const { data: employer, isLoading: isLoadingEmployer, error: employerError } = useQuery({
    queryKey: ["/api/employer/me"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await apiRequest("GET", "/api/employer/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 404) {
        return null;
      }
      if (!res.ok) {
        throw new Error("Failed to fetch employer profile");
      }
      const data = await res.json();
      // cache in localStorage for legacy flows
      localStorage.setItem("employer", JSON.stringify(data));
      return data;
    },
    retry: false,
  });

  if (isLoadingEmployer) {
    return <div className="p-4">Loading employer profile...</div>;
  }

  if (!employer) {
    navigate("/login");
    return null;
  }
  
  // Fetch employer's job listings with error handling
  const { data: jobListings, isLoading: isLoadingJobs, error: jobsError } = useQuery({
    queryKey: ["/api/employer/jobs"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await apiRequest("GET", "/api/employer/jobs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error("Failed to fetch job listings");
      }
      return res.json();
    },
    retry: false,
  });
  
  // Fetch contact requests with error handling
  const { data: contactRequests, isLoading: isLoadingRequests, error: requestsError } = useQuery({
    queryKey: ["/api/employer/contact-requests"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await apiRequest("GET", "/api/employer/contact-requests", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        if (res.status === 404) {
          // Endpoint doesn't exist yet
          return [];
        }
        throw new Error("Failed to fetch contact requests");
      }
      return res.json();
    },
    retry: false,
  });

  // Fetch entitlements with error handling
  const { data: entitlementsData, isLoading: isLoadingEntitlements, error: entitlementsError } = useQuery({
    queryKey: ["/api/employer/job-posting/entitlements"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await apiRequest("GET", "/api/employer/job-posting/entitlements", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        if (res.status === 404) {
          // Endpoint doesn't exist yet - return default structure
          return {
            entitlements: {
              credits: 0,
              passExpiresAt: null,
              lifetime: false,
              canPost: false,
            },
            options: {
              perPost: false,
              pass: false,
              lifetime: false,
            },
          };
        }
        throw new Error("Failed to fetch job posting access");
      }
      return res.json();
    },
    retry: false,
  });
  
  // Fetch all applications for employer
  const { data: allApplications, isLoading: isLoadingApplications } = useQuery({
    queryKey: ["/api/employer/applications"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await apiRequest("GET", "/api/employer/applications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    retry: false,
  });

  // Fetch applications for a specific job (for the per-job modal)
  const { data: jobApplicationsData, isLoading: isLoadingJobApps } = useQuery({
    queryKey: ["/api/employer/jobs", viewAppsJobId, "applications"],
    queryFn: async () => {
      if (!viewAppsJobId) return [];
      const token = localStorage.getItem("token");
      const res = await apiRequest("GET", `/api/employer/jobs/${viewAppsJobId}/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: viewAppsJobId != null,
    retry: false,
  });

  // Post new job mutation
  const postJobMutation = useMutation({
    mutationFn: async (data: JobFormValues) => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to post job");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employer/jobs"] });
      setPostJobOpen(false);
      jobForm.reset();
      toast({ title: "Job posted", description: "Your listing is pending admin approval." });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  // Edit job mutation
  const editJobMutation = useMutation({
    mutationFn: async (data: JobFormValues) => {
      if (!editJobTarget) return;
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/employer/jobs/${editJobTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update job");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employer/jobs"] });
      setEditJobTarget(null);
      jobForm.reset();
      toast({ title: "Job updated", description: "Your changes are pending re-approval." });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  // Deactivate job mutation
  const deactivateJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/employer/jobs/${jobId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || "Failed to deactivate job");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employer/jobs"] });
      toast({ title: "Job deactivated", description: "The listing has been deactivated." });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  function openEditJob(job: any) {
    jobForm.reset({
      title: job.title || "",
      description: job.description || "",
      location: job.location || "",
      job_type: job.job_type || "",
      work_arrangement: job.work_arrangement || "",
      specialty: job.specialty || "",
      experience_level: job.experience_level || "",
      responsibilities: job.responsibilities || "",
      requirements: job.requirements || "",
      benefits: job.benefits || "",
      salary_min: job.salary_min ? String(job.salary_min) : "",
      salary_max: job.salary_max ? String(job.salary_max) : "",
      salary_period: job.salary_period || "annual",
      application_url: job.application_url || "",
      contact_email: job.contact_email || "",
    });
    setEditJobTarget(job);
  }

  function onJobFormSubmit(data: JobFormValues) {
    if (editJobTarget) {
      editJobMutation.mutate(data);
    } else {
      postJobMutation.mutate(data);
    }
  }

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
    <>
      <Helmet>
        <title>Employer Dashboard - Nursing Rocks! Concert Series</title>
        <meta name="description" content="Employer dashboard for managing job postings and applications" />
      </Helmet>
      
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
                  Purchase job posting access if you don't have an active entitlement.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingEntitlements ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Loading access...
                  </div>
                ) : entitlementsError ? (
                  <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                    <p>Job posting access features are coming soon. Please contact support for more information.</p>
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

                    {entitlementsData?.options && (
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
                    )}

                    {!entitlementsData?.options?.perPost &&
                      !entitlementsData?.options?.pass &&
                      !entitlementsData?.options?.lifetime && (
                        <p className="text-sm text-muted-foreground">
                          Job posting payment features are not yet available. Please contact support for access.
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
                  <Button
                    disabled={employer.account_status !== 'active' || !entitlementsData?.entitlements?.canPost}
                    onClick={() => {
                      jobForm.reset();
                      setEditJobTarget(null);
                      setPostJobOpen(true);
                    }}
                  >
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
                ) : jobsError ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-2">Unable to load job listings</p>
                    <p className="text-sm">Please refresh the page or try again later</p>
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
                            <div className="flex gap-2 flex-wrap">
                              <Button variant="outline" size="sm" onClick={() => setViewAppsJobId(job.id)}>
                                <FileText className="h-3 w-3 mr-1" />
                                Applications ({job.applications_count || 0})
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => openEditJob(job)}>
                                <Pencil className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                disabled={deactivateJobMutation.isPending}
                                onClick={() => {
                                  if (confirm("Deactivate this job listing?")) deactivateJobMutation.mutate(job.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Deactivate
                              </Button>
                            </div>
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
                <CardDescription>Anonymized applications across all your job listings</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingApplications ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : Array.isArray(allApplications) && allApplications.length > 0 ? (
                  <div className="space-y-3">
                    {allApplications.map((app: any) => (
                      <Card key={app.id} className="border">
                        <CardContent className="pt-4 pb-4">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{app.job_title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Application #{app.id} · {new Date(app.application_date).toLocaleDateString()}
                              </p>
                              {app.cover_letter && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{app.cover_letter}</p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                              <Badge variant={
                                app.status === "hired" ? "default" :
                                app.status === "rejected" ? "destructive" :
                                app.is_withdrawn ? "secondary" : "outline"
                              }>
                                {app.is_withdrawn ? "Withdrawn" : app.status}
                              </Badge>
                              {app.resume_url && (
                                <a
                                  href={app.resume_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  View Resume
                                </a>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No applications yet</p>
                    <p className="text-sm mt-1">Applications to your job listings will appear here</p>
                  </div>
                )}
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
                ) : requestsError ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Contact requests feature is coming soon</p>
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

      {/* Post / Edit Job Dialog */}
      <Dialog
        open={postJobOpen || editJobTarget != null}
        onOpenChange={(open) => {
          if (!open) { setPostJobOpen(false); setEditJobTarget(null); jobForm.reset(); }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editJobTarget ? "Edit Job Listing" : "Post New Job"}</DialogTitle>
            <DialogDescription>
              {editJobTarget
                ? "Update the job listing. Edited listings require re-approval."
                : "Fill in the details for your new job listing. It will be reviewed before going live."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={jobForm.handleSubmit(onJobFormSubmit)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="jf-title">Job Title *</Label>
              <Input id="jf-title" placeholder="e.g. ICU Registered Nurse" {...jobForm.register("title")} />
              {jobForm.formState.errors.title && (
                <p className="text-xs text-destructive">{jobForm.formState.errors.title.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Job Type *</Label>
                <Select
                  value={jobForm.watch("job_type")}
                  onValueChange={v => jobForm.setValue("job_type", v, { shouldValidate: true })}
                >
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{JOB_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
                {jobForm.formState.errors.job_type && (
                  <p className="text-xs text-destructive">{jobForm.formState.errors.job_type.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Work Arrangement *</Label>
                <Select
                  value={jobForm.watch("work_arrangement")}
                  onValueChange={v => jobForm.setValue("work_arrangement", v, { shouldValidate: true })}
                >
                  <SelectTrigger><SelectValue placeholder="Select arrangement" /></SelectTrigger>
                  <SelectContent>{WORK_ARRANGEMENTS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
                {jobForm.formState.errors.work_arrangement && (
                  <p className="text-xs text-destructive">{jobForm.formState.errors.work_arrangement.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Specialty *</Label>
                <Select
                  value={jobForm.watch("specialty")}
                  onValueChange={v => jobForm.setValue("specialty", v, { shouldValidate: true })}
                >
                  <SelectTrigger><SelectValue placeholder="Select specialty" /></SelectTrigger>
                  <SelectContent>{SPECIALTIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
                {jobForm.formState.errors.specialty && (
                  <p className="text-xs text-destructive">{jobForm.formState.errors.specialty.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Experience Level *</Label>
                <Select
                  value={jobForm.watch("experience_level")}
                  onValueChange={v => jobForm.setValue("experience_level", v, { shouldValidate: true })}
                >
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>{EXPERIENCE_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
                {jobForm.formState.errors.experience_level && (
                  <p className="text-xs text-destructive">{jobForm.formState.errors.experience_level.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="jf-location">Location *</Label>
              <Input id="jf-location" placeholder="e.g. Phoenix, AZ" {...jobForm.register("location")} />
              {jobForm.formState.errors.location && (
                <p className="text-xs text-destructive">{jobForm.formState.errors.location.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="jf-description">Description *</Label>
              <Textarea id="jf-description" rows={4} placeholder="Describe the role..." {...jobForm.register("description")} />
              {jobForm.formState.errors.description && (
                <p className="text-xs text-destructive">{jobForm.formState.errors.description.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="jf-responsibilities">Responsibilities</Label>
              <Textarea id="jf-responsibilities" rows={3} placeholder="Key responsibilities..." {...jobForm.register("responsibilities")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="jf-requirements">Requirements</Label>
              <Textarea id="jf-requirements" rows={3} placeholder="Required qualifications..." {...jobForm.register("requirements")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="jf-benefits">Benefits</Label>
              <Textarea id="jf-benefits" rows={2} placeholder="Benefits offered..." {...jobForm.register("benefits")} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="jf-salmin">Salary Min</Label>
                <Input id="jf-salmin" type="number" placeholder="65000" {...jobForm.register("salary_min")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="jf-salmax">Salary Max</Label>
                <Input id="jf-salmax" type="number" placeholder="95000" {...jobForm.register("salary_max")} />
              </div>
              <div className="space-y-1.5">
                <Label>Period</Label>
                <Select
                  value={jobForm.watch("salary_period") || "annual"}
                  onValueChange={v => jobForm.setValue("salary_period", v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="jf-appurl">Application URL</Label>
              <Input id="jf-appurl" type="url" placeholder="https://..." {...jobForm.register("application_url")} />
              {jobForm.formState.errors.application_url && (
                <p className="text-xs text-destructive">{jobForm.formState.errors.application_url.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="jf-email">Contact Email</Label>
              <Input id="jf-email" type="email" placeholder="hr@hospital.com" {...jobForm.register("contact_email")} />
              {jobForm.formState.errors.contact_email && (
                <p className="text-xs text-destructive">{jobForm.formState.errors.contact_email.message}</p>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => { setPostJobOpen(false); setEditJobTarget(null); jobForm.reset(); }}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={postJobMutation.isPending || editJobMutation.isPending}
              >
                {(postJobMutation.isPending || editJobMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editJobTarget ? "Save Changes" : "Submit Listing"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Applications for a Job Dialog */}
      <Dialog open={viewAppsJobId != null} onOpenChange={(open) => { if (!open) setViewAppsJobId(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Applications</DialogTitle>
            <DialogDescription>
              {viewAppsJobId && Array.isArray(jobListings) &&
                (jobListings.find((j: any) => j.id === viewAppsJobId)?.title || `Job #${viewAppsJobId}`)}
            </DialogDescription>
          </DialogHeader>

          {isLoadingJobApps ? (
            <div className="space-y-3 mt-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : Array.isArray(jobApplicationsData) && jobApplicationsData.length > 0 ? (
            <div className="space-y-3 mt-2">
              {jobApplicationsData.map((app: any) => (
                <Card key={app.id} className="border">
                  <CardContent className="pt-3 pb-3">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Application #{app.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(app.application_date).toLocaleDateString()}
                        </p>
                        {app.cover_letter && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{app.cover_letter}</p>
                        )}
                        {app.resume_url && (
                          <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                            View Resume
                          </a>
                        )}
                      </div>
                      <Badge variant={
                        app.status === "hired" ? "default" :
                        app.status === "rejected" ? "destructive" :
                        app.is_withdrawn ? "secondary" : "outline"
                      }>
                        {app.is_withdrawn ? "Withdrawn" : app.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground mt-2">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No applications yet for this listing</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
