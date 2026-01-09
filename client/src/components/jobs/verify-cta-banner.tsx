import { Sparkles, CheckCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface VerifyCTABannerProps {
  verifiedOnlyJobCount?: number;
}

export function VerifyCTABanner({ verifiedOnlyJobCount = 0 }: VerifyCTABannerProps) {
  return (
    <Card className="border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50 shadow-lg mb-6">
      <CardContent className="py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center md:text-left">
            <div className="hidden md:flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400/20">
              <Sparkles className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                <h3 className="font-bold text-lg text-gray-900">
                  Get Priority on Applications
                </h3>
                <Badge className="bg-green-500 text-white">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              </div>
              <p className="text-sm text-gray-700">
                Verify your nursing license to unlock priority applications
                {verifiedOnlyJobCount > 0 && ` and access ${verifiedOnlyJobCount} exclusive verified-only jobs`}
              </p>
            </div>
          </div>
          
          <Button 
            onClick={() => window.location.href = "/license-verification"}
            className="gap-2 bg-yellow-600 hover:bg-yellow-700 flex-shrink-0"
          >
            <CheckCircle className="h-4 w-4" />
            Verify License
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

