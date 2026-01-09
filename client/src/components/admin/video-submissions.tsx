import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Download, ExternalLink, Eye } from "lucide-react";
import { VideoSubmission } from "@shared/schema";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

export default function VideoSubmissions() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<VideoSubmission | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editStatus, setEditStatus] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery<{
    submissions: VideoSubmission[];
    count: number;
  }>({
    queryKey: ["/api/admin/video-submissions", { status: statusFilter !== "all" ? statusFilter : undefined }],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      const response = await fetch(`/api/admin/video-submissions?${params}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch video submissions");
      }
      return response.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: number; status?: string; admin_notes?: string }) => {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`/api/admin/video-submissions/${id}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, admin_notes }),
      });
      if (!response.ok) {
        throw new Error("Failed to update submission");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/video-submissions"] });
      toast({
        title: "Success",
        description: "Submission updated successfully.",
      });
      setDetailDialogOpen(false);
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: "Failed to update submission.",
        variant: "destructive",
      });
    },
  });

  const handleDownloadCsv = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch("/api/admin/video-submissions/export/csv", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to download CSV");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "video-submissions.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast({
        title: "Download Complete",
        description: "Video submissions CSV downloaded successfully.",
      });
    } catch (err) {
      console.error("Error downloading CSV:", err);
      toast({
        title: "Download Failed",
        description: "Could not download video submissions CSV.",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (submission: VideoSubmission) => {
    setSelectedSubmission(submission);
    setEditStatus(submission.status || "pending");
    setEditNotes(submission.admin_notes || "");
    setDetailDialogOpen(true);
  };

  const handleSaveChanges = () => {
    if (!selectedSubmission) return;
    updateMutation.mutate({
      id: selectedSubmission.id,
      status: editStatus,
      admin_notes: editNotes,
    });
  };

  const filteredSubmissions = data?.submissions.filter((sub) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      sub.name?.toLowerCase().includes(query) ||
      sub.email?.toLowerCase().includes(query) ||
      sub.nurse_name?.toLowerCase().includes(query)
    );
  }) || [];

  if (isLoading) {
    return <p>Loading video submissions...</p>;
  }

  if (isError) {
    return <p>Error: {error?.message || "Failed to load video submissions"}</p>;
  }

  return (
    <>
      <Card className="ui-frame-2026 ui-frame-surface-2026">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold ui-text-3d-10">Video Submissions</CardTitle>
          <Button onClick={handleDownloadCsv} className="flex items-center gap-2 ui-bevel-2026">
            <Download className="h-4 w-4" /> Download CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                type="text"
                placeholder="Search by name, email, or nurse name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ui-bevel-input-2026"
              />
            </div>
            <div className="w-full sm:w-48">
              <Label htmlFor="status-filter">Filter by Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" className="ui-bevel-input-2026">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Total submissions: {filteredSubmissions.length} {statusFilter !== "all" && `(${statusFilter})`}
          </p>

          {filteredSubmissions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="ui-text-3d-10">Name</TableHead>
                    <TableHead className="ui-text-3d-10">Email</TableHead>
                    <TableHead className="ui-text-3d-10">Nurse Name</TableHead>
                    <TableHead className="ui-text-3d-10">Message</TableHead>
                    <TableHead className="ui-text-3d-10">Status</TableHead>
                    <TableHead className="ui-text-3d-10">Submitted</TableHead>
                    <TableHead className="ui-text-3d-10">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>{submission.name || "Anonymous"}</TableCell>
                      <TableCell className="text-sm">{submission.email || "Not provided"}</TableCell>
                      <TableCell>{submission.nurse_name || "All nurses"}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {submission.message ? (
                          submission.message.length > 50
                            ? submission.message.substring(0, 50) + "..."
                            : submission.message
                        ) : (
                          <span className="text-muted-foreground italic">No message</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            submission.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : submission.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {submission.status || "pending"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {submission.submitted_at ? format(new Date(submission.submitted_at), "PPP") : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(submission)}
                          className="ui-bevel-2026"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No video submissions found.</p>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Video Submission Details</DialogTitle>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6">
              {/* Video Player */}
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                {selectedSubmission.resource_type === "video" ? (
                  <video src={selectedSubmission.video_url} controls className="w-full h-full" />
                ) : selectedSubmission.resource_type === "image" ? (
                  <img src={selectedSubmission.video_url} alt="Submission" className="w-full h-full object-contain" />
                ) : selectedSubmission.resource_type === "audio" ? (
                  <audio src={selectedSubmission.video_url} controls className="w-full" />
                ) : (
                  <div className="flex items-center justify-center h-full text-white">
                    <p>Media preview not available</p>
                  </div>
                )}
              </div>

              {/* Submission Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Name</Label>
                  <p className="text-sm">{selectedSubmission.name || "Anonymous"}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Email</Label>
                  <p className="text-sm">{selectedSubmission.email || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Location</Label>
                  <p className="text-sm">{selectedSubmission.location || "Not specified"}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Connection to Nursing</Label>
                  <p className="text-sm">{selectedSubmission.connection || "Not specified"}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Nurse Name</Label>
                  <p className="text-sm">{selectedSubmission.nurse_name || "All nurses"}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Submitted</Label>
                  <p className="text-sm">
                    {selectedSubmission.submitted_at
                      ? format(new Date(selectedSubmission.submitted_at), "PPP p")
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Consent Given</Label>
                  <p className="text-sm">{selectedSubmission.consent_given ? "Yes" : "No"}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Wants Updates</Label>
                  <p className="text-sm">{selectedSubmission.wants_updates ? "Yes" : "No"}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold">Message</Label>
                <p className="text-sm mt-1 p-3 bg-muted rounded-lg">
                  {selectedSubmission.message || <span className="text-muted-foreground italic">No message</span>}
                </p>
              </div>

              {/* Video Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-semibold">Public ID</Label>
                  <p className="text-xs text-muted-foreground break-all">{selectedSubmission.video_public_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Duration</Label>
                  <p className="text-sm">
                    {selectedSubmission.video_duration
                      ? `${Math.floor(selectedSubmission.video_duration / 60)}:${(
                          selectedSubmission.video_duration % 60
                        )
                          .toString()
                          .padStart(2, "0")}`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">File Size</Label>
                  <p className="text-sm">
                    {selectedSubmission.video_bytes
                      ? `${(selectedSubmission.video_bytes / (1024 * 1024)).toFixed(2)} MB`
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(selectedSubmission.video_url, "_blank")}
                  className="ui-bevel-2026"
                >
                  <ExternalLink className="h-4 w-4 mr-2" /> Open video
                </Button>
              </div>

              {/* Admin Controls */}
              <div className="border-t pt-4 space-y-4">
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger id="edit-status" className="ui-bevel-input-2026">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-notes">Admin Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Add internal notes about this submission..."
                    rows={4}
                    className="ui-bevel-input-2026"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveChanges}
                    disabled={updateMutation.isPending}
                    className="ui-bevel-2026"
                  >
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

