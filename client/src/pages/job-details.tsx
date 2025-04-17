import { useState } from "react";
import { useParams, useLocation, Link as WouterLink } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Briefcase,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Banknote,
  GraduationCap,
  Star,
  Sparkles,
  Share2,
  Bookmark,
  Send,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  ClipboardCheck,
  Users,
  Building,
  Globe,
  Phone,
  Mail,
  ExternalLink,
  FileText,
  Upload,
  Stethoscope,
  ShieldCheck,
} from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

const applicationSchema = z.object({
  coverLetter: z.string().min(1, "Cover letter is required"),
  resumeUrl: z.string().optional(),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms",
  }),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

export default function JobDetailsPage() {
  const { id } = useParams();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const queryClient = useQueryClient();

  // Fetch job details
  const {
    data: job,
    isLoading,
    error,
  } = useQuery<any>({
    queryKey: [`/api/jobs/${id}`],
    enabled: !!id,
    retry: false,
    onError: (err: any) => {
      toast({
        title: "Error loading job",
        description: err.message || "Job not found",
        variant: "destructive",
      });
      navigate("/jobs");
    },
  });

  // Fetch employer details
  const { data: employer, isLoading: isLoadingEmployer } = useQuery<any>({
    queryKey: [`/api/employers/${job?.employer_id}`],
    enabled: !!job?.employer_id,
  });

  // Fetch similar jobs
  const { data: similarJobs, isLoading: isLoadingSimilarJobs } = useQuery<any[]>({
    queryKey: [`/api/jobs/similar/${id}`],
    enabled: !!id,
    initialData: [],
  });

  // Fetch nurse profile
  const { data: profile, isLoading: isLoadingProfile } = useQuery<any>({
    queryKey: ['/api/profile'],
  });

  // User authentication status
  const { data: authStatus } = useQuery<any>({
    queryKey: ['/api/auth/status'],
    initialData: { isAuthenticated: false, isVerified: false },
  });
  
  const isAuthenticated = authStatus?.isAuthenticated;
  const isVerified = authStatus?.isVerified;

  // Save job mutation
  const saveJobMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/jobs/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId: id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save job");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Job saved",
        description: "This job has been saved to your profile",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/saved'] });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to save job",
        description: err.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  // Application form
  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      coverLetter: "",
      resumeUrl: profile?.resume_url || "",
      agreeToTerms: false,
    },
  });

  // Job application mutation
  const applyJobMutation = useMutation({
    mutationFn: async (values: ApplicationFormValues) => {
      const response = await apiRequest("/api/jobs/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId: id,
          coverLetter: values.coverLetter,
          resumeUrl: values.resumeUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to apply for the job");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Application submitted",
        description: "Your job application has been successfully submitted",
      });
      setShowApplicationForm(false);
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/applications'] });
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${id}`] });
    },
    onError: (err: any) => {
      toast({
        title: "Application failed",
        description: err.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  // Handle job application
  function onSubmit(values: ApplicationFormValues) {
    applyJobMutation.mutate(values);
  }

  // Handle save job
  function handleSaveJob() {
    if (isAuthenticated) {
      saveJobMutation.mutate();
    } else {
      toast({
        title: "Authentication required",
        description: "Please sign in to save jobs",
        variant: "destructive",
      });
      navigate("/login");
    }
  }

  // Handle apply click
  function handleApplyClick() {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to apply for jobs",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (!isVerified) {
      toast({
        title: "Verification required",
        description: "You need to verify your nursing license before applying",
        variant: "destructive",
      });
      navigate("/license");
      return;
    }

    setShowApplicationForm(true);
  }

  // Share job
  function shareJob() {
    if (navigator.share) {
      navigator
        .share({
          title: job?.title,
          text: `Check out this nursing job: ${job?.title} at ${job?.employer?.name}`,
          url: window.location.href,
        })
        .catch((err) => {
          console.error("Error sharing:", err);
        });
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Job link copied to clipboard",
      });
    }
  }

  if (isLoading) {
    return <JobDetailsSkeleton />;
  }

  if (error || !job) {
    return (
      <div className="container max-w-5xl mx-auto py-12 px-4">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Job Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The job you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate("/jobs")}>Browse All Jobs</Button>
        </div>
      </div>
    );
  }

  const hasApplied = job.has_applied;
  const isSaved = job.is_saved;

  return (
    <div className="container max-w-5xl mx-auto py-12 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
            <WouterLink
              href="/jobs"
              className="hover:text-primary transition-colors"
            >
              Jobs
            </WouterLink>
            <ChevronRight className="h-4 w-4" />
            <span>{job.specialty}</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">{job.title}</span>
          </div>

          <div className="bg-white rounded-lg border shadow-sm overflow-hidden mb-8">
            <div className="p-6 pb-4">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">{job.title}</h1>
                    {job.is_featured && (
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        <Sparkles className="h-3 w-3 mr-1 text-primary fill-primary/20" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center text-muted-foreground mt-1">
                    <Building2 className="h-4 w-4 mr-1.5" />
                    <span className="font-medium text-foreground mr-2">
                      {employer?.name || "Loading employer..."}
                    </span>
                    <span className="mx-1.5">•</span>
                    <MapPin className="h-4 w-4 mr-1.5" />
                    <span>{job.location}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={shareJob}
                          className="h-9 w-9"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Share job</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant={isSaved ? "default" : "outline"} 
                          size="icon" 
                          onClick={handleSaveJob}
                          disabled={saveJobMutation.isPending}
                          className="h-9 w-9"
                        >
                          <Bookmark 
                            className={`h-4 w-4 ${isSaved ? 'fill-primary-foreground' : ''}`} 
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isSaved ? "Saved" : "Save job"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-muted/50 p-3 rounded-md">
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Briefcase className="h-3.5 w-3.5 mr-1.5" />
                    Job Type
                  </div>
                  <div className="font-medium mt-1">{job.job_type}</div>
                </div>
                
                <div className="bg-muted/50 p-3 rounded-md">
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Stethoscope className="h-3.5 w-3.5 mr-1.5" />
                    Specialty
                  </div>
                  <div className="font-medium mt-1">{job.specialty}</div>
                </div>
                
                <div className="bg-muted/50 p-3 rounded-md">
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1.5" />
                    Shift Type
                  </div>
                  <div className="font-medium mt-1">{job.shift_type || "Not specified"}</div>
                </div>
                
                <div className="bg-muted/50 p-3 rounded-md">
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Users className="h-3.5 w-3.5 mr-1.5" />
                    Experience
                  </div>
                  <div className="font-medium mt-1">{job.experience_level}</div>
                </div>
              </div>
              
              <div className="mt-6 flex flex-wrap justify-between items-center">
                <div>
                  <div className="font-bold text-2xl text-primary">
                    {job.salary_min && job.salary_max
                      ? `$${(job.salary_min / 1000).toFixed(0)}k - $${(job.salary_max / 1000).toFixed(0)}k`
                      : job.salary_min
                      ? `$${(job.salary_min / 1000).toFixed(0)}k+`
                      : "Competitive"}
                  </div>
                  <div className="text-muted-foreground">
                    {job.salary_period || "per year"}
                  </div>
                </div>
                
                <div className="mt-4 sm:mt-0">
                  {hasApplied ? (
                    <div className="flex items-center text-green-600 bg-green-50 border border-green-100 px-4 py-2 rounded-md">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span className="font-medium">Already Applied</span>
                    </div>
                  ) : (
                    <Button 
                      size="lg" 
                      onClick={handleApplyClick}
                      disabled={!isAuthenticated || !isVerified}
                    >
                      Apply Now
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Posted: {new Date(job.posted_date).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                {job.applications_count > 0 && (
                  <>
                    <span className="mx-2">•</span>
                    <ClipboardCheck className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {job.applications_count} {job.applications_count === 1 ? "applicant" : "applicants"}
                    </span>
                  </>
                )}
              </div>
              
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Job Description</h2>
                  <div className="text-muted-foreground space-y-4">
                    <p>{job.description}</p>
                  </div>
                </div>
                
                {job.responsibilities && (
                  <div>
                    <h2 className="text-lg font-semibold mb-2">Responsibilities</h2>
                    <div className="text-muted-foreground space-y-2">
                      {job.responsibilities.split('\n').map((responsibility, i) => (
                        <div key={i} className="flex items-start">
                          <div className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                          <p>{responsibility}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {job.requirements && (
                  <div>
                    <h2 className="text-lg font-semibold mb-2">Requirements</h2>
                    <div className="text-muted-foreground space-y-2">
                      {job.requirements.split('\n').map((requirement, i) => (
                        <div key={i} className="flex items-start">
                          <div className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                          <p>{requirement}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {job.benefits && (
                  <div>
                    <h2 className="text-lg font-semibold mb-2">Benefits</h2>
                    <div className="text-muted-foreground space-y-2">
                      {job.benefits.split('\n').map((benefit, i) => (
                        <div key={i} className="flex items-start">
                          <div className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                          <p>{benefit}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {job.certification_required && job.certification_required.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-2">Required Certifications</h2>
                    <div className="flex flex-wrap gap-2">
                      {job.certification_required.map((cert: string) => (
                        <Badge key={cert} variant="outline" className="bg-primary/5">
                          <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-8">
                {hasApplied ? (
                  <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-center">
                    <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
                    <h3 className="font-semibold text-green-700 mb-1">
                      You've Applied for This Position
                    </h3>
                    <p className="text-sm text-green-600 mb-3">
                      Your application has been sent to the employer. They will contact you if they wish to proceed.
                    </p>
                    <Button variant="outline" onClick={() => navigate("/profile?tab=applications")}>
                      View All Applications
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Button 
                      size="lg" 
                      className="px-8"
                      onClick={handleApplyClick}
                      disabled={!isAuthenticated || !isVerified}
                    >
                      Apply for this Position
                    </Button>
                    {!isAuthenticated && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <WouterLink href="/login" className="text-primary hover:underline">
                          Sign in
                        </WouterLink>{" "}
                        to apply for this job
                      </div>
                    )}
                    {isAuthenticated && !isVerified && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <WouterLink href="/license" className="text-primary hover:underline">
                          Verify your nursing license
                        </WouterLink>{" "}
                        to apply for jobs
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Application Form Dialog */}
          {showApplicationForm && (
            <Dialog open={showApplicationForm} onOpenChange={setShowApplicationForm}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Apply for {job.title}</DialogTitle>
                  <DialogDescription>
                    Complete this application form to apply for the position at {employer?.name}.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="coverLetter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cover Letter</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Introduce yourself and explain why you're a good fit for this role..."
                              className="min-h-40"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Highlight your relevant experience and skills
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="resumeUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Resume</FormLabel>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Input {...field} disabled={!!profile?.resume_url} />
                            </FormControl>
                            <Button type="button" variant="outline" size="sm">
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </Button>
                          </div>
                          <FormDescription>
                            {profile?.resume_url 
                              ? "Using resume from your profile" 
                              : "Add your resume URL or upload a new one"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="agreeToTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Terms and Conditions
                            </FormLabel>
                            <FormDescription>
                              I understand that my nursing credentials will be shared with the employer and that my profile information will be used in my application.
                            </FormDescription>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowApplicationForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={applyJobMutation.isPending}
                      >
                        {applyJobMutation.isPending ? "Submitting..." : "Submit Application"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        <div className="lg:col-span-1">
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">About the Employer</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingEmployer ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-16 rounded" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                ) : employer ? (
                  <div className="space-y-4">
                    <div className="h-16 w-16 rounded overflow-hidden border bg-muted flex items-center justify-center">
                      {employer.logo_url ? (
                        <img
                          src={employer.logo_url}
                          alt={employer.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <h3 className="font-semibold text-lg">{employer.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-4">
                      {employer.description || "No description available."}
                    </p>
                    
                    <div className="space-y-2 pt-2">
                      {employer.website && (
                        <div className="flex items-center text-sm">
                          <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                          <a
                            href={employer.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline truncate"
                          >
                            {employer.website.replace(/(^\w+:|^)\/\//, "")}
                          </a>
                        </div>
                      )}
                      
                      {employer.location && (
                        <div className="flex items-center text-sm">
                          <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-muted-foreground truncate">
                            {employer.location}
                          </span>
                        </div>
                      )}
                      
                      {employer.contact_email && (
                        <div className="flex items-center text-sm">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          <a
                            href={`mailto:${employer.contact_email}`}
                            className="text-primary hover:underline truncate"
                          >
                            {employer.contact_email}
                          </a>
                        </div>
                      )}
                      
                      {employer.contact_phone && (
                        <div className="flex items-center text-sm">
                          <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {employer.contact_phone}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <Button variant="outline" className="w-full" asChild>
                      <WouterLink href={`/employers/${employer.id}`}>
                        View Employer Profile
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </WouterLink>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Building2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>Employer information unavailable</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Similar Jobs</CardTitle>
              </CardHeader>
              <CardContent className="px-3">
                {isLoadingSimilarJobs ? (
                  <div className="space-y-4 px-1">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : similarJobs && similarJobs.length > 0 ? (
                  <ScrollArea className="h-72">
                    <div className="space-y-3 pr-3">
                      {similarJobs.map((similarJob: any) => (
                        <WouterLink
                          key={similarJob.id}
                          href={`/jobs/${similarJob.id}`}
                          className="block"
                        >
                          <div className="border rounded-md p-3 hover:bg-muted/50 transition-colors">
                            <h4 className="font-medium line-clamp-1">{similarJob.title}</h4>
                            <div className="text-sm text-muted-foreground mt-1 flex items-center">
                              <Building2 className="h-3.5 w-3.5 mr-1.5" />
                              <span className="line-clamp-1">{similarJob.employer?.name}</span>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1 flex items-center">
                              <MapPin className="h-3.5 w-3.5 mr-1.5" />
                              <span className="line-clamp-1">{similarJob.location}</span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <Badge variant="outline" className="text-xs">
                                {similarJob.job_type}
                              </Badge>
                              <span className="text-xs font-medium text-primary">
                                {similarJob.salary_min
                                  ? `$${(similarJob.salary_min / 1000).toFixed(0)}k+`
                                  : "Competitive"}
                              </span>
                            </div>
                          </div>
                        </WouterLink>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <Briefcase className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No similar jobs found</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0 border-t">
                <Button variant="ghost" className="w-full" asChild>
                  <WouterLink href="/jobs">
                    Browse All Jobs
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </WouterLink>
                </Button>
              </CardFooter>
            </Card>
            
            {profile && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Your Resume</CardTitle>
                  <CardDescription>
                    Update your profile to improve job matches
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {profile.resume_url ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">Resume uploaded</div>
                          <div className="text-sm text-muted-foreground">
                            Last updated on {new Date(profile.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <WouterLink href="/profile?tab=resume">Update Resume</WouterLink>
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-4">
                        You haven't uploaded your resume yet
                      </p>
                      <Button size="sm" asChild>
                        <WouterLink href="/profile?tab=resume">Upload Resume</WouterLink>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading skeleton for the job details page
function JobDetailsSkeleton() {
  return (
    <div className="container max-w-5xl mx-auto py-12 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Skeleton className="h-4 w-40 mb-2" />
          
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden mb-8">
            <div className="p-6 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <Skeleton className="h-8 w-72 mb-2" />
                  <Skeleton className="h-5 w-48" />
                </div>
                <Skeleton className="h-9 w-20" />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
              
              <div className="mt-6 flex justify-between items-center">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-12 w-32" />
              </div>
            </div>
            
            <div className="h-[1px] bg-muted" />
            
            <div className="p-6">
              <Skeleton className="h-4 w-48 mb-6" />
              
              <div className="space-y-8">
                <div>
                  <Skeleton className="h-6 w-40 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                
                <div>
                  <Skeleton className="h-6 w-40 mb-4" />
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <div className="mr-2 mt-1 h-2 w-2 rounded-full bg-muted flex-shrink-0" />
                      <Skeleton className="h-4 w-11/12" />
                    </div>
                    <div className="flex items-start">
                      <div className="mr-2 mt-1 h-2 w-2 rounded-full bg-muted flex-shrink-0" />
                      <Skeleton className="h-4 w-10/12" />
                    </div>
                    <div className="flex items-start">
                      <div className="mr-2 mt-1 h-2 w-2 rounded-full bg-muted flex-shrink-0" />
                      <Skeleton className="h-4 w-9/12" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <Skeleton className="h-6 w-40 mb-4" />
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <div className="mr-2 mt-1 h-2 w-2 rounded-full bg-muted flex-shrink-0" />
                      <Skeleton className="h-4 w-11/12" />
                    </div>
                    <div className="flex items-start">
                      <div className="mr-2 mt-1 h-2 w-2 rounded-full bg-muted flex-shrink-0" />
                      <Skeleton className="h-4 w-10/12" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-center">
                <Skeleton className="h-12 w-40" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-16 w-16 rounded" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center">
                      <Skeleton className="h-4 w-4 mr-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex items-center">
                      <Skeleton className="h-4 w-4 mr-2" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  </div>
                  
                  <Skeleton className="h-9 w-full mt-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </CardContent>
              <CardFooter className="border-t">
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom Link component removed as all instances now use WouterLink