
import { Badge } from "./ui/badge";
import { MatchStatus } from "@/types";

interface MatchStatusBadgeProps {
  status: MatchStatus;
}

export function MatchStatusBadge({ status }: MatchStatusBadgeProps) {
  const statusStyles: Record<MatchStatus, string> = {
    open: "bg-green-500",
    waiting: "bg-gray-500",
    room_code_pending: "bg-blue-400",
    room_code_shared: "bg-blue-500",
    game_started: "bg-blue-600",
    result_submitted: "bg-yellow-400",
    verification: "bg-yellow-500",
    AUTO_VERIFIED: "bg-purple-500",
    FLAGGED: "bg-orange-500",
    COMPLETED: "bg-purple-600",
    PAID: "bg-green-600",
    disputed: "bg-orange-600",
    cancelled: "bg-red-500",
  };

  return (
    <Badge className={`${statusStyles[status]} text-white`}>
      {status.replace(/_/g, ' ').toUpperCase()}
    </Badge>
  );
}
