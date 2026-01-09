import { CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function VerifiedBadge() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 cursor-help">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified Nurse
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">
            Your applications are marked as priority for employers and you have access to exclusive verified-only job listings.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

