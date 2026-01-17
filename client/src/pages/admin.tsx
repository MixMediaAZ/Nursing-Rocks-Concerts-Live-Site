import { useState, useEffect } from "react";
// #region agent log - Admin page instrumentation
// #endregion
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
  FileCheck
} from "lucide-react";
import CustomCatApiSettings from "@/components/admin/custom-cat-api-settings";
import ProductSyncTool from "@/components/admin/product-sync-tool";
import { NewsletterContacts } from "@/components/admin/newsletter-contacts";
import VideoSubmissions from "@/components/admin/video-submissions";
import VideoApproval from "@/components/admin/video-approval";
import { LicenseManagement } from "@/components/admin/license-management";

export default function AdminPage() {
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7256/ingest/99bf51b4-4988-46a2-ac14-c43ca591cfd4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/src/pages/admin.tsx:AdminPage',message:'Admin page mounted',data:{pathname:window.location.pathname,search:window.location.search},timestamp:Date.now(),sessionId:'debug-session',runId:'admin-login-debug',hypothesisId:'H1'})}).catch(()=>{});
  }, []);
  // #endregion
  
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch real data from API with automatic refetching
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['/api/events'],
    enabled: authenticated,
    staleTime: 0, // Always consider data stale to ensure fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/store/products'],
    enabled: authenticated,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: authenticated,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      return data;
    },
  });

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/admin/jobs'],
    enabled: authenticated,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/jobs', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch jobs');
      return response.json();
    },
  });

  const { data: employersData, isLoading: employersLoading } = useQuery({
    queryKey: ['/api/admin/employers'],
    enabled: authenticated,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/employers', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch employers');
      return response.json();
    },
  });

  // Global app settings (admin-only via JWT)
  const { data: appSettingsData, isLoading: appSettingsLoading } = useQuery({
    queryKey: ['/api/settings'],
    enabled: authenticated,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await fetch('/api/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    },
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

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: number; updates: { is_admin?: boolean; is_verified?: boolean; is_suspended?: boolean } }) => {
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
    onSuccess: async () => {
      // Immediately refetch users data to update dashboard
      await queryClient.refetchQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User Updated",
        description: "User information has been updated successfully.",
      });
      setShowUserDialog(false);
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

  // Check database-based admin authentication
  useEffect(() => {
    const checkAdminAuth = () => {
      try {
        // Get user data from localStorage
        const token = localStorage.getItem("token");
        const userDataStr = localStorage.getItem("user");
        const isAdmin = localStorage.getItem("isAdmin") === "true";
        
        if (!token || !userDataStr) {
          // No authentication found, redirect to login
          setAuthenticated(false);
          setLoading(false);
          toast({
            variant: "destructive",
            title: "Authentication Required",
            description: "Please login with an admin account to access this page.",
          });
          setTimeout(() => {
            window.location.href = "/login?redirect=/admin";
          }, 1500);
          return;
        }
        
        // Parse user data
        const userData = JSON.parse(userDataStr);
        
        // Check if user is an admin
        if (!isAdmin && !userData.is_admin) {
          // User is not an admin, redirect to regular dashboard
          setAuthenticated(false);
          setLoading(false);
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You do not have admin privileges.",
          });
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 1500);
          return;
        }
        
        // User is authenticated as admin
        setUserEmail(userData.email);
        setAuthenticated(true);
        setLoading(false);
      } catch (error) {
        console.error("Admin auth check error:", error);
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
      }
    };
    
    checkAdminAuth();
  }, [toast]);

  const handleLogout = () => {
    // Clear all authentication state
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("isAdmin");
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
    }, 1000);
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
            <AlertTitle className="text-green-800 font-bold">Admin Mode Active</AlertTitle>
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

        <Tabs value={activeTab} defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
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
                      {Array.isArray(usersData) ? usersData.length : 0}
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

              {/* Job Listings Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Listings</CardTitle>
                </CardHeader>
                <CardContent>
                  {jobsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : Array.isArray(jobsData) && jobsData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3">Title</th>
                            <th className="text-left p-3">Employer</th>
                            <th className="text-left p-3">Location</th>
                            <th className="text-left p-3">Status</th>
                            <th className="text-left p-3">Approval</th>
                            <th className="text-left p-3">Views</th>
                            <th className="text-left p-3">Applications</th>
                            <th className="text-left p-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {jobsData.map((job: any) => (
                            <tr key={job.id} className="border-b hover:bg-muted/50">
                              <td className="p-3 font-medium">{job.title}</td>
                              <td className="p-3">{job.employer?.name || 'N/A'}</td>
                              <td className="p-3">{job.location}</td>
                              <td className="p-3">
                                <Badge variant={job.is_active ? "default" : "secondary"}>
                                  {job.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </td>
                              <td className="p-3">
                                {job.is_approved ? (
                                  <Badge variant="default" className="bg-green-500">
                                    <CheckCircle className="h-3 w-3 mr-1" /> Approved
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive">
                                    <XCircle className="h-3 w-3 mr-1" /> Pending
                                  </Badge>
                                )}
                              </td>
                              <td className="p-3">{job.views_count || 0}</td>
                              <td className="p-3">{job.applications_count || 0}</td>
                              <td className="p-3">
                                <div className="flex gap-2">
                                  {!job.is_approved ? (
                                    <Button
                                      size="sm"
                                      variant="default"
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={async () => {
                                        try {
                                          const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
                                          await fetch(`/api/admin/jobs/${job.id}/approve`, {
                                            method: 'POST',
                                            headers: {
                                              'Authorization': `Bearer ${token}`,
                                              'Content-Type': 'application/json',
                                            },
                                          });
                                          await queryClient.refetchQueries({ queryKey: ['/api/admin/jobs'] });
                                          toast({
                                            title: "Job Approved",
                                            description: "Job listing is now visible to users",
                                          });
                                        } catch (error) {
                                          toast({
                                            title: "Error",
                                            description: "Failed to approve job",
                                            variant: "destructive",
                                          });
                                        }
                                      }}
                                    >
                                      Approve
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={async () => {
                                        try {
                                          const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
                                          await fetch(`/api/admin/jobs/${job.id}/reject`, {
                                            method: 'POST',
                                            headers: {
                                              'Authorization': `Bearer ${token}`,
                                              'Content-Type': 'application/json',
                                            },
                                          });
                                          await queryClient.refetchQueries({ queryKey: ['/api/admin/jobs'] });
                                          toast({
                                            title: "Job Unapproved",
                                            description: "Job listing is now hidden from users",
                                          });
                                        } catch (error) {
                                          toast({
                                            title: "Error",
                                            description: "Failed to unapprove job",
                                            variant: "destructive",
                                          });
                                        }
                                      }}
                                    >
                                      Unapprove
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={async () => {
                                      if (window.confirm('Are you sure you want to delete this job listing?')) {
                                        try {
                                          const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
                                          await fetch(`/api/admin/jobs/${job.id}`, {
                                            method: 'DELETE',
                                            headers: {
                                              'Authorization': `Bearer ${token}`,
                                            },
                                          });
                                          await queryClient.refetchQueries({ queryKey: ['/api/admin/jobs'] });
                                          toast({
                                            title: "Job Deleted",
                                            description: "Job listing has been removed",
                                          });
                                        } catch (error) {
                                          toast({
                                            title: "Error",
                                            description: "Failed to delete job",
                                            variant: "destructive",
                                          });
                                        }
                                      }
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
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No job listings yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

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
                                        await fetch(`/api/admin/employers/${employer.id}/verify`, {
                                          method: 'POST',
                                          headers: {
                                            'Authorization': `Bearer ${token}`,
                                          },
                                        });
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
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Control Panel</Label>
                        <p className="text-sm text-muted-foreground">Display editing controls when element is selected</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Direct Image Replacement</Label>
                        <p className="text-sm text-muted-foreground">Allow replacing images with gallery selection</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Confirm Before Saving</Label>
                        <p className="text-sm text-muted-foreground">Show confirmation dialog before saving changes</p>
                      </div>
                      <Switch defaultChecked />
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
                  onClick={() => {
                    toast({
                      title: "Feature Coming Soon",
                      description: "Event creation functionality is under development.",
                    });
                  }}
                >
                  Add New Event
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
                ) : usersData && Array.isArray(usersData) && usersData.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Registered Users ({usersData.length})</h3>
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
                          {usersData.map((user: any) => (
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
                )}
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
                            updateUserMutation.mutate({
                              userId: selectedUser.id,
                              updates: { is_verified: checked }
                            });
                            setSelectedUser({ ...selectedUser, is_verified: checked });
                          }}
                          disabled={updateUserMutation.isPending}
                        />
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