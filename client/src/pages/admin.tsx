import { useState, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { clearToken, isTokenExpired } from "@/lib/token-utils";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { 
  Key, 
  KeyRound, 
  Delete,
  LayoutDashboard, 
  Settings, 
  Calendar, 
  ImageIcon, 
  Music, 
  Users, 
  Store, 
  FileEdit, 
  Lock,
  Edit,
  LogOut,
  Shield,
  Download,
  Video,
  Mail,
  Briefcase,
  CheckCircle,
  XCircle,
  Building2,
  FileCheck,
  Ticket,
  Search,
  RefreshCw,
  UserCheck
} from "lucide-react";
import CustomCatApiSettings from "@/components/admin/custom-cat-api-settings";
import ProductSyncTool from "@/components/admin/product-sync-tool";
import { NewsletterContacts } from "@/components/admin/newsletter-contacts";
import VideoSubmissions from "@/components/admin/video-submissions";
import VideoApproval from "@/components/admin/video-approval";
import { LicenseManagement } from "@/components/admin/license-management";
import { AdminCreateEmployer } from "@/components/admin/admin-create-employer";
import { AdminCreateJob } from "@/components/admin/admin-create-job";
import { JobsTable } from "@/components/admin/jobs-table";
import { IngestionStatusCard } from "@/components/admin/ingestion-status-card";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [selectedEmployer, setSelectedEmployer] = useState<any>(null);
  const [showEmployerDialog, setShowEmployerDialog] = useState(false);
  const [employerJobPostOptions, setEmployerJobPostOptions] = useState({
    perPost: false,
    pass: false,
    lifetime: false,
  });
  const [jobPostSettings, setJobPostSettings] = useState({
    JOB_POST_PRICE_PER_POST_CENTS: "",
    JOB_POST_PRICE_PASS_CENTS: "",
    JOB_POST_PASS_DURATION_DAYS: "",
    JOB_POST_PRICE_LIFETIME_CENTS: "",
  });
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [addEventForm, setAddEventForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    date: "",
    start_time: "",
    doors_time: "",
    location: "",
    artist_id: "",
    image_url: "",
    price: "",
    genre: "",
    tickets_url: "",
    is_featured: false,
    has_presale_tickets: false,
    tickets_at_door_only: false,
  });
  const [editorSettings, setEditorSettings] = useState({
    highlightOnHover: true,
    showControlPanel: true,
    directImageReplacement: true,
    confirmBeforeSaving: true,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Shared admin fetch — single place to handle 401/403 so individual
  // queries don't each call setAuthenticated(false) and race each other.
  const adminFetch = useCallback(async (url: string) => {
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
    if (!token) {
      setAuthenticated(false);
      throw new Error('Not authenticated');
    }
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.status === 401 || res.status === 403) {
      setAuthenticated(false);
      throw new Error('Admin privileges required');
    }
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  }, []);

  // Fetch real data from API with automatic refetching
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['/api/events'],
    enabled: authenticated && !loading,
    staleTime: 0, // Always consider data stale to ensure fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/store/products'],
    enabled: authenticated && !loading,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Fetch pending ticket email approvals
  const { data: pendingApprovalsData, isLoading: pendingApprovalsLoading, refetch: refetchPendingApprovals } = useQuery({
    queryKey: ['/api/admin/tickets/pending-approvals'],
    enabled: authenticated && !loading,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: (_count: number, error: any) => !error?.message?.includes('Admin privileges') && _count < 2,
    queryFn: () => adminFetch('/api/admin/tickets/pending-approvals'),
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: authenticated && !loading,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: (_count: number, error: any) => !error?.message?.includes('Admin privileges') && _count < 2,
    queryFn: async () => {
      const data = await adminFetch('/api/admin/users');
      return Array.isArray(data) ? data : (data?.users ?? []);
    },
  });

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/admin/jobs'],
    enabled: authenticated && !loading,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: (_count: number, error: any) => !error?.message?.includes('Admin privileges') && _count < 2,
    queryFn: () => adminFetch('/api/admin/jobs'),
  });

  const { data: employersData, isLoading: employersLoading } = useQuery({
    queryKey: ['/api/admin/employers'],
    enabled: authenticated && !loading,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: (_count: number, error: any) => !error?.message?.includes('Admin privileges') && _count < 2,
    queryFn: () => adminFetch('/api/admin/employers'),
  });

  // Global app settings (admin-only via JWT)
  const { data: appSettingsData, isLoading: appSettingsLoading } = useQuery({
    queryKey: ['/api/settings'],
    enabled: authenticated && !loading,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: (_count: number, error: any) => !error?.message?.includes('Admin privileges') && _count < 2,
    queryFn: () => adminFetch('/api/settings'),
  });

  useEffect(() => {
    if (!Array.isArray(appSettingsData)) return;

    const getSettingValue = (key: string) => {
      const row = appSettingsData.find((s: any) => s?.key === key);
      return typeof row?.value === "string" ? row.value : "";
    };

    setJobPostSettings({
      JOB_POST_PRICE_PER_POST_CENTS: getSettingValue("JOB_POST_PRICE_PER_POST_CENTS"),
      JOB_POST_PRICE_PASS_CENTS: getSettingValue("JOB_POST_PRICE_PASS_CENTS"),
      JOB_POST_PASS_DURATION_DAYS: getSettingValue("JOB_POST_PASS_DURATION_DAYS"),
      JOB_POST_PRICE_LIFETIME_CENTS: getSettingValue("JOB_POST_PRICE_LIFETIME_CENTS"),
    });
  }, [appSettingsData]);

  const saveJobPostSettingsMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const keys = Object.keys(jobPostSettings) as Array<keyof typeof jobPostSettings>;

      for (const key of keys) {
        const value = jobPostSettings[key];
        const response = await fetch('/api/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            key,
            value,
            description: "Employer job posting pricing (managed via Admin Dashboard)",
            is_sensitive: false,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || `Failed to save setting ${key}`);
        }
      }
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Saved",
        description: "Job posting pricing settings have been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!selectedEmployer) return;
    const opts = selectedEmployer.job_post_options || {};
    setEmployerJobPostOptions({
      perPost: !!opts.perPost,
      pass: !!opts.pass,
      lifetime: !!opts.lifetime,
    });
  }, [selectedEmployer]);

  const updateEmployerJobPostOptionsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEmployer?.id) throw new Error("No employer selected");
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/employers/${selectedEmployer.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          job_post_options: employerJobPostOptions,
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update employer");
      }
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['/api/admin/employers'] });
      toast({
        title: "Saved",
        description: "Employer job posting options updated.",
      });
      setShowEmployerDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: verificationTicketEmailMeta } = useQuery({
    queryKey: ["/api/admin/verification-ticket-email-info"],
    queryFn: () => adminFetch("/api/admin/verification-ticket-email-info"),
    enabled: authenticated && !loading && showUserDialog,
  });

  const { data: selectedUserTickets } = useQuery({
    queryKey: ["/api/admin/users", selectedUser?.id, "tickets"],
    queryFn: () => adminFetch(`/api/admin/users/${selectedUser!.id}/tickets`),
    enabled: authenticated && !loading && showUserDialog && !!selectedUser?.id,
  });

  // Verify user mutation (NEW - for ticketing system)
  const verifyUserMutation = useMutation({
    mutationFn: async ({ userId, verified }: { userId: number; verified: boolean }) => {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/users/${userId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ verified }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to verify user');
      }
      return response.json();
    },
    onSuccess: async (result) => {
      await queryClient.refetchQueries({ queryKey: ['/api/admin/users'] });
      await queryClient.refetchQueries({ queryKey: ['/api/admin/users', result.userId, 'tickets'] });
      if (selectedUser && selectedUser.id === result.userId) {
        setSelectedUser({ ...selectedUser, is_verified: result.isVerified, verified_at: result.verifiedAt });
      }
      const vo = result.verifyOutcome as {
        action?: string;
        message?: string;
        details?: {
          claimOnDashboard?: boolean;
          welcomeEmailMode?: "resend" | "dev_log" | null;
          welcomeEmailError?: string;
          ticketsCreated?: number;
          ticketsSkippedExisting?: number;
          ticketsFailed?: number;
          emailsFailed?: number;
          emailsDelivered?: number;
          emailsSimulated?: number;
          hasErrors?: boolean;
          ticketsRevoked?: number;
        };
      } | null;
      if (!vo?.action) {
        toast({ title: "Saved", description: "Verification status updated." });
        return;
      }
      if (vo.action === "already_verified") {
        toast({ title: "Already verified", description: vo.message || "No new tickets or emails." });
        return;
      }
      if (vo.action === "already_unverified") {
        toast({ title: "Already unverified", description: vo.message || "" });
        return;
      }
      if (vo.action === "verified" && vo.details) {
        const d = vo.details;
        if (d.claimOnDashboard) {
          const welcomeOk = !d.welcomeEmailError;
          const welcomeBit =
            d.welcomeEmailMode === "resend"
              ? "Welcome email sent (Resend)."
              : d.welcomeEmailMode === "dev_log"
                ? "Welcome email logged to server only (not delivered — set RESEND_API_KEY)."
                : "";
          toast({
            title: welcomeOk ? "User verified" : "User verified (welcome email failed)",
            description: [vo.message, welcomeBit].filter(Boolean).join(" "),
            variant: welcomeOk ? "default" : "destructive",
          });
          return;
        }
        const bits: string[] = [];
        bits.push(`${d.ticketsCreated ?? 0} ticket(s) created`);
        if ((d.ticketsSkippedExisting ?? 0) > 0) {
          bits.push(`${d.ticketsSkippedExisting} already had a ticket (no duplicate email)`);
        }
        if ((d.emailsDelivered ?? 0) > 0) {
          bits.push(`${d.emailsDelivered} emailed via Resend`);
        }
        if ((d.emailsSimulated ?? 0) > 0) {
          bits.push(`${d.emailsSimulated} log-only (not delivered — set RESEND_API_KEY to send)`);
        }
        if ((d.emailsFailed ?? 0) > 0) {
          bits.push(`${d.emailsFailed} email(s) failed`);
        }
        if ((d.ticketsFailed ?? 0) > 0) {
          bits.push(`${d.ticketsFailed} ticket(s) failed to create`);
        }
        toast({
          title: d.hasErrors ? "Verified (see issues)" : "User verified",
          description: bits.join(" · "),
          variant: d.hasErrors ? "destructive" : "default",
        });
        return;
      }
      if (vo.action === "unverified" && vo.details) {
        toast({
          title: "User unverified",
          description: `${vo.details.ticketsRevoked ?? 0} active ticket(s) revoked.`,
        });
        return;
      }
      toast({ title: "Verification updated", description: vo.message || "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resendTicketEmailMutation = useMutation({
    mutationFn: async ({ ticketId, userId }: { ticketId: string; userId: number }) => {
      const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
      const response = await fetch(`/api/admin/tickets/${ticketId}/resend-email`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await response.json().catch(() => ({}))) as { message?: string; success?: boolean };
      if (!response.ok) {
        throw new Error(json.message || "Failed to resend ticket email");
      }
      return { ...json, userId };
    },
    onSuccess: async (data) => {
      await queryClient.refetchQueries({ queryKey: ["/api/admin/users", data.userId, "tickets"] });
      toast({
        title: "Ticket email sent",
        description: data.message || "Ticket email resent successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Resend failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update user mutation (for other fields like is_admin, is_suspended)
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: number; updates: { is_admin?: boolean; is_suspended?: boolean } }) => {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user');
      }
      return response.json();
    },
    onSuccess: async (updated) => {
      await queryClient.refetchQueries({ queryKey: ['/api/admin/users'] });
      if (selectedUser && updated && (updated as any).id === selectedUser.id) {
        setSelectedUser({ ...selectedUser, ...(updated as any) });
      }
      toast({
        title: "User Updated",
        description: "User information has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete user');
      }
      return response.json();
    },
    onSuccess: async () => {
      // Immediately refetch users data to update dashboard
      await queryClient.refetchQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User Deleted",
        description: "User has been permanently deleted.",
      });
      setShowUserDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
      // Don't close dialog on error so user can see what went wrong
    },
  });

  // FIX: Approve and send ticket email mutation
  const approveTicketEmailMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/tickets/${ticketId}/approve-and-send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to approve and send email');
      }
      return response.json();
    },
    onSuccess: async () => {
      // Refetch pending approvals to update dashboard
      await refetchPendingApprovals();
      toast({
        title: "Email Sent",
        description: "Ticket confirmation email has been approved and sent.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addEventMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...addEventForm,
          artist_id: parseInt(addEventForm.artist_id),
          date: new Date(addEventForm.date).toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create event');
      }
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Event Created",
        description: "New event has been added successfully.",
      });
      setShowAddEventDialog(false);
      setAddEventForm({
        title: "",
        subtitle: "",
        description: "",
        date: "",
        start_time: "",
        doors_time: "",
        location: "",
        artist_id: "",
        image_url: "",
        price: "",
        genre: "",
        tickets_url: "",
        is_featured: false,
        has_presale_tickets: false,
        tickets_at_door_only: false,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check database-based admin authentication
  useEffect(() => {
    const checkAdminAuth = () => {
      try {
        // Get user data from localStorage
        const token = localStorage.getItem("token");
        const userDataStr = localStorage.getItem("user");
        const isAdmin = localStorage.getItem("isAdmin") === "true";

        console.log('[Admin Auth] Check - token:', !!token, 'user:', !!userDataStr, 'isAdmin:', isAdmin);
        
        if (!token || !userDataStr) {
          // No authentication found, wait a moment before showing error (in case auth is processing)
          setLoading(false);
          setTimeout(() => {
            setAuthenticated(false);
            console.log('[Admin Auth] No token or user data, redirecting to login');
          toast({
            variant: "destructive",
            title: "Authentication Required",
            description: "Please login with an admin account to access this page.",
          });
          setTimeout(() => {
            window.location.href = "/login?redirect=/admin";
          }, 1500);
          }, 500);
          return;
        }
        
        // Parse user data
        const userData = JSON.parse(userDataStr);
        
        // Check if user is an admin (verify both storage flag and user data)
        const hasAdminAccess = isAdmin && userData.is_admin === true;
        console.log('[Admin Auth] Admin check - isAdmin:', isAdmin, 'userData.is_admin:', userData.is_admin, 'hasAccess:', hasAdminAccess);

        if (!hasAdminAccess) {
          // User is not an admin, wait a moment before redirecting (in case auth is processing)
          setLoading(false);
          setTimeout(() => {
            setAuthenticated(false);
            console.log('[Admin Auth] User not admin, redirecting to dashboard');
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You do not have admin privileges.",
          });
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 1500);
          }, 500);
          return;
        }
        
        // User is authenticated as admin
        setUserEmail(userData.email);
        setAuthenticated(true);
        setLoading(false);
      } catch (error) {
        console.error("Admin auth check error:", error);
        // Wait before showing error to allow auth to process
        setTimeout(() => {
        setAuthenticated(false);
        setLoading(false);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Please login again.",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
        }, 500);
      }
    };
    
    checkAdminAuth();
  }, [toast]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("adminToken");

      // SAFETY FIX: Call server logout endpoint to blacklist the token
      if (token) {
        try {
          await fetch("/api/auth/logout", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });
        } catch (err) {
          // Server logout failed, but still clear client-side
          console.error("[Logout] Server logout failed:", err);
        }
      }

    // Clear all authentication state
      clearToken();
    localStorage.removeItem("adminPinVerified");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("editMode");
    
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
      variant: "default",
    });
    
    // Redirect to login page
    setTimeout(() => {
      window.location.href = "/login";
      }, 800);
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout Error",
        description: "Failed to log out properly. Please clear your browser data.",
        variant: "destructive",
      });
    }
  };

  // Loading screen while checking authentication
  if (loading) {
    return (
      <>
        <Helmet>
          <title>Admin Dashboard - Loading...</title>
        </Helmet>
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-muted-foreground">Verifying admin access...</p>
        </div>
      </>
    );
  }

  // If not authenticated, show access denied (will redirect)
  if (!authenticated) {
    return (
      <>
        <Helmet>
          <title>Access Denied</title>
        </Helmet>
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <Shield className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </>
    );
  }

  // Admin Dashboard Component
  const AdminDashboard = () => {
    // Check URL params first, then stored tab
    const queryParams = new URLSearchParams(window.location.search);
    const tabParam = queryParams.get("tab");
    const storedTab = localStorage.getItem("adminActiveTab");
    const [activeTab, setActiveTab] = useState(tabParam || storedTab || "overview");
    
    // Persist active tab to localStorage when it changes
    useEffect(() => {
      localStorage.setItem("adminActiveTab", activeTab);
    }, [activeTab]);
    
    // Admin mode is always true for authenticated admins
    const [isAdminMode, setIsAdminMode] = useState(true);
    
    // Effect to handle scrolling to API settings when tab=store is in URL
    useEffect(() => {
      // Check if we should scroll to CustomCat settings
      const queryParams = new URLSearchParams(window.location.search);
      const shouldScrollToApiSettings = activeTab === "store" && queryParams.get("tab") === "store";
      
      if (shouldScrollToApiSettings) {
        // Remove the tab parameter from URL to prevent re-scrolling on refresh
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        // Scroll to API settings after DOM has time to render
        setTimeout(() => {
          const element = document.getElementById('api-settings-anchor');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Highlight the settings wrapper
            const wrapperToHighlight = document.getElementById('store-api-settings-wrapper');
            if (wrapperToHighlight) {
              wrapperToHighlight.classList.add('ring-4', 'ring-primary', 'ring-offset-2', 'transition-all', 'duration-300');
              
              // Create pulsing effect and clean up after 5 pulses
              let pulseCount = 0;
              const pulseInterval = setInterval(() => {
                if (pulseCount >= 5) {
                  clearInterval(pulseInterval);
                  wrapperToHighlight.classList.remove('ring-4', 'ring-primary', 'ring-offset-2', 'transition-all', 'duration-300');
                  return;
                }
                
                if (pulseCount % 2 === 0) {
                  wrapperToHighlight.classList.add('ring-opacity-50', 'scale-[1.01]');
                } else {
                  wrapperToHighlight.classList.remove('ring-opacity-50', 'scale-[1.01]');
                }
                
                pulseCount++;
              }, 400);
            }
          }
        }, 500);
      }
    }, [activeTab]);
    
    // Direct navigation to gallery with admin access
    const openGalleryWithAdminAccess = () => {
      localStorage.setItem("adminPinVerified", "true");
      window.location.href = "/gallery";
    };
    
    // Direct navigation to store settings for CustomCat integration
    const openCustomCatSettings = () => {
      setActiveTab("store");
    };
    
    // Check if element editing mode is active
    const [isEditModeActive, setIsEditModeActive] = useState(
      localStorage.getItem("editMode") === "true"
    );
    
    // Page view selector: dashboard or homepage
    const [editLocation, setEditLocation] = useState<'dashboard' | 'homepage'>(
      (localStorage.getItem("editLocation") as 'dashboard' | 'homepage') || 'dashboard'
    );
    
    // Sync edit mode state when toggled from homepage or other components
    useEffect(() => {
      const checkEditMode = () => {
        const editMode = localStorage.getItem("editMode") === "true";
        setIsEditModeActive(editMode);
      };
      
      // Listen for changes from homepage toggle
      window.addEventListener('admin-mode-changed', checkEditMode);
      window.addEventListener('storage', checkEditMode);
      
      return () => {
        window.removeEventListener('admin-mode-changed', checkEditMode);
        window.removeEventListener('storage', checkEditMode);
      };
    }, []);
    
    // Open live site in admin mode for editing
    const openLiveSiteInAdminMode = (editMode = true) => {
      console.log('[Admin] Opening live site in admin mode:', editMode);
      
      // Ensure all required flags are set
      localStorage.setItem("isAdmin", "true");
      localStorage.setItem("adminPinVerified", "true");
      localStorage.setItem("editMode", editMode ? "true" : "false");
      setIsEditModeActive(editMode);
      
      // Dispatch event to notify other components
      window.dispatchEvent(new Event('admin-mode-changed'));
      
      console.log('[Admin] localStorage flags set:', {
        isAdmin: localStorage.getItem("isAdmin"),
        editMode: localStorage.getItem("editMode"),
        adminPinVerified: localStorage.getItem("adminPinVerified")
      });
      
      if (editMode) {
        // Add a small delay to ensure localStorage is updated before navigation
        setTimeout(() => {
          window.location.href = "/";
        }, 100);
      } else {
        toast({
          title: "Element Edit Mode Disabled",
          description: "Element editing has been turned off",
          variant: "default",
        });
      }
    };

    // Admin mode toggle (no PIN needed for authenticated admins)
    const toggleAdminMode = () => {
      const newMode = !isAdminMode;
      setIsAdminMode(newMode);
      
      if (newMode) {
        localStorage.setItem("editMode", "true");
        toast({
          title: "Edit Mode Enabled",
          description: "You can now edit content on the site.",
        });
      } else {
        localStorage.removeItem("editMode");
        toast({
          title: "Edit Mode Disabled",
          description: "Content editing has been disabled.",
        });
      }
    };
    
    return (
      <div className="flex flex-col">
        {/* Admin Mode Toggle Bar */}
        <div className="w-full mb-6 p-4 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden">
          <div className="flex flex-wrap justify-between items-center gap-y-3">
            <div className="flex items-center flex-shrink-0">
              <Badge variant={isAdminMode ? "default" : "outline"} className="mr-2 py-1.5">
                <Shield className="h-4 w-4 mr-1" /> ADMIN
              </Badge>
              
              <span className="text-sm font-medium mr-3">
                Logged in as: <span className="font-bold">{userEmail}</span>
              </span>
              
              <span className="text-sm font-medium mr-3">
                View: <span className="font-bold">{editLocation === 'homepage' ? 'Homepage' : 'Dashboard'}</span>
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2 bg-white py-1 px-3 rounded-full border flex-shrink-0">
                <Label htmlFor="page-view-toggle" className="text-sm whitespace-nowrap">
                  {editLocation === 'homepage' ? 'Homepage' : 'Dashboard'}
                </Label>
                <Switch
                  id="page-view-toggle"
                  checked={editLocation === 'homepage'}
                  onCheckedChange={(checked) => {
                    const location = checked ? 'homepage' : 'dashboard';
                    setEditLocation(location);
                    localStorage.setItem("editLocation", location);
                    // Navigate to the selected page
                    if (checked) {
                      window.location.href = "/";
                    } else {
                      window.location.href = "/admin";
                    }
                  }}
                />
              </div>
              
              <Button 
                variant="destructive"
                onClick={handleLogout}
                className="flex items-center gap-2 flex-shrink-0 h-9 px-4"
              >
                <LogOut className="h-4 w-4 mr-1" /> Logout
              </Button>
            </div>
          </div>
        </div>
        
        {/* Admin Active Status Alert */}
        {isAdminMode && (
          <Alert className="mb-4 bg-green-50 border-green-300">
            <LayoutDashboard className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-800 font-bold flex items-center gap-3">
              Admin Mode Active
              <TokenCountdown />
            </AlertTitle>
            <AlertDescription className="text-green-700">
              You are currently signed in as an administrator with full editing capabilities.
              All dashboard features are available. Use the toggle above to exit admin mode.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex flex-wrap justify-between items-center gap-y-4 mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-7 w-7" /> Admin Dashboard
          </h1>
          
          {/* Live Editing Toggle - only shown when admin mode is active */}
          {isAdminMode && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2 p-2 rounded-md bg-slate-50 border border-slate-200 min-w-[160px]">
                <Switch
                  id="edit-mode"
                  checked={isEditModeActive}
                  onCheckedChange={(checked) => {
                    openLiveSiteInAdminMode(checked);
                    toast({
                      title: checked ? "Element Edit Mode Enabled" : "Element Edit Mode Disabled",
                      description: checked ? "You can now edit elements on the site" : "Element editing has been turned off",
                      variant: "default",
                    });
                  }}
                />
                <Label htmlFor="edit-mode" className="flex items-center gap-1 text-sm font-medium whitespace-nowrap">
                  <Edit className="h-4 w-4" /> Live Edit Mode
                </Label>
              </div>
              
              <Button 
                variant="default"
                size="sm"
                className="bg-primary"
                onClick={() => openLiveSiteInAdminMode(true)}
              >
                <Edit className="h-4 w-4 mr-1" /> Open Editor
              </Button>
            </div>
          )}
        </div>

        <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2 md:grid-cols-12 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="editor">
              <div className="flex items-center gap-1">
                <Edit className="h-4 w-4" /> Editor
              </div>
            </TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="store">Store</TabsTrigger>
            <TabsTrigger value="jobs">
              <div className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" /> Jobs
              </div>
            </TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="licenses">
              <div className="flex items-center gap-1">
                <FileCheck className="h-4 w-4" /> Licenses
              </div>
            </TabsTrigger>
            <TabsTrigger value="newsletter">
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" /> Newsletter
              </div>
            </TabsTrigger>
            <TabsTrigger value="video-submissions">
              <div className="flex items-center gap-1">
                <Video className="h-4 w-4" /> Submissions
              </div>
            </TabsTrigger>
            <TabsTrigger value="video-approval">
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4" /> Approval
              </div>
            </TabsTrigger>
            <TabsTrigger value="nrpx">
              <div className="flex items-center gap-1">
                <Ticket className="h-4 w-4" /> Phoenix
              </div>
            </TabsTrigger>
            <TabsTrigger value="approvals">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" /> Approvals
              </div>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Element Editing Card */}
              <Card 
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${isEditModeActive ? "bg-primary/5 border-primary/50" : "hover:border-primary"}`}
                onClick={() => {
                  openLiveSiteInAdminMode(true);
                  toast({
                    title: "Opening Live Site",
                    description: "Opening site with editing enabled...",
                    variant: "default",
                  });
                }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5" /> Element Editor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold">{isEditModeActive ? "Enabled" : "Disabled"}</p>
                      <p className="text-sm text-muted-foreground">Visual element editor</p>
                    </div>
                    <Switch
                      checked={isEditModeActive}
                      onCheckedChange={(checked) => {
                        openLiveSiteInAdminMode(checked);
                      }}
                    />
                  </div>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto mt-2" 
                  >
                    Open Editor
                  </Button>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:border-primary transition-all duration-200 hover:shadow-md"
                onClick={() => setActiveTab("events")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" /> Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {eventsLoading ? (
                    <div className="animate-pulse h-8 bg-muted rounded w-16 mb-1"></div>
                  ) : (
                    <p className="text-2xl font-bold">
                      {Array.isArray(eventsData) ? eventsData.length : 0}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">Upcoming events</p>
                  <Button variant="link" className="p-0 h-auto mt-2">
                    Manage Events
                  </Button>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:border-primary transition-all duration-200 hover:shadow-md"
                onClick={() => setActiveTab("store")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" /> Store
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {productsLoading ? (
                    <div className="animate-pulse h-8 bg-muted rounded w-16 mb-1"></div>
                  ) : (
                    <p className="text-2xl font-bold">
                      {Array.isArray(productsData) ? productsData.length : 0}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">Products</p>
                  <Button variant="link" className="p-0 h-auto mt-2">
                    Manage Store
                  </Button>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:border-primary transition-all duration-200 hover:shadow-md"
                onClick={() => setActiveTab("users")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" /> Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="animate-pulse h-8 bg-muted rounded w-16 mb-1"></div>
                  ) : (
                    <p className="text-2xl font-bold">
                      {(Array.isArray(usersData) ? usersData : (usersData?.users ?? [])).length}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">Registered users</p>
                  <Button variant="link" className="p-0 h-auto mt-2">
                    Manage Users
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            {/* Admin Action Cards Section */}
            <div className="mt-6 mb-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="M11 4h10"/><path d="M11 12h10"/><path d="M11 20h10"/></svg>
                Admin Actions
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="hover:shadow-md transition-all duration-200 border-primary/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileEdit className="h-5 w-5 text-primary" /> Edit Website Content
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Start editing website content directly on the live pages
                    </p>
                    <Button 
                      className="w-full bg-primary"
                      onClick={() => {
                        openLiveSiteInAdminMode(true);
                        toast({
                          title: "Edit Mode Activated",
                          description: "Opening live site with editing enabled...",
                          variant: "default",
                        });
                      }}
                    >
                      Open Editor
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-md transition-all duration-200 border-orange-400/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Download className="h-5 w-5 text-orange-500" /> Product Sync Tool
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Sync CustomCat products directly to your store catalog
                    </p>
                    <Button 
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      onClick={() => {
                        window.location.href = "/admin/product-sync";
                        toast({
                          title: "Product Sync Tool",
                          description: "Opening product synchronization tool...",
                          variant: "default",
                        });
                      }}
                    >
                      Open Sync Tool
                    </Button>
                  </CardContent>
                </Card>
              
                <Card className="hover:shadow-md transition-all duration-200 border-primary/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-primary" /> Manage Gallery
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Upload, organize, and manage gallery images
                    </p>
                    <Button
                      onClick={() => {
                        openGalleryWithAdminAccess();
                        toast({
                          title: "Gallery Access",
                          description: "Opening gallery with admin access...",
                          variant: "default",
                        });
                      }}
                      className="w-full"
                    >
                      Manage Gallery
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-md transition-all duration-200 border-primary/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Settings className="h-5 w-5 text-primary" /> CustomCat Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Configure CustomCat API integration for store products
                    </p>
                    <Button
                      onClick={() => {
                        // Go directly to admin page with store tab
                        window.location.href = "/admin?tab=store";
                        
                        toast({
                          title: "CustomCat API",
                          description: "Opening CustomCat API configuration...",
                          variant: "default",
                        });
                      }}
                      className="w-full"
                    >
                      Configure API
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Traffic vs Registrations */}
            <TrafficStatsWidget adminFetch={adminFetch} />
          </TabsContent>

          <TabsContent value="jobs">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Jobs Board Management</h2>
              </div>

              {/* Employer Job Posting Pricing (beta) */}
              <Card>
                <CardHeader>
                  <CardTitle>Employer Job Posting Pricing (Beta)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    These values are used by the Employer Dashboard payment flow. All amounts are stored in cents.
                  </p>

                  {appSettingsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Loading pricing settings...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="JOB_POST_PRICE_PER_POST_CENTS">Per-post price (cents)</Label>
                        <Input
                          id="JOB_POST_PRICE_PER_POST_CENTS"
                          inputMode="numeric"
                          placeholder="e.g. 9900"
                          value={jobPostSettings.JOB_POST_PRICE_PER_POST_CENTS}
                          onChange={(e) =>
                            setJobPostSettings((s) => ({ ...s, JOB_POST_PRICE_PER_POST_CENTS: e.target.value }))
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="JOB_POST_PRICE_PASS_CENTS">Pass price (cents)</Label>
                        <Input
                          id="JOB_POST_PRICE_PASS_CENTS"
                          inputMode="numeric"
                          placeholder="e.g. 29900"
                          value={jobPostSettings.JOB_POST_PRICE_PASS_CENTS}
                          onChange={(e) =>
                            setJobPostSettings((s) => ({ ...s, JOB_POST_PRICE_PASS_CENTS: e.target.value }))
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="JOB_POST_PASS_DURATION_DAYS">Pass duration (days)</Label>
                        <Input
                          id="JOB_POST_PASS_DURATION_DAYS"
                          inputMode="numeric"
                          placeholder="e.g. 30"
                          value={jobPostSettings.JOB_POST_PASS_DURATION_DAYS}
                          onChange={(e) =>
                            setJobPostSettings((s) => ({ ...s, JOB_POST_PASS_DURATION_DAYS: e.target.value }))
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="JOB_POST_PRICE_LIFETIME_CENTS">Lifetime price (cents)</Label>
                        <Input
                          id="JOB_POST_PRICE_LIFETIME_CENTS"
                          inputMode="numeric"
                          placeholder="e.g. 99900"
                          value={jobPostSettings.JOB_POST_PRICE_LIFETIME_CENTS}
                          onChange={(e) =>
                            setJobPostSettings((s) => ({ ...s, JOB_POST_PRICE_LIFETIME_CENTS: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-end">
                    <Button
                      onClick={() => saveJobPostSettingsMutation.mutate()}
                      disabled={saveJobPostSettingsMutation.isPending}
                    >
                      {saveJobPostSettingsMutation.isPending ? "Saving..." : "Save pricing"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Creation Tools */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AdminCreateEmployer />
                <AdminCreateJob />
              </div>

              {/* Jobs Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Jobs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Array.isArray(jobsData) ? jobsData.length : 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {Array.isArray(jobsData) ? jobsData.filter((j: any) => j.is_active).length : 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {Array.isArray(jobsData) ? jobsData.filter((j: any) => !j.is_approved && j.is_active).length : 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Employers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Array.isArray(employersData) ? employersData.length : 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Ingestion Status */}
              <IngestionStatusCard />

              {/* Job Listings Table */}
              <JobsTable employersData={Array.isArray(employersData) ? employersData : []} />

              {/* Employers Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Employers</CardTitle>
                </CardHeader>
                <CardContent>
                  {employersLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : Array.isArray(employersData) && employersData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3">Name</th>
                            <th className="text-left p-3">Contact</th>
                            <th className="text-left p-3">Location</th>
                            <th className="text-left p-3">Verification</th>
                            <th className="text-left p-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {employersData.map((employer: any) => (
                            <tr key={employer.id} className="border-b hover:bg-muted/50">
                              <td className="p-3 font-medium">{employer.company_name || employer.name}</td>
                              <td className="p-3">{employer.contact_email}</td>
                              <td className="p-3">{employer.location || `${employer.city || ""}${employer.state ? `, ${employer.state}` : ""}`}</td>
                              <td className="p-3">
                                {employer.is_verified ? (
                                  <Badge variant="default" className="bg-green-500">
                                    <CheckCircle className="h-3 w-3 mr-1" /> Verified
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">
                                    <XCircle className="h-3 w-3 mr-1" /> Unverified
                                  </Badge>
                                )}
                              </td>
                              <td className="p-3">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedEmployer(employer);
                                    setShowEmployerDialog(true);
                                  }}
                                >
                                  Manage
                                </Button>
                                {!employer.is_verified && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={async () => {
                                      try {
                                        const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
                                        const res = await fetch(`/api/admin/employers/${employer.id}/approve`, {
                                          method: 'PATCH',
                                          headers: {
                                            'Authorization': `Bearer ${token}`,
                                          },
                                        });
                                        if (!res.ok) throw new Error("Server error");
                                        await queryClient.refetchQueries({ queryKey: ['/api/admin/employers'] });
                                        toast({
                                          title: "Employer Verified",
                                          description: "Employer can now post jobs",
                                        });
                                      } catch (error) {
                                        toast({
                                          title: "Error",
                                          description: "Failed to verify employer",
                                          variant: "destructive",
                                        });
                                      }
                                    }}
                                  >
                                    Verify
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No employers registered yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="newsletter">
            <NewsletterContacts />
          </TabsContent>

          <TabsContent value="video-submissions">
            <VideoSubmissions />
          </TabsContent>

          <TabsContent value="video-approval">
            <VideoApproval />
          </TabsContent>

          <TabsContent value="nrpx">
            <NrpxRegistrationsTab />
          </TabsContent>

          {/* FIX: Pending Email Approvals Tab */}
          <TabsContent value="approvals">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" /> Pending Email Approvals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-muted-foreground">
                  Review and approve pending ticket confirmation emails before they are sent to users.
                </p>

                {pendingApprovalsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2 text-muted-foreground">Loading pending approvals...</span>
                  </div>
                ) : (() => {
                  const tickets = pendingApprovalsData?.tickets ?? [];
                  return tickets.length > 0 ? (
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} awaiting email approval
                      </div>
                      <div className="border rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                User
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Event
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ticket Code
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Requested
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {tickets.map((ticket: any) => (
                              <tr key={ticket.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {ticket.user.first_name} {ticket.user.last_name}
                                  </div>
                                  <div className="text-xs text-gray-500">{ticket.user.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{ticket.event.title}</div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(ticket.event.date).toLocaleDateString()}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                    {ticket.ticket_code}
                                  </code>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(ticket.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <Button
                                    onClick={() => {
                                      approveTicketEmailMutation.mutate(ticket.id);
                                    }}
                                    disabled={approveTicketEmailMutation.isPending}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    size="sm"
                                  >
                                    {approveTicketEmailMutation.isPending ? (
                                      <>
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                        Sending...
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Approve & Send
                                      </>
                                    )}
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                      <p className="text-muted-foreground">No pending approvals</p>
                      <p className="text-sm text-muted-foreground mt-1">All ticket emails have been processed</p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="editor">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Editor Status Card */}
              <Card 
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${isEditModeActive ? "bg-primary/5 border-primary/50" : "hover:border-primary"}`}
                onClick={() => {
                  const newState = !isEditModeActive;
                  localStorage.setItem("editMode", newState ? "true" : "false");
                  setIsEditModeActive(newState);
                  toast({
                    title: newState ? "Editor Enabled" : "Editor Disabled",
                    description: newState 
                      ? "Element editor is now active. Click the button below to visit a page with editing." 
                      : "Element editor has been deactivated.",
                    variant: "default",
                  });
                }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5" /> Element Editor Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xl font-bold">{isEditModeActive ? "Active" : "Inactive"}</p>
                      <p className="text-sm text-muted-foreground">Visual element editor state</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="editor-toggle"
                        checked={isEditModeActive}
                        onCheckedChange={(checked) => {
                          localStorage.setItem("editMode", checked ? "true" : "false");
                          setIsEditModeActive(checked);
                          // Dispatch event to sync with homepage and other components
                          window.dispatchEvent(new Event('admin-mode-changed'));
                          toast({
                            title: checked ? "Editor Enabled" : "Editor Disabled",
                            description: checked 
                              ? "Element editor is now active on dashboard and homepage." 
                              : "Element editor has been deactivated.",
                            variant: "default",
                          });
                        }}
                      />
                      <Label htmlFor="editor-toggle">
                        {isEditModeActive ? "Enabled" : "Disabled"}
                      </Label>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Button 
                      className="w-full bg-[#5D3FD3] hover:bg-[#5D3FD3]/90 text-white"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click from firing
                        openLiveSiteInAdminMode(true);
                        toast({
                          title: "Opening Live Site in Edit Mode",
                          description: "The site will open with element editing enabled",
                          variant: "default",
                        });
                      }}
                      disabled={!isEditModeActive}
                    >
                      <FileEdit className="mr-2 h-4 w-4" /> Open Site in Edit Mode
                    </Button>
                    
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                      <h3 className="font-medium text-amber-800 mb-2 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="12"></line>
                          <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        How to Use Element Editor
                      </h3>
                      <ul className="text-sm text-amber-700 space-y-1 list-disc pl-5">
                        <li>Enable the editor using the toggle above</li>
                        <li>Navigate to any page on the site</li>
                        <li>Hover over elements to see edit options</li>
                        <li>Click on elements to select them for editing</li>
                        <li>Use the toolbar to replace images, edit text, and more</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Editor Settings Card */}
              <Card
                className="cursor-pointer hover:border-primary transition-all duration-200 hover:shadow-md"
                onClick={() => {
                  toast({
                    title: "Editor Settings",
                    description: "Configure your editing experience",
                    variant: "default",
                  });
                }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" /> Editor Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-4 cursor-pointer hover:bg-blue-100 transition-colors duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = "/edit-demo";
                      toast({
                        title: "Opening Edit Demo",
                        description: "Redirecting to the element editing demo page...",
                        variant: "default",
                      });
                    }}
                  >
                    <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-1">
                      <Edit className="h-4 w-4" /> Try the Edit Demo
                    </h3>
                    <p className="text-sm text-blue-700 mb-3">
                      Visit our interactive demo page to test how the element editing works. You can edit text and replace images in a controlled environment.
                    </p>
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = "/edit-demo";
                        toast({
                          title: "Opening Edit Demo",
                          description: "Redirecting to the element editing demo page...",
                          variant: "default",
                        });
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" /> Open Edit Demo
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Highlight Elements on Hover</Label>
                        <p className="text-sm text-muted-foreground">Show highlight box around elements when hovering</p>
                      </div>
                      <Switch
                        checked={editorSettings.highlightOnHover}
                        onCheckedChange={(checked) => {
                          setEditorSettings(prev => ({
                            ...prev,
                            highlightOnHover: checked
                          }));
                          toast({
                            title: checked ? "Hover highlighting enabled" : "Hover highlighting disabled",
                            description: checked ? "Elements will be highlighted on hover" : "Hover highlighting is off",
                          });
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Control Panel</Label>
                        <p className="text-sm text-muted-foreground">Display editing controls when element is selected</p>
                      </div>
                      <Switch
                        checked={editorSettings.showControlPanel}
                        onCheckedChange={(checked) => {
                          setEditorSettings(prev => ({
                            ...prev,
                            showControlPanel: checked
                          }));
                          toast({
                            title: checked ? "Control panel enabled" : "Control panel disabled",
                            description: checked ? "Editing controls will appear when elements are selected" : "Control panel is hidden",
                          });
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Direct Image Replacement</Label>
                        <p className="text-sm text-muted-foreground">Allow replacing images with gallery selection</p>
                      </div>
                      <Switch
                        checked={editorSettings.directImageReplacement}
                        onCheckedChange={(checked) => {
                          setEditorSettings(prev => ({
                            ...prev,
                            directImageReplacement: checked
                          }));
                          toast({
                            title: checked ? "Direct image replacement enabled" : "Direct image replacement disabled",
                            description: checked ? "You can replace images directly from the gallery" : "Direct image replacement is off",
                          });
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Confirm Before Saving</Label>
                        <p className="text-sm text-muted-foreground">Show confirmation dialog before saving changes</p>
                      </div>
                      <Switch
                        checked={editorSettings.confirmBeforeSaving}
                        onCheckedChange={(checked) => {
                          setEditorSettings(prev => ({
                            ...prev,
                            confirmBeforeSaving: checked
                          }));
                          toast({
                            title: checked ? "Save confirmation enabled" : "Save confirmation disabled",
                            description: checked ? "A confirmation dialog will appear before saving" : "Changes will save without confirmation",
                          });
                        }}
                      />
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <Button 
                        variant="outline" 
                        className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                        onClick={handleLogout}
                      >
                        Logout from Admin Dashboard
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 gap-6 mt-6">
              <Card
                className="cursor-pointer hover:border-primary transition-all duration-200 hover:shadow-md"
                onClick={() => {
                  toast({
                    title: "Edit History",
                    description: "View and manage your recent element edits",
                    variant: "default",
                  });
                }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h10"/><path d="M9 6H1v12h8"/><path d="M14 6v12"/><path d="M18 6v12"/><path d="M22 6v12"/></svg>
                    Recently Edited Elements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-md bg-gray-50">
                    No recently edited elements found.
                  </div>
                  
                  <div className="flex flex-col gap-2 mt-4">
                    <div 
                      className="w-full py-2 px-4 flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer shadow-sm hover:shadow transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast({
                          title: "View Edit History",
                          description: "This feature will be available in a future update",
                          variant: "default",
                        });
                      }}
                    >
                      <span className="font-medium">View Edit History</span>
                    </div>
                    
                    <div 
                      className="w-full py-2 px-4 flex items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 mt-4 cursor-pointer shadow-sm hover:shadow transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLogout();
                      }}
                    >
                      <span className="font-medium">Logout from Admin Dashboard</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>Event Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Manage concert events, venues, schedules, and ticket sales.</p>
                
                {eventsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2 text-muted-foreground">Loading events...</span>
                  </div>
                ) : eventsData && Array.isArray(eventsData) && eventsData.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <h3 className="font-semibold">Upcoming Events</h3>
                      {eventsData.map((event: any) => (
                        <div key={event.id} className="p-3 border rounded-md flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="font-medium">{event.title}</span>
                            <span className="text-sm text-muted-foreground">
                              {event.location} • {new Date(event.date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: "Feature Coming Soon",
                                  description: "Event editing functionality is under development.",
                                });
                              }}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500"
                              onClick={() => {
                                toast({
                                  title: "Feature Coming Soon",
                                  description: "Event deletion functionality is under development.",
                                  variant: "destructive",
                                });
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No events created yet.</p>
                    <p className="text-sm text-muted-foreground">Events will appear here once they are added to the database.</p>
                  </div>
                )}
                
                <Button 
                  className="bg-[#5D3FD3] hover:bg-[#5D3FD3]/90 text-white mt-4"
                  onClick={() => setShowAddEventDialog(true)}
                  disabled={addEventMutation.isPending}
                >
                  {addEventMutation.isPending ? "Creating..." : "Add New Event"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="gallery">
            <Card>
              <CardHeader>
                <CardTitle>Gallery Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Access the gallery to manage photos, videos, and content categorization.</p>
                
                <Button
                  className="w-full h-14 mt-2 text-lg font-bold bg-[#5D3FD3] hover:bg-[#5D3FD3]/90 text-white shadow-md hover:shadow-lg transition-all"
                  onClick={openGalleryWithAdminAccess}
                >
                  <ImageIcon className="mr-2 h-5 w-5" />
                  Open Gallery Manager
                </Button>
                
                <h3 className="font-semibold mt-8 mb-3">Media Management Features</h3>
                <div className="space-y-2">
                  <div className="p-3 border rounded-md flex items-center">
                    <ImageIcon className="h-5 w-5 mr-3 text-[#5D3FD3]" />
                    <span>Upload and organize media content</span>
                  </div>
                  <div className="p-3 border rounded-md flex items-center">
                    <span className="mr-3 text-[#5D3FD3] font-bold">⟲</span>
                    <span>Replace images with properly sized alternatives</span>
                  </div>
                  <div className="p-3 border rounded-md flex items-center">
                    <span className="mr-3 text-[#5D3FD3] font-bold">⟻</span>
                    <span>Copy and paste media between sections</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>Content Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Edit website content, homepage features, and SEO settings.</p>
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Homepage Settings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            onClick={() => {
                              toast({
                                title: "Hero Banner Editor",
                                description: "Opening hero banner editor...",
                                variant: "default",
                              });
                            }}
                          >
                            Edit Hero Banner
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            onClick={() => {
                              toast({
                                title: "Featured Events Editor",
                                description: "Opening featured events editor...",
                                variant: "default",
                              });
                            }}
                          >
                            Featured Events
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            onClick={() => {
                              toast({
                                title: "Testimonials Editor",
                                description: "Opening testimonials editor...",
                                variant: "default",
                              });
                            }}
                          >
                            Testimonials
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">SEO Settings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            onClick={() => {
                              toast({
                                title: "Meta Tags Editor",
                                description: "Opening meta tags editor...",
                                variant: "default",
                              });
                            }}
                          >
                            Meta Tags
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            onClick={() => {
                              toast({
                                title: "Site Description Editor",
                                description: "Opening site description editor...",
                                variant: "default",
                              });
                            }}
                          >
                            Site Description
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            onClick={() => {
                              toast({
                                title: "Social Sharing Editor",
                                description: "Opening social sharing editor...",
                                variant: "default",
                              });
                            }}
                          >
                            Social Sharing
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="store">
            <div className="grid grid-cols-1 gap-6">
              {/* Store Integration Settings */}
              <div id="store-api-settings-wrapper" className="relative">
                {/* Visual indicator for when scrolling to this section */}
                <div className="absolute -top-20" id="api-settings-anchor"></div>
                <Card className="border-primary/30">
                  <CardHeader className="bg-primary/5">
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-primary" /> CustomCat API Settings
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Configure your CustomCat API connection for the store
                    </p>
                  </CardHeader>
                  <CardContent>
                    <CustomCatApiSettings />
                  </CardContent>
                </Card>
              </div>
              
              {/* Product Synchronization Tool */}
              <ProductSyncTool />

              {/* Store Products Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Store Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">Manage products, orders, and promotions.</p>
                  
                  {productsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-2 text-muted-foreground">Loading products...</span>
                    </div>
                  ) : productsData && Array.isArray(productsData) && productsData.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="font-semibold">Products</h3>
                      <div className="border rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Product
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Price
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Stock
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {productsData.map((product: any) => (
                              <tr key={product.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">${parseFloat(product.price).toFixed(2)}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">{product.stock_quantity || 0}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => {
                                        toast({
                                          title: "Feature Coming Soon",
                                          description: "Product editing functionality is under development.",
                                        });
                                      }}
                                    >
                                      Edit
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-red-500"
                                      onClick={() => {
                                        toast({
                                          title: "Feature Coming Soon",
                                          description: "Product deletion functionality is under development.",
                                          variant: "destructive",
                                        });
                                      }}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Store className="h-12 w-12 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No products in store yet.</p>
                      <p className="text-sm text-muted-foreground">Sync products using the CustomCat API settings above or add them manually.</p>
                    </div>
                  )}
                  
                  <Button 
                    className="bg-[#5D3FD3] hover:bg-[#5D3FD3]/90 text-white mt-4"
                    onClick={() => {
                      toast({
                        title: "Feature Coming Soon",
                        description: "Manual product creation functionality is under development.",
                      });
                    }}
                  >
                    Add New Product
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Manage user accounts, permissions, and credentials.</p>

                <Alert className="mb-4">
                  <Users className="h-4 w-4" />
                  <AlertTitle>Beta: create the new admin accounts</AlertTitle>
                  <AlertDescription>
                    <div className="space-y-2">
                      <div>
                        1) Have each user register normally via <code>/register</code> (passwords are not stored in code).
                        2) Then click <span className="font-medium">Manage</span> on their row and toggle{" "}
                        <span className="font-medium">Admin Privileges</span>.
                      </div>
                      <div className="text-sm">
                        Target emails:
                        <ul className="list-disc ml-5">
                          <li>SpenceCoon@gmail.com</li>
                          <li>worldstringspromotion@gmail.com</li>
                        </ul>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
                
                {usersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2 text-muted-foreground">Loading users...</span>
                  </div>
                ) : (() => {
                  const userList = Array.isArray(usersData) ? usersData : (usersData?.users ?? []);
                  return userList.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Registered Users ({userList.length})</h3>
                    <div className="border rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {userList.map((user: any) => (
                            <tr key={user.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.first_name} {user.last_name}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col gap-1">
                                  {user.is_suspended ? (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                      Suspended
                                    </span>
                                  ) : (
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      user.is_verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                                    }`}>
                                      {user.is_verified ? "Verified" : "Unverified"}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {user.is_admin && (
                                  <Badge variant="default">Admin</Badge>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex flex-wrap gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setShowUserDialog(true);
                                    }}
                                  >
                                    Manage
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      verifyUserMutation.mutate({
                                        userId: user.id,
                                        verified: !user.is_verified
                                      });
                                    }}
                                    disabled={verifyUserMutation.isPending}
                                    className={user.is_verified ? "text-amber-600 hover:text-amber-700" : "text-green-600 hover:text-green-700"}
                                  >
                                    {user.is_verified ? "Unverify" : "Verify"}
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      updateUserMutation.mutate({
                                        userId: user.id,
                                        updates: { is_suspended: !user.is_suspended }
                                      });
                                    }}
                                    disabled={updateUserMutation.isPending}
                                    className={user.is_suspended ? "text-green-600 hover:text-green-700" : "text-orange-600 hover:text-orange-700"}
                                  >
                                    {user.is_suspended ? "Unsuspend" : "Suspend"}
                                  </Button>
                                  <Button 
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (window.confirm(`Are you sure you want to permanently delete ${user.first_name} ${user.last_name}? This action cannot be undone.`)) {
                                        deleteUserMutation.mutate(user.id);
                                      }
                                    }}
                                    disabled={deleteUserMutation.isPending}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No users registered yet.</p>
                    <p className="text-sm text-muted-foreground">Users will appear here once they create accounts.</p>
                  </div>
                );
              })()}
              </CardContent>
            </Card>

            {/* User Details Dialog */}
            <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>User Details</DialogTitle>
                  <DialogDescription>
                    Manage user account settings and permissions
                  </DialogDescription>
                </DialogHeader>
                {selectedUser && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Name:</span>
                        <p className="text-muted-foreground">{selectedUser.first_name} {selectedUser.last_name}</p>
                      </div>
                      <div>
                        <span className="font-medium">Email:</span>
                        <p className="text-muted-foreground break-all">{selectedUser.email}</p>
                      </div>
                      <div>
                        <span className="font-medium">Joined:</span>
                        <p className="text-muted-foreground">
                          {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">User ID:</span>
                        <p className="text-muted-foreground">{selectedUser.id}</p>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="verified-toggle">Verified Status</Label>
                          <p className="text-xs text-muted-foreground">Allow user to access verified features</p>
                        </div>
                        <Switch
                          id="verified-toggle"
                          checked={selectedUser.is_verified}
                          onCheckedChange={(checked) => {
                            verifyUserMutation.mutate({
                              userId: selectedUser.id,
                              verified: checked
                            });
                          }}
                          disabled={verifyUserMutation.isPending}
                        />
                      </div>

                      <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                        <p className="text-sm font-medium">Verification → ticket emails</p>
                        <p className="text-xs text-muted-foreground">
                          Verifying sends a welcome email with next steps. Free ticket emails (subject below) go out when the nurse claims from their dashboard—or you can resend a ticket email from the table below. Nurses can also resend from their dashboard.
                        </p>
                        {verificationTicketEmailMeta && (
                          <Alert>
                            <Mail className="h-4 w-4" />
                            <AlertTitle className="text-sm">What is sent</AlertTitle>
                            <AlertDescription className="text-xs space-y-1 mt-1">
                              <div>
                                <span className="font-medium">Template:</span> {verificationTicketEmailMeta.templateName}
                              </div>
                              <div>
                                <span className="font-medium">Subject line:</span> {verificationTicketEmailMeta.subject}
                              </div>
                              <div>
                                <span className="font-medium">From:</span> {verificationTicketEmailMeta.fromAddress}
                              </div>
                              <div className="pt-1 border-t mt-2">{verificationTicketEmailMeta.dispatchExplanation}</div>
                              {selectedUser.email && (
                                <div className="pt-1">
                                  <span className="font-medium">Recipient:</span> {selectedUser.email}
                                </div>
                              )}
                              <p className="pt-2 mt-2 border-t text-[11px] leading-snug text-muted-foreground">
                                <span className="font-medium text-foreground">One template:</span> Admin &quot;Resend ticket email&quot; uses this same subject and HTML layout with live event details, ticket code, and QR image—no separate resend template.
                              </p>
                            </AlertDescription>
                          </Alert>
                        )}
                        {verificationTicketEmailMeta &&
                          typeof (verificationTicketEmailMeta as { welcomeEmailSubject?: string }).welcomeEmailSubject ===
                            "string" && (
                            <Alert className="mt-2">
                              <Mail className="h-4 w-4" />
                              <AlertTitle className="text-sm">Welcome email (when you approve verify)</AlertTitle>
                              <AlertDescription className="text-xs space-y-1 mt-1">
                                <div>
                                  <span className="font-medium">Subject:</span>{" "}
                                  {(verificationTicketEmailMeta as { welcomeEmailSubject: string }).welcomeEmailSubject}
                                </div>
                                <div>
                                  {(verificationTicketEmailMeta as { welcomeEmailExplanation?: string }).welcomeEmailExplanation}
                                </div>
                              </AlertDescription>
                            </Alert>
                          )}
                        {Array.isArray(selectedUserTickets) && selectedUserTickets.length > 0 ? (
                          <div className="overflow-x-auto rounded border bg-background">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b bg-muted/50 text-left">
                                  <th className="p-2">Event</th>
                                  <th className="p-2">Ticket</th>
                                  <th className="p-2">Email status</th>
                                  <th className="p-2 w-[140px]">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedUserTickets.map((t: {
                                  id: string;
                                  status?: string | null;
                                  event_title?: string | null;
                                  event_date?: string | null;
                                  ticket_code?: string;
                                  email_status?: string | null;
                                  email_error?: string | null;
                                }) => {
                                  const ticketBlocked =
                                    t.status === "revoked" || t.status === "expired";
                                  const resendPending =
                                    resendTicketEmailMutation.isPending &&
                                    resendTicketEmailMutation.variables?.ticketId === t.id;
                                  return (
                                  <tr key={t.id} className="border-b last:border-0">
                                    <td className="p-2 align-top">
                                      <div className="font-medium">{t.event_title || "—"}</div>
                                      <div className="text-muted-foreground">
                                        {t.event_date ? new Date(t.event_date).toLocaleDateString() : ""}
                                      </div>
                                    </td>
                                    <td className="p-2 font-mono">{t.ticket_code}</td>
                                    <td className="p-2 align-top">
                                      <Badge
                                        variant={
                                          t.email_status === "sent"
                                            ? "default"
                                            : t.email_status === "simulated"
                                              ? "secondary"
                                              : t.email_status === "failed"
                                                ? "destructive"
                                                : "outline"
                                        }
                                        className="text-[10px]"
                                      >
                                        {t.email_status === "sent"
                                          ? "Delivered"
                                          : t.email_status === "simulated"
                                            ? "Log only (not delivered)"
                                            : t.email_status === "failed"
                                              ? "Failed"
                                              : t.email_status || "—"}
                                      </Badge>
                                      {t.email_error ? (
                                        <div className="text-destructive mt-1 max-w-[180px] break-words">{t.email_error}</div>
                                      ) : null}
                                    </td>
                                    <td className="p-2 align-top">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-[10px] h-7 px-2"
                                        disabled={ticketBlocked || resendPending}
                                        title={
                                          ticketBlocked
                                            ? "Cannot resend email for revoked or expired tickets"
                                            : undefined
                                        }
                                        onClick={() =>
                                          resendTicketEmailMutation.mutate({
                                            ticketId: t.id,
                                            userId: selectedUser.id,
                                          })
                                        }
                                      >
                                        {resendPending ? (
                                          <>
                                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                            Sending…
                                          </>
                                        ) : (
                                          "Resend ticket email"
                                        )}
                                      </Button>
                                    </td>
                                  </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No tickets yet — user needs verification while published future events exist.
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="admin-toggle">Admin Privileges</Label>
                          <p className="text-xs text-muted-foreground">Grant full admin dashboard access</p>
                        </div>
                        <Switch
                          id="admin-toggle"
                          checked={selectedUser.is_admin}
                          onCheckedChange={(checked) => {
                            updateUserMutation.mutate({
                              userId: selectedUser.id,
                              updates: { is_admin: checked }
                            });
                            setSelectedUser({ ...selectedUser, is_admin: checked });
                          }}
                          disabled={updateUserMutation.isPending}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between border-t pt-3">
                        <div>
                          <Label htmlFor="suspended-toggle" className="text-orange-600">Suspended</Label>
                          <p className="text-xs text-muted-foreground">Suspend user account access</p>
                        </div>
                        <Switch
                          id="suspended-toggle"
                          checked={selectedUser.is_suspended || false}
                          onCheckedChange={(checked) => {
                            updateUserMutation.mutate({
                              userId: selectedUser.id,
                              updates: { is_suspended: checked }
                            });
                            setSelectedUser({ ...selectedUser, is_suspended: checked });
                          }}
                          disabled={updateUserMutation.isPending}
                        />
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <Button 
                        variant="destructive" 
                        className="w-full"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to permanently delete ${selectedUser.first_name} ${selectedUser.last_name}? This action cannot be undone.`)) {
                            deleteUserMutation.mutate(selectedUser.id);
                          }
                        }}
                        disabled={deleteUserMutation.isPending}
                      >
                        Delete User Permanently
                      </Button>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowUserDialog(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Employer Job Posting Options Dialog */}
            <Dialog open={showEmployerDialog} onOpenChange={setShowEmployerDialog}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Employer Job Posting Options</DialogTitle>
                  <DialogDescription>
                    Enable which purchase options this employer can use to unlock job posting.
                  </DialogDescription>
                </DialogHeader>

                {selectedEmployer && (
                  <div className="space-y-4">
                    <div className="text-sm">
                      <div className="font-medium">{selectedEmployer.company_name || selectedEmployer.name}</div>
                      <div className="text-muted-foreground break-all">{selectedEmployer.contact_email}</div>
                    </div>

                    <div className="border-t pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="jobopt-perpost">Per-post</Label>
                          <p className="text-xs text-muted-foreground">Allow buying credits (1 credit = 1 job post)</p>
                        </div>
                        <Switch
                          id="jobopt-perpost"
                          checked={employerJobPostOptions.perPost}
                          onCheckedChange={(checked) =>
                            setEmployerJobPostOptions((s) => ({ ...s, perPost: checked }))
                          }
                          disabled={updateEmployerJobPostOptionsMutation.isPending}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="jobopt-pass">Pass</Label>
                          <p className="text-xs text-muted-foreground">Allow buying a time-limited pass</p>
                        </div>
                        <Switch
                          id="jobopt-pass"
                          checked={employerJobPostOptions.pass}
                          onCheckedChange={(checked) =>
                            setEmployerJobPostOptions((s) => ({ ...s, pass: checked }))
                          }
                          disabled={updateEmployerJobPostOptionsMutation.isPending}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="jobopt-lifetime">Lifetime</Label>
                          <p className="text-xs text-muted-foreground">Allow buying lifetime job posting access</p>
                        </div>
                        <Switch
                          id="jobopt-lifetime"
                          checked={employerJobPostOptions.lifetime}
                          onCheckedChange={(checked) =>
                            setEmployerJobPostOptions((s) => ({ ...s, lifetime: checked }))
                          }
                          disabled={updateEmployerJobPostOptionsMutation.isPending}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowEmployerDialog(false)}
                    disabled={updateEmployerJobPostOptionsMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => updateEmployerJobPostOptionsMutation.mutate()}
                    disabled={!selectedEmployer || updateEmployerJobPostOptionsMutation.isPending}
                  >
                    {updateEmployerJobPostOptionsMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showAddEventDialog} onOpenChange={setShowAddEventDialog}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Event</DialogTitle>
                  <DialogDescription>
                    Create a new concert event with all the details.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Event Title *</Label>
                    <Input
                      id="title"
                      value={addEventForm.title}
                      onChange={(e) => setAddEventForm({...addEventForm, title: e.target.value})}
                      placeholder="e.g., Jazz Night Live"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="subtitle">Subtitle</Label>
                    <Input
                      id="subtitle"
                      value={addEventForm.subtitle}
                      onChange={(e) => setAddEventForm({...addEventForm, subtitle: e.target.value})}
                      placeholder="Optional subtitle"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="artist_id">Artist ID *</Label>
                    <Input
                      id="artist_id"
                      type="number"
                      value={addEventForm.artist_id}
                      onChange={(e) => setAddEventForm({...addEventForm, artist_id: e.target.value})}
                      placeholder="Artist ID"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      value={addEventForm.location}
                      onChange={(e) => setAddEventForm({...addEventForm, location: e.target.value})}
                      placeholder="e.g., The Walter Studio"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={addEventForm.date}
                        onChange={(e) => setAddEventForm({...addEventForm, date: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="start_time">Start Time *</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={addEventForm.start_time}
                        onChange={(e) => setAddEventForm({...addEventForm, start_time: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="doors_time">Doors Time</Label>
                    <Input
                      id="doors_time"
                      type="time"
                      value={addEventForm.doors_time}
                      onChange={(e) => setAddEventForm({...addEventForm, doors_time: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      value={addEventForm.description}
                      onChange={(e) => setAddEventForm({...addEventForm, description: e.target.value})}
                      placeholder="Event description"
                      className="min-h-20 p-2 border rounded"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        value={addEventForm.price}
                        onChange={(e) => setAddEventForm({...addEventForm, price: e.target.value})}
                        placeholder="e.g., $25"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="genre">Genre</Label>
                      <Input
                        id="genre"
                        value={addEventForm.genre}
                        onChange={(e) => setAddEventForm({...addEventForm, genre: e.target.value})}
                        placeholder="e.g., Jazz"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="image_url">Image URL</Label>
                    <Input
                      id="image_url"
                      value={addEventForm.image_url}
                      onChange={(e) => setAddEventForm({...addEventForm, image_url: e.target.value})}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tickets_url">Tickets URL</Label>
                    <Input
                      id="tickets_url"
                      value={addEventForm.tickets_url}
                      onChange={(e) => setAddEventForm({...addEventForm, tickets_url: e.target.value})}
                      placeholder="https://tickets.example.com"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        id="is_featured"
                        type="checkbox"
                        checked={addEventForm.is_featured}
                        onChange={(e) => setAddEventForm({...addEventForm, is_featured: e.target.checked})}
                      />
                      <Label htmlFor="is_featured" className="cursor-pointer">Featured</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="has_presale_tickets"
                        type="checkbox"
                        checked={addEventForm.has_presale_tickets}
                        onChange={(e) => setAddEventForm({...addEventForm, has_presale_tickets: e.target.checked})}
                      />
                      <Label htmlFor="has_presale_tickets" className="cursor-pointer">Presale</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="tickets_at_door_only"
                        type="checkbox"
                        checked={addEventForm.tickets_at_door_only}
                        onChange={(e) => setAddEventForm({...addEventForm, tickets_at_door_only: e.target.checked})}
                      />
                      <Label htmlFor="tickets_at_door_only" className="cursor-pointer">Door Only</Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddEventDialog(false)}
                    disabled={addEventMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (!addEventForm.title || !addEventForm.date || !addEventForm.artist_id || !addEventForm.start_time || !addEventForm.location) {
                        toast({
                          title: "Missing Required Fields",
                          description: "Please fill in all required fields (marked with *).",
                          variant: "destructive",
                        });
                        return;
                      }
                      addEventMutation.mutate();
                    }}
                    disabled={addEventMutation.isPending}
                  >
                    {addEventMutation.isPending ? "Creating..." : "Create Event"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="licenses">
            <LicenseManagement />
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | Nursing Rocks Concert Series</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <AdminDashboard />
        </div>
      </section>
    </>
  );
}

// ========== NRPX PHOENIX REGISTRATIONS TAB ==========

interface NrpxReg {
  id: string;
  ticket_code: string;
  first_name: string;
  last_name: string;
  email: string;
  employer: string | null;
  registered_at: string;
  email_sent: boolean;
  ticket_email_sent?: boolean;
  user_id?: number | null;
  checked_in: boolean;
  checked_in_at: string | null;
}

function NrpxRegistrationsTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "checked_in" | "not_checked_in">("all");
  const [sort, setSort] = useState<"date" | "name">("date");
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || localStorage.getItem("adminToken") || localStorage.getItem("auth_token")
      : null;
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (statusFilter !== "all") params.set("status", statusFilter);
  params.set("sort", sort);

  const { data, isLoading, refetch } = useQuery<{
    registrations: NrpxReg[];
    stats: { total: number; emailsSent: number; checkedIn: number; remaining: number };
  }>({
    queryKey: ["/api/admin/nrpx/registrations", search, statusFilter, sort],
    queryFn: async () => {
      const res = await fetch(`/api/admin/nrpx/registrations?${params}`, { headers: authHeaders });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    refetchInterval: 30000,
  });

  // Fetch pending NRPX approvals (users with is_verified: false)
  const { data: pendingApprovals, isLoading: pendingLoading, refetch: refetchPending } = useQuery<{
    pending: Array<{ id: string; first_name: string; last_name: string; email: string; registered_at: string }>;
    count: number;
  }>({
    queryKey: ["/api/admin/nrpx/pending-approvals"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/nrpx/pending-approvals`, { headers: authHeaders });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const handleApproveRegistration = async (registrationId: string) => {
    setApprovingId(registrationId);
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("adminToken") || localStorage.getItem("auth_token");
      const res = await fetch(`/api/admin/nrpx/approve/${registrationId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const json = await res.json();
      toast({
        title: json.success ? "Registration approved!" : "Approval failed",
        description: json.message,
        variant: json.success ? "default" : "destructive",
      });
      if (json.success) {
        refetchPending();
        refetch();
      }
    } catch (error) {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setApprovingId(null);
    }
  };

  const handleResend = async (id: string) => {
    setResendingId(id);
    try {
      const res = await fetch(`/api/admin/nrpx/registrations/resend/${id}`, {
        method: "POST",
        headers: authHeaders,
      });
      const json = await res.json();
      toast({ title: json.success ? "Email resent!" : "Resend failed", description: json.message, variant: json.success ? "default" : "destructive" });
      if (json.success) refetch();
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setResendingId(null);
    }
  };

  const handleExport = () => {
    window.location.href = `/api/admin/nrpx/registrations/export`;
  };

  const stats = data?.stats;
  const regs = data?.registrations || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Phoenix Registrations</h2>
          <p className="text-muted-foreground text-sm">Nursing Rocks Phoenix — May 16, 2026</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
          <Button size="sm" onClick={() => window.open("/phoenix-register", "_blank")}>
            <Ticket className="h-4 w-4 mr-1" /> View Reg Page
          </Button>
        </div>
      </div>

      {/* Pending Approvals Section */}
      {pendingApprovals && pendingApprovals.count > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-amber-600" />
              Pending Approvals ({pendingApprovals.count})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse h-12 bg-muted rounded"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {pendingApprovals.pending.map((reg) => (
                  <div key={reg.id} className="flex items-center justify-between bg-white border border-amber-200 rounded p-3">
                    <div>
                      <p className="font-medium">{reg.first_name} {reg.last_name}</p>
                      <p className="text-sm text-muted-foreground">{reg.email}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleApproveRegistration(reg.id)}
                      disabled={approvingId === reg.id}
                    >
                      {approvingId === reg.id ? "Approving…" : "Approve"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Registered", value: stats.total, icon: Users, color: "text-blue-600" },
            { label: "Emails Sent", value: stats.emailsSent, icon: Mail, color: "text-green-600" },
            { label: "Checked In", value: stats.checkedIn, icon: UserCheck, color: "text-emerald-600" },
            { label: "Remaining", value: stats.remaining, icon: Ticket, color: "text-orange-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${color}`} />
                  <div>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search name, email, ticket code…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="text-sm border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All</option>
          <option value="checked_in">Checked In</option>
          <option value="not_checked_in">Not Checked In</option>
        </select>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as any)}
          className="text-sm border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="date">Sort: Newest</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading registrations…</div>
      ) : regs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No registrations found.</div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {["Name", "Email", "Event", "Approval", "Ticket email", "Checked In", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {regs.map(reg => {
                  const accountApproved = reg.user_id != null || reg.email_sent;
                  const ticketEmailSent = Boolean(reg.ticket_email_sent);
                  return (
                  <tr key={reg.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 whitespace-nowrap font-medium">
                      {reg.first_name} {reg.last_name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{reg.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant="outline" className="text-xs">Phoenix 2026</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={accountApproved ? "bg-green-100 text-green-800 border-green-200" : "bg-yellow-100 text-yellow-800 border-yellow-200"}
                      >
                        {accountApproved ? "✓ Approved" : "⏳ Pending"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ticketEmailSent ? "default" : "secondary"} className="text-xs">
                        {ticketEmailSent ? "Yes" : "No"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {reg.checked_in ? (
                        <div>
                          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" /> In
                          </Badge>
                          {reg.checked_in_at && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(reg.checked_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Not In</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 space-x-2 flex flex-wrap">
                      {!accountApproved && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={approvingId === reg.id}
                          onClick={() => handleApproveRegistration(reg.id)}
                          className="h-7 text-xs text-green-600 hover:text-green-700"
                        >
                          {approvingId === reg.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <>✓ Approve</>
                          )}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={resendingId === reg.id}
                        onClick={() => handleResend(reg.id)}
                        className="h-7 text-xs"
                      >
                        {resendingId === reg.id ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          "Resend email"
                        )}
                      </Button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t bg-muted/20 text-xs text-muted-foreground">
            Showing {regs.length} of {stats?.total ?? 0} registrations
          </div>
        </div>
      )}
    </div>
  );
}

// ── Admin Token Countdown ─────────────────────────────────────────────────────
function TokenCountdown() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const getExpiry = () => {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      if (!token) return null;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp ? payload.exp * 1000 : null;
      } catch { return null; }
    };

    const tick = () => {
      const exp = getExpiry();
      if (!exp) { setRemaining(null); return; }
      setRemaining(Math.max(0, exp - Date.now()));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (remaining === null) return null;

  const days = Math.floor(remaining / 86400000);
  const hrs  = Math.floor((remaining % 86400000) / 3600000);
  const mins = Math.floor((remaining % 3600000) / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);

  const urgent = remaining < 3600000;   // < 1 hour
  const warning = remaining < 86400000; // < 1 day

  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded ${
      urgent ? 'bg-red-100 text-red-700' :
      warning ? 'bg-yellow-100 text-yellow-700' :
      'bg-green-100 text-green-800'
    }`}>
      Token expires in: {days > 0 ? `${days}d ` : ''}{String(hrs).padStart(2,'0')}:{String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
    </span>
  );
}

// ── Traffic Stats Widget ──────────────────────────────────────────────────────
const TRAFFIC_REFRESH_MS = 30_000; // 30 seconds

function TrafficStatsWidget({ adminFetch }: { adminFetch: (url: string) => Promise<any> }) {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['/api/admin/traffic-stats'],
    queryFn: async () => {
      const result = await adminFetch('/api/admin/traffic-stats');
      setLastUpdated(new Date());
      return result;
    },
    staleTime: 0,
    refetchInterval: TRAFFIC_REFRESH_MS,
    refetchIntervalInBackground: true, // keeps ticking even when tab is not focused
  });

  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  // Format "last updated" as a human-readable time
  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  const hours: { time: string; visitors: number; registrations: number }[] = data?.days ?? [];
  const today = data?.today ?? { visitors: 0, registrations: 0 };
  const maxVal = Math.max(...hours.map((h: any) => Math.max(h.visitors, h.registrations)), 1);

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Site Traffic vs Registrations
            {/* Live indicator dot */}
            <span className="flex items-center gap-1 ml-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-xs font-normal text-green-600">Live</span>
            </span>
          </CardTitle>
          <div className="flex items-center gap-3">
            {lastUpdatedLabel && (
              <span className="text-xs text-muted-foreground">
                Updated {lastUpdatedLabel}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isFetching || isRefreshing}
              className="h-8 px-2"
            >
              <RefreshCw className={`h-4 w-4 ${(isFetching || isRefreshing) ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-muted rounded w-40" />
            <div className="h-32 bg-muted rounded" />
          </div>
        ) : (
          <>
            {/* Summary row */}
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-6">
              {[
                { label: "Visitors (24h)", value: today.visitors, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
                { label: "Registrations (24h)", value: today.registrations, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={`${bg} rounded-lg p-4 text-center transition-all`}>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mb-3">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="inline-block w-3 h-3 rounded bg-blue-400" /> Unique Visits
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="inline-block w-3 h-3 rounded bg-green-500" /> Registrations
              </span>
            </div>

            {/* 24-hour bar chart */}
            <div className="space-y-2">
              {hours.map((h: any) => (
                <div key={h.time} className="flex items-center gap-3 text-xs">
                  <span className="w-20 text-muted-foreground shrink-0 font-medium">
                    {new Date(h.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </span>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted/30 rounded h-3 overflow-hidden">
                        <div
                          className="h-full rounded bg-blue-400 transition-all duration-500"
                          style={{ width: `${Math.max((h.visitors / maxVal) * 100, h.visitors > 0 ? 2 : 0)}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground w-16 text-right">{h.visitors} visits</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted/30 rounded h-3 overflow-hidden">
                        <div
                          className="h-full rounded bg-green-500 transition-all duration-500"
                          style={{ width: `${Math.max((h.registrations / maxVal) * 100, h.registrations > 0 ? 2 : 0)}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground w-16 text-right">{h.registrations} reg.</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground mt-4 border-t pt-3">
              24-hour hourly data. Refreshes every 30 seconds. Visitor counts reset on server restart. Registrations are live from the database.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}