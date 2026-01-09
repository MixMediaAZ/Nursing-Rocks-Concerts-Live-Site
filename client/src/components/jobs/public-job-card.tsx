import { Clock, MapPin, Lock } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PublicJobCardProps {
  job: {
    id: number;
    title: string;
    location: string;
    posted_date: string | Date;
    specialty?: string;
    job_type?: string;
  };
  onSignInClick: () => void;
}

export function PublicJobCard({ job, onSignInClick }: PublicJobCardProps) {
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

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-200 border-gray-200">
      {/* Subtle blur overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-50/50 pointer-events-none" />
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xl font-bold text-gray-900">
            {job.title}
          </CardTitle>
          <Lock className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
        </div>
        
        <div className="flex flex-wrap gap-2 mt-2">
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
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center text-gray-600">
          <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="text-sm font-medium">{job.location}</span>
        </div>
        
        <div className="flex items-center text-gray-500">
          <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="text-sm">Posted {getTimeAgo(job.posted_date)}</span>
        </div>
        
        {/* Teaser for hidden content */}
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-sm text-gray-500 italic flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Sign in to view employer, salary, and full job details
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 pt-4">
        <Button 
          onClick={onSignInClick} 
          className="w-full"
          size="lg"
        >
          Sign In to View Details
        </Button>
        <p className="text-xs text-center text-gray-500">
          Don't have an account?{" "}
          <a 
            href="/register" 
            className="text-primary hover:underline font-medium"
          >
            Create free account
          </a>
        </p>
      </CardFooter>
    </Card>
  );
}

