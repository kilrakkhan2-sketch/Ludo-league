
import { Badge } from "./ui/badge";
import { MatchStatus } from "@/types";

interface MatchStatusBadgeProps {
  status: MatchStatus;
}

export function MatchStatusBadge({ status }: MatchStatusBadgeProps) {
  const statusStyles: Record<MatchStatus, string> = {
    open: "bg-green-500",
    closed: "bg-gray-500",
    in_progress: "bg-blue-500",
    verification: "bg-yellow-500",
    completed: "bg-purple-500",
    cancelled: "bg-red-500",
    disputed: "bg-orange-500",
    pending: "bg-gray-500",
    result_submitted: "bg-blue-500",
  };

  return (
    <Badge className={`${statusStyles[status]} text-white`}>
      {status.replace(/_/g, ' ').toUpperCase()}
    </Badge>
  );
}
