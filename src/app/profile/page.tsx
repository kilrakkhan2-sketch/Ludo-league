
import { AppShell } from "@/components/app-shell";

export default function ProfilePage() {
  return (
    <AppShell>
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Profile</h1>
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <h2 className="text-xl font-semibold text-muted-foreground">Coming Soon!</h2>
                <p className="text-muted-foreground mt-2">View your stats, update your profile, and see your match history. This page is under construction.</p>
            </div>
        </div>
    </AppShell>
  );
}
