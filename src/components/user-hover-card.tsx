
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useDoc } from "@/firebase";
import { UserProfile } from "@/types";

interface UserHoverCardProps {
  userId: string;
  children: React.ReactNode;
}

export function UserHoverCard({ userId, children }: UserHoverCardProps) {
  const { data: user, loading } = useDoc<UserProfile>(`users/${userId}`);

  return (
    <HoverCard>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-80">
        {loading && <p>Loading...</p>}
        {user && (
          <div className="flex justify-between space-x-4">
            <Avatar>
              <AvatarImage src={user.photoURL} />
              <AvatarFallback>{user.displayName[0]}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">{user.displayName}</h4>
              <p className="text-sm">
                The React Framework – created and maintained by @vercel.
              </p>
              <div className="flex items-center pt-2">
                <span className="text-xs text-muted-foreground">
                  Joined December 2021
                </span>
              </div>
            </div>
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
