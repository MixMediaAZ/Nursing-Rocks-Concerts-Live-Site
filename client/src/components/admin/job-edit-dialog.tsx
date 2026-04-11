import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function JobEditDialog({
  job,
  onClose,
  onSuccess,
}: {
  job: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: job.title || "",
    description: job.description || "",
    location: job.location || "",
    job_type: job.job_type || "",
    work_arrangement: job.work_arrangement || "",
    specialty: job.specialty || "",
    experience_level: job.experience_level || "",
    salary_min: job.salary_min || "",
    salary_max: job.salary_max || "",
    salary_period: job.salary_period || "annual",
    responsibilities: job.responsibilities || "",
    requirements: job.requirements || "",
    benefits: job.benefits || "",
    shift_type: job.shift_type || "",
    contact_email: job.contact_email || "",
    application_url: job.application_url || "",
    is_featured: job.is_featured || false,
    certification_required: (job.certification_required || []).join(", "),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("adminToken");
      const payload = {
        ...formData,
        salary_min: formData.salary_min
          ? parseFloat(formData.salary_min)
          : undefined,
        salary_max: formData.salary_max
          ? parseFloat(formData.salary_max)
          : undefined,
        certification_required: formData.certification_required
          .split(",")
          .map((c: string) => c.trim())
          .filter((c: string) => c),
      };

      const res = await fetch(`/api/admin/jobs/${job.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update job");
      }

      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Job updated successfully" });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Job: {job.title}</DialogTitle>
          <DialogDescription>
            Update job details. Approval status cannot be changed here.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* Title */}
          <div className="col-span-2">
            <Label htmlFor="title">Job Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div className="col-span-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="mt-1"
            />
          </div>

          {/* Job Type */}
          <div>
            <Label htmlFor="job_type">Job Type *</Label>
            <Select
              value={formData.job_type}
              onValueChange={(value) =>
                setFormData({ ...formData, job_type: value })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Full-time">Full-time</SelectItem>
                <SelectItem value="Part-time">Part-time</SelectItem>
                <SelectItem value="Contract">Contract</SelectItem>
                <SelectItem value="Per Diem">Per Diem</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Work Arrangement */}
          <div>
            <Label htmlFor="work_arrangement">Work Arrangement *</Label>
            <Select
              value={formData.work_arrangement}
              onValueChange={(value) =>
                setFormData({ ...formData, work_arrangement: value })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="On-site">On-site</SelectItem>
                <SelectItem value="Remote">Remote</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Specialty */}
          <div>
            <Label htmlFor="specialty">Specialty *</Label>
            <Input
              id="specialty"
              value={formData.specialty}
              onChange={(e) =>
                setFormData({ ...formData, specialty: e.target.value })
              }
              className="mt-1"
            />
          </div>

          {/* Experience Level */}
          <div>
            <Label htmlFor="experience_level">Experience Level *</Label>
            <Select
              value={formData.experience_level}
              onValueChange={(value) =>
                setFormData({ ...formData, experience_level: value })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Entry">Entry Level</SelectItem>
                <SelectItem value="Mid">Mid Level</SelectItem>
                <SelectItem value="Senior">Senior Level</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Salary Min */}
          <div>
            <Label htmlFor="salary_min">Salary Min ($)</Label>
            <Input
              id="salary_min"
              type="number"
              value={formData.salary_min}
              onChange={(e) =>
                setFormData({ ...formData, salary_min: e.target.value })
              }
              className="mt-1"
            />
          </div>

          {/* Salary Max */}
          <div>
            <Label htmlFor="salary_max">Salary Max ($)</Label>
            <Input
              id="salary_max"
              type="number"
              value={formData.salary_max}
              onChange={(e) =>
                setFormData({ ...formData, salary_max: e.target.value })
              }
              className="mt-1"
            />
          </div>

          {/* Salary Period */}
          <div>
            <Label htmlFor="salary_period">Salary Period</Label>
            <Select
              value={formData.salary_period}
              onValueChange={(value) =>
                setFormData({ ...formData, salary_period: value })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="annual">Annual</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Shift Type */}
          <div>
            <Label htmlFor="shift_type">Shift Type</Label>
            <Input
              id="shift_type"
              value={formData.shift_type}
              onChange={(e) =>
                setFormData({ ...formData, shift_type: e.target.value })
              }
              placeholder="e.g., Day, Night, Rotating"
              className="mt-1"
            />
          </div>

          {/* Responsibilities */}
          <div className="col-span-2">
            <Label htmlFor="responsibilities">Responsibilities</Label>
            <Textarea
              id="responsibilities"
              value={formData.responsibilities}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  responsibilities: e.target.value,
                })
              }
              className="mt-1"
              rows={2}
            />
          </div>

          {/* Requirements */}
          <div className="col-span-2">
            <Label htmlFor="requirements">Requirements</Label>
            <Textarea
              id="requirements"
              value={formData.requirements}
              onChange={(e) =>
                setFormData({ ...formData, requirements: e.target.value })
              }
              className="mt-1"
              rows={2}
            />
          </div>

          {/* Benefits */}
          <div className="col-span-2">
            <Label htmlFor="benefits">Benefits</Label>
            <Textarea
              id="benefits"
              value={formData.benefits}
              onChange={(e) =>
                setFormData({ ...formData, benefits: e.target.value })
              }
              className="mt-1"
              rows={2}
            />
          </div>

          {/* Certifications */}
          <div className="col-span-2">
            <Label htmlFor="certification_required">
              Certifications (comma-separated)
            </Label>
            <Input
              id="certification_required"
              value={formData.certification_required}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  certification_required: e.target.value,
                })
              }
              placeholder="e.g., RN, BSN, ACLS"
              className="mt-1"
            />
          </div>

          {/* Contact Email */}
          <div>
            <Label htmlFor="contact_email">Contact Email</Label>
            <Input
              id="contact_email"
              type="email"
              value={formData.contact_email}
              onChange={(e) =>
                setFormData({ ...formData, contact_email: e.target.value })
              }
              className="mt-1"
            />
          </div>

          {/* Application URL */}
          <div>
            <Label htmlFor="application_url">Application URL</Label>
            <Input
              id="application_url"
              value={formData.application_url}
              onChange={(e) =>
                setFormData({ ...formData, application_url: e.target.value })
              }
              className="mt-1"
            />
          </div>

          {/* Featured */}
          <div className="col-span-2 flex items-center gap-2">
            <Checkbox
              id="is_featured"
              checked={formData.is_featured}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_featured: Boolean(checked) })
              }
            />
            <Label htmlFor="is_featured">Mark as Featured</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
