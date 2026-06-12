import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { JobPostingsStatsWidget } from "@/components/admin/job-postings-stats-widget";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function JobAnalyticsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const adminToken = localStorage.getItem("token") || localStorage.getItem("adminToken");
    setIsAdmin(!!adminToken);

    if (!adminToken) {
      toast({
        title: "Authentication Required",
        description: "You need to log in as an admin to access this page.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const adminFetch = useCallback(async (url: string) => {
    const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
    if (!token) {
      throw new Error("Not authenticated");
    }
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401 || res.status === 403) {
      throw new Error("Admin privileges required");
    }
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  }, []);

  const goBack = () => {
    window.history.back();
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-12">
        <Helmet>
          <title>Admin Access Required - Nursing Rocks</title>
        </Helmet>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
              <p className="mb-6">Please log in as an admin to access the job postings analytics.</p>
              <div className="flex justify-center gap-4">
                <Button onClick={() => (window.location.href = "/admin")}>
                  Go to Admin Login
                </Button>
                <Button variant="outline" onClick={goBack}>
                  Go Back
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12">
      <Helmet>
        <title>Job Postings Analytics - Nursing Rocks</title>
      </Helmet>

      <div className="mb-2 flex items-center">
        <Button variant="ghost" className="mr-2" onClick={goBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Job Postings Analytics</h1>
      </div>

      <div className="max-w-5xl mx-auto">
        <JobPostingsStatsWidget adminFetch={adminFetch} />
      </div>
    </div>
  );
}
