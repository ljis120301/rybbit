import { Badge } from "./ui/badge";
import { UserCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface IdentifiedBadgeProps {
  className?: string;
}

export function IdentifiedBadge({ className }: IdentifiedBadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="success" className={className}>
          <UserCheck className="w-3 h-3 mr-1" />
          Identified
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>This user has been identified via the identify() API</p>
      </TooltipContent>
    </Tooltip>
  );
}
