import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  AlertCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { JobEditDialog } from "./job-edit-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function JobsTable({ employersData }: { employersData: any[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedJobIds, setSelectedJobIds] = useState<Set<number>>(new Set());
  const [editingJob, setEditingJob] = useState<any>(null);
  const [bulkApproveDialog, setBulkApproveDialog] = useState(false);
  const [bulkApproveNotes, setBulkApproveNotes] = useState("");

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [featuredFilter, setFeaturedFilter] = useState<string>("all");
  const [employerFilter, setEmployerFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("posted_date");
  const [sortOrder, setSortOrder] = useState("desc");

  // Build query params from filters
  const getQueryParams = () => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.append("status", statusFilter);
    if (activeFilter !== "all") params.append("active", activeFilter);
    if (featuredFilter === "true") params.append("featured", "true");
    if (employerFilter !== "all") params.append("employer_id", employerFilter);
    if (searchQuery) params.append("search", searchQuery);
    params.append("sort", sortBy);
    params.append("sortOrder", sortOrder);
    return params.toString();
  };

  // Fetch jobs with filters
  const { data: jobsData = [], isLoading, refetch } = useQuery({
    queryKey: [
      "/api/admin/jobs",
      statusFilter,
      activeFilter,
      featuredFilter,
      employerFilter,
      searchQuery,
      sortBy,
      sortOrder,
    ],
    queryFn: async () => {
      const params = getQueryParams();
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`/api/admin/jobs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return res.json();
    },
  });

  // Bulk approve mutation
  const bulkApproveMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("/api/admin/jobs/bulk-approve", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobIds: Array.from(selectedJobIds),
          notes: bulkApproveNotes || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Success",
        description: `Approved ${result.approvedCount} job(s)`,
      });
      setSelectedJobIds(new Set());
      setBulkApproveDialog(false);
      setBulkApproveNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete job mutation
  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`/api/admin/jobs/${jobId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete job");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Job deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle checkbox toggle
  const toggleJobSelection = (jobId: number) => {
    const newSelection = new Set(selectedJobIds);
    if (newSelection.has(jobId)) {
      newSelection.delete(jobId);
    } else {
      newSelection.add(jobId);
    }
    setSelectedJobIds(newSelection);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setStatusFilter("all");
    setActiveFilter("all");
    setFeaturedFilter("all");
    setEmployerFilter("all");
    setSearchQuery("");
    setSortBy("posted_date");
    setSortOrder("desc");
  };

  const hasPendingJobs = jobsData.some(
    (job: any) => !job.is_approved && job.is_active
  );

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Filter */}
            <div>
              <label className="text-sm font-medium mb-1 block">Active</label>
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Employer Filter */}
            <div>
              <label className="text-sm font-medium mb-1 block">Employer</label>
              <Select value={employerFilter} onValueChange={setEmployerFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employers</SelectItem>
                  {employersData?.map((emp: any) => (
                    <SelectItem key={emp.id} value={String(emp.id)}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div>
              <label className="text-sm font-medium mb-1 block">Sort</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="posted_date">Posted Date</SelectItem>
                  <SelectItem value="views">Views</SelectItem>
                  <SelectItem value="applications">Applications</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search Box */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-1 block">
              Search (title/location)
            </label>
            <Input
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Clear Filters Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            className="w-full"
          >
            Clear All Filters
          </Button>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedJobIds.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {selectedJobIds.size} job(s) selected
              </p>
              <Button
                onClick={() => setBulkApproveDialog(true)}
                disabled={bulkApproveMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {bulkApproveMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Approve Selected
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Approve Dialog */}
      <Dialog open={bulkApproveDialog} onOpenChange={setBulkApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve {selectedJobIds.size} Job(s)</DialogTitle>
            <DialogDescription>
              Add optional approval notes that will be attached to all selected
              jobs.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="e.g., Reviewed and approved for publication"
                value={bulkApproveNotes}
                onChange={(e) => setBulkApproveNotes(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkApproveDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => bulkApproveMutation.mutate()}
              disabled={bulkApproveMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {bulkApproveMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Approve All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Job Listings ({jobsData.length}) {hasPendingJobs && (
              <Badge variant="destructive" className="ml-2">
                {jobsData.filter((j: any) => !j.is_approved && j.is_active)
                  .length}{" "}
                Pending
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : jobsData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 w-8">
                      <Checkbox
                        checked={selectedJobIds.size === jobsData.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedJobIds(
                              new Set(jobsData.map((j: any) => j.id))
                            );
                          } else {
                            setSelectedJobIds(new Set());
                          }
                        }}
                      />
                    </th>
                    <th className="text-left p-3">Title</th>
                    <th className="text-left p-3">Employer</th>
                    <th className="text-left p-3">Location</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Approval</th>
                    <th className="text-left p-3">Views</th>
                    <th className="text-left p-3">Apps</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobsData.map((job: any) => (
                    <tr key={job.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <Checkbox
                          checked={selectedJobIds.has(job.id)}
                          onChange={() => toggleJobSelection(job.id)}
                        />
                      </td>
                      <td className="p-3 font-medium">{job.title}</td>
                      <td className="p-3">
                        {job.employer?.name || "N/A"}
                      </td>
                      <td className="p-3 text-sm">{job.location}</td>
                      <td className="p-3">
                        <Badge
                          variant={job.is_active ? "default" : "secondary"}
                        >
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
                      <td className="p-3 text-sm">{job.views_count || 0}</td>
                      <td className="p-3 text-sm">
                        {job.applications_count || 0}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingJob(job)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (
                                confirm(
                                  "Are you sure you want to delete this job?"
                                )
                              ) {
                                deleteJobMutation.mutate(job.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
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
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No jobs found matching your filters</p>
              {searchQuery || statusFilter !== "all" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Edit Dialog */}
      {editingJob && (
        <JobEditDialog
          job={editingJob}
          onClose={() => setEditingJob(null)}
          onSuccess={() => {
            setEditingJob(null);
            queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs"] });
          }}
        />
      )}
    </div>
  );
}
