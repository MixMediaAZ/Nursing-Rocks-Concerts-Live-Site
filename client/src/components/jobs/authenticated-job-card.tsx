import { Clock, MapPin, Building2, DollarSign, Heart, Sparkles, ChevronRight } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface AuthenticatedJobCardProps {
  job: {
    id: number;
    title: string;
    location: string;
    posted_date: string | Date;
    specialty?: string;
    job_type?: string;
    employer?: string;
    employer_id?: number;
    salary_min?: number;
    salary_max?: number;
    salary_period?: string;
    description?: string;
    experience_level?: string;
    shift_type?: string;
    is_featured?: boolean;
    verified_only?: boolean;
    has_applied?: boolean;
    is_saved?: boolean;
  };
  isVerified: boolean;
  onApply?: (jobId: number) => void;
  onSave?: (jobId: number) => void;
}

export function AuthenticatedJobCard({ job, isVerified, onApply, onSave }: AuthenticatedJobCardProps) {
  const [isSaved, setIsSaved] = useState(job.is_saved || false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const getTimeAgo = (date: string | Date) => {
    const now = new Date();
    const posted = new Date(date);
    const diffTime = Math.abs(now.getTime() - posted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return null;
    
    const formatNumber = (num: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(num);
    };

    const period = job.salary_period || 'year';
    
    if (job.salary_min && job.salary_max) {
      return `${formatNumber(job.salary_min)} - ${formatNumber(job.salary_max)}/${period}`;
    }
    if (job.salary_min) {
      return `From ${formatNumber(job.salary_min)}/${period}`;
    }
    if (job.salary_max) {
      return `Up to ${formatNumber(job.salary_max)}/${period}`;
    }
    return null;
  };

  const saveJobMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/jobs/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id }),
      });
      if (!response.ok) throw new Error("Failed to save job");
      return response.json();
    },
    onSuccess: () => {
      setIsSaved(!isSaved);
      toast({
        title: isSaved ? "Job removed from saved" : "Job saved",
        description: isSaved ? "Job removed from your saved list" : "Job added to your saved list",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/saved'] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save job. Please try again.",
      });
    },
  });

  const handleSaveClick = () => {
    if (onSave) {
      onSave(job.id);
    } else {
      saveJobMutation.mutate();
    }
  };

  const handleApplyClick = () => {
    if (onApply) {
      onApply(job.id);
    } else {
      navigate(`/jobs/${job.id}`);
    }
  };

  const salary = formatSalary();

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-gray-200 relative">
      {job.is_featured && (
        <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 px-3 py-1 text-xs font-bold rounded-bl-lg">
          FEATURED
        </div>
      )}
      
      {job.verified_only && (
        <div className="absolute top-0 left-0 bg-green-500 text-white px-3 py-1 text-xs font-bold rounded-br-lg flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          VERIFIED ONLY
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold text-gray-900 mb-2">
              {job.title}
            </CardTitle>
            
            {job.employer && (
              <div className="flex items-center text-gray-700 font-medium mb-2">
                <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm">{job.employer}</span>
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSaveClick}
            className={isSaved ? "text-red-500 hover:text-red-600" : "text-gray-400 hover:text-gray-600"}
            disabled={saveJobMutation.isPending}
          >
            <Heart className={`h-5 w-5 ${isSaved ? "fill-current" : ""}`} />
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {job.specialty && (
            <Badge variant="secondary" className="text-xs">
              {job.specialty}
            </Badge>
          )}
          {job.job_type && (
            <Badge variant="outline" className="text-xs">
              {job.job_type}
            </Badge>
          )}
          {job.experience_level && (
            <Badge variant="outline" className="text-xs">
              {job.experience_level}
            </Badge>
          )}
          {job.shift_type && (
            <Badge variant="outline" className="text-xs">
              {job.shift_type}
            </Badge>
          )}
          {isVerified && (
            <Badge className="bg-green-100 text-green-800 text-xs">
              Priority Application
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center text-gray-600">
          <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="text-sm font-medium">{job.location}</span>
        </div>
        
        {salary && (
          <div className="flex items-center text-gray-600">
            <DollarSign className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="text-sm font-medium">{salary}</span>
          </div>
        )}
        
        <div className="flex items-center text-gray-500">
          <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="text-sm">Posted {getTimeAgo(job.posted_date)}</span>
        </div>
        
        {job.description && (
          <p className="text-sm text-gray-600 line-clamp-3 mt-3">
            {job.description}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 pt-4">
        {job.has_applied ? (
          <Button 
            variant="outline" 
            className="flex-1"
            disabled
          >
            Applied
          </Button>
        ) : (
          <Button 
            onClick={handleApplyClick} 
            className="flex-1"
          >
            Apply Now
          </Button>
        )}
        <Button 
          variant="outline"
          onClick={() => navigate(`/jobs/${job.id}`)}
        >
          View Details
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}

