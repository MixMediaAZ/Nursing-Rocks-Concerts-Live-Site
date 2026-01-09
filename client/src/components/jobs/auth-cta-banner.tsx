import { Lock, UserPlus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AuthCTABannerProps {
  jobCount?: number;
}

export function AuthCTABanner({ jobCount = 0 }: AuthCTABannerProps) {
  return (
    <Card className="sticky top-20 z-40 border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 shadow-lg">
      <CardContent className="py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center md:text-left">
            <div className="hidden md:flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                Sign up free to apply to nursing jobs
              </h3>
              <p className="text-sm text-gray-600">
                {jobCount > 0 ? `${jobCount} jobs available` : "Access full job details and apply instantly"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = "/login?redirect=/jobs"}
              className="gap-2"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
            <Button 
              onClick={() => window.location.href = "/register?redirect=/jobs"}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Create Free Account
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

