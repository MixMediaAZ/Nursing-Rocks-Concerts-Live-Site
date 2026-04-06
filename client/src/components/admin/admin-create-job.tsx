import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { Briefcase } from "lucide-react";

export function AdminCreateJob() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    employer_id: "",
    title: "",
    description: "",
    location: "",
    job_type: "Full-time",
    work_arrangement: "On-site",
    specialty: "",
    experience_level: "Mid",
    responsibilities: "",
    requirements: "",
    benefits: "",
    education_required: "",
    certification_required: "",
    shift_type: "",
    salary_min: "",
    salary_max: "",
    salary_period: "annual",
    application_url: "",
    contact_email: "",
    expiry_date: "",
    is_featured: false,
  });

  // Fetch employers for dropdown
  const { data: employers = [] } = useQuery({
    queryKey: ["admin-employers"],
    queryFn: async () => {
      const response = await fetch("/api/admin/employers");
      if (!response.ok) throw new Error("Failed to fetch employers");
      return response.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      // Parse certifications if provided
      const certifications = data.certification_required
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c);

      const payload = {
        ...data,
        employer_id: parseInt(data.employer_id),
        certification_required: certifications.length > 0 ? certifications : undefined,
        salary_min: data.salary_min ? parseFloat(data.salary_min) : undefined,
        salary_max: data.salary_max ? parseFloat(data.salary_max) : undefined,
        is_featured: data.is_featured === true,
      };

      const response = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create job");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Job "${data.title}" created and auto-approved!`,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      setIsOpen(false);
      setForm({
        employer_id: "",
        title: "",
        description: "",
        location: "",
        job_type: "Full-time",
        work_arrangement: "On-site",
        specialty: "",
        experience_level: "Mid",
        responsibilities: "",
        requirements: "",
        benefits: "",
        education_required: "",
        certification_required: "",
        shift_type: "",
        salary_min: "",
        salary_max: "",
        salary_period: "annual",
        application_url: "",
        contact_email: "",
        expiry_date: "",
        is_featured: false,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.employer_id) {
      toast({ title: "Error", description: "Employer is required", variant: "destructive" });
      return;
    }
    if (!form.title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }
    if (!form.description.trim()) {
      toast({ title: "Error", description: "Description is required", variant: "destructive" });
      return;
    }
    if (!form.location.trim()) {
      toast({ title: "Error", description: "Location is required", variant: "destructive" });
      return;
    }
    if (!form.specialty.trim()) {
      toast({ title: "Error", description: "Specialty is required", variant: "destructive" });
      return;
    }

    mutation.mutate(form);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            <div>
              <CardTitle>Create Job Listing</CardTitle>
              <CardDescription>Post a new job (free, auto-approved)</CardDescription>
            </div>
          </div>
          {!isOpen && (
            <Button onClick={() => setIsOpen(true)} variant="outline">
              Post Job
            </Button>
          )}
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Employer Selection */}
            <div>
              <Label htmlFor="employer_id">Employer *</Label>
              <Select value={form.employer_id} onValueChange={(value) => setForm({ ...form, employer_id: value })}>
                <SelectTrigger id="employer_id">
                  <SelectValue placeholder="Select an employer" />
                </SelectTrigger>
                <SelectContent>
                  {employers.map((emp: any) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.company_name || emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  placeholder="Registered Nurse"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="Phoenix, AZ"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="specialty">Specialty *</Label>
                <Input
                  id="specialty"
                  placeholder="ICU, ER, Pediatrics, etc."
                  value={form.specialty}
                  onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="job_type">Job Type *</Label>
                <Select value={form.job_type} onValueChange={(value) => setForm({ ...form, job_type: value })}>
                  <SelectTrigger id="job_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Temporary">Temporary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="work_arrangement">Work Arrangement *</Label>
                <Select value={form.work_arrangement} onValueChange={(value) => setForm({ ...form, work_arrangement: value })}>
                  <SelectTrigger id="work_arrangement">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="On-site">On-site</SelectItem>
                    <SelectItem value="Remote">Remote</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="experience_level">Experience Level *</Label>
                <Select value={form.experience_level} onValueChange={(value) => setForm({ ...form, experience_level: value })}>
                  <SelectTrigger id="experience_level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entry">Entry Level</SelectItem>
                    <SelectItem value="Mid">Mid Level</SelectItem>
                    <SelectItem value="Senior">Senior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Descriptions */}
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Detailed job description..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="responsibilities">Responsibilities</Label>
              <Textarea
                id="responsibilities"
                placeholder="Key responsibilities..."
                value={form.responsibilities}
                onChange={(e) => setForm({ ...form, responsibilities: e.target.value })}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                placeholder="Required qualifications..."
                value={form.requirements}
                onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="benefits">Benefits</Label>
              <Textarea
                id="benefits"
                placeholder="Benefits offered..."
                value={form.benefits}
                onChange={(e) => setForm({ ...form, benefits: e.target.value })}
                rows={2}
              />
            </div>

            {/* Salary & Details */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="salary_min">Salary Min</Label>
                <Input
                  id="salary_min"
                  type="number"
                  placeholder="65000"
                  value={form.salary_min}
                  onChange={(e) => setForm({ ...form, salary_min: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="salary_max">Salary Max</Label>
                <Input
                  id="salary_max"
                  type="number"
                  placeholder="85000"
                  value={form.salary_max}
                  onChange={(e) => setForm({ ...form, salary_max: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="salary_period">Salary Period</Label>
                <Select value={form.salary_period} onValueChange={(value) => setForm({ ...form, salary_period: value })}>
                  <SelectTrigger id="salary_period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="shift_type">Shift Type</Label>
                <Select value={form.shift_type} onValueChange={(value) => setForm({ ...form, shift_type: value })}>
                  <SelectTrigger id="shift_type">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    <SelectItem value="Day">Day</SelectItem>
                    <SelectItem value="Night">Night</SelectItem>
                    <SelectItem value="Rotating">Rotating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="education_required">Education Required</Label>
                <Input
                  id="education_required"
                  placeholder="BSN preferred"
                  value={form.education_required}
                  onChange={(e) => setForm({ ...form, education_required: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="certification_required">Certifications (comma-separated)</Label>
                <Input
                  id="certification_required"
                  placeholder="ACLS, BLS, RN License"
                  value={form.certification_required}
                  onChange={(e) => setForm({ ...form, certification_required: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="application_url">Application URL</Label>
                <Input
                  id="application_url"
                  placeholder="https://apply.example.com"
                  value={form.application_url}
                  onChange={(e) => setForm({ ...form, application_url: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  placeholder="hr@company.com"
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="expiry_date">Expiry Date</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={form.expiry_date}
                  onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  id="is_featured"
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="is_featured" className="font-normal cursor-pointer">
                  Featured listing
                </Label>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Creating..." : "Post Job"}
              </Button>
            </div>
          </form>
        </CardContent>
      )}
    </Card>
  );
}
