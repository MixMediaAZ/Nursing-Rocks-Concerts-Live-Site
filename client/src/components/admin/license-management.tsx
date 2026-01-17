import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, FileCheck, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const US_STATES = [
  { value: "all", label: "All States" },
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "DC", label: "District of Columbia" },
];

interface License {
  id: number;
  user_id: number;
  license_number: string;
  state: string;
  expiration_date: string;
  status: string;
  verification_date: string | null;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export function LicenseManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedState, setSelectedState] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch all licenses
  const { data: licenses, isLoading, refetch } = useQuery<License[]>({
    queryKey: ["/api/admin/licenses"],
    queryFn: async () => {
      const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
      const response = await fetch("/api/admin/licenses", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch licenses");
      return response.json();
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  // Update license status mutation
  const updateLicenseMutation = useMutation({
    mutationFn: async ({ licenseId, status }: { licenseId: number; status: string }) => {
      const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
      const response = await fetch(`/api/admin/licenses/${licenseId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update license");
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "License Updated",
        description: `License ${variables.status === "approved" ? "approved" : "rejected"} successfully.`,
      });
      refetch();
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update license status",
        variant: "destructive",
      });
    },
  });

  // Filter licenses
  const filteredLicenses = licenses?.filter((license) => {
    const stateMatch = selectedState === "all" || license.state === selectedState;
    const statusMatch = selectedStatus === "all" || license.status === selectedStatus;
    const searchMatch =
      searchTerm === "" ||
      license.license_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return stateMatch && statusMatch && searchMatch;
  });

  // Group by state for statistics
  const licensesByState = licenses?.reduce((acc, license) => {
    if (!acc[license.state]) {
      acc[license.state] = { total: 0, pending: 0, approved: 0 };
    }
    acc[license.state].total++;
    if (license.status === "pending") acc[license.state].pending++;
    if (license.status === "approved") acc[license.state].approved++;
    return acc;
  }, {} as Record<string, { total: number; pending: number; approved: number }>);

  const totalLicenses = licenses?.length || 0;
  const pendingLicenses = licenses?.filter((l) => l.status === "pending").length || 0;
  const approvedLicenses = licenses?.filter((l) => l.status === "approved").length || 0;

  const handleApproveLicense = (license: License) => {
    setSelectedLicense(license);
    setDialogOpen(true);
  };

  const confirmApprove = () => {
    if (selectedLicense) {
      updateLicenseMutation.mutate({ licenseId: selectedLicense.id, status: "approved" });
    }
  };

  const confirmReject = () => {
    if (selectedLicense) {
      updateLicenseMutation.mutate({ licenseId: selectedLicense.id, status: "rejected" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLicenses}</div>
            <p className="text-xs text-muted-foreground mt-1">All license submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingLicenses}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting verification</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedLicenses}</div>
            <p className="text-xs text-muted-foreground mt-1">Verified licenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Licenses
          </CardTitle>
          <CardDescription>Filter by state, status, or search by license number/email</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">State</label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {US_STATES.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="License # or Email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* License Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            License Submissions ({filteredLicenses?.length || 0})
          </CardTitle>
          <CardDescription>Manage nursing license verifications for ticket distribution</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLicenses && filteredLicenses.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nurse Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>License #</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLicenses.map((license) => (
                    <TableRow key={license.id}>
                      <TableCell className="font-medium">{license.user_name || "N/A"}</TableCell>
                      <TableCell>{license.user_email || "N/A"}</TableCell>
                      <TableCell className="font-mono text-sm">{license.license_number}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {US_STATES.find((s) => s.value === license.state)?.label || license.state}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(license.expiration_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {license.status === "pending" && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            Pending
                          </Badge>
                        )}
                        {license.status === "approved" && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Approved
                          </Badge>
                        )}
                        {license.status === "rejected" && (
                          <Badge variant="secondary" className="bg-red-100 text-red-800">
                            Rejected
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{new Date(license.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        {license.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApproveLicense(license)}
                          >
                            Review
                          </Button>
                        )}
                        {license.status !== "pending" && (
                          <span className="text-sm text-muted-foreground">
                            {license.verification_date
                              ? new Date(license.verification_date).toLocaleDateString()
                              : "N/A"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No licenses found matching your filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* License Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review License Submission</DialogTitle>
            <DialogDescription>
              Review the details below and approve or reject the license verification.
            </DialogDescription>
          </DialogHeader>
          {selectedLicense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nurse Name</label>
                  <p className="text-sm font-medium">{selectedLicense.user_name || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm font-medium">{selectedLicense.user_email || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">License Number</label>
                  <p className="text-sm font-medium font-mono">{selectedLicense.license_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">State</label>
                  <p className="text-sm font-medium">
                    {US_STATES.find((s) => s.value === selectedLicense.state)?.label || selectedLicense.state}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Expiration Date</label>
                  <p className="text-sm font-medium">
                    {new Date(selectedLicense.expiration_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Submitted</label>
                  <p className="text-sm font-medium">
                    {new Date(selectedLicense.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={updateLicenseMutation.isPending}
            >
              {updateLicenseMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </>
              )}
            </Button>
            <Button onClick={confirmApprove} disabled={updateLicenseMutation.isPending}>
              {updateLicenseMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

