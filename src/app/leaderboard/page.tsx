
import { AppShell } from "@/components/app-shell";

export default function LeaderboardPage() {
  return (
    <AppShell>
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Leaderboard</h1>
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <h2 className="text-xl font-semibold text-muted-foreground">Coming Soon!</h2>
                <p className="text-muted-foreground mt-2">See who's on top! The leaderboard is currently being polished.</p>
            </div>
        </div>
    </AppShell>
  );
}
