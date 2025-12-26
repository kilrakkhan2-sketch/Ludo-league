'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { AppShell } from "@/components/layout/AppShell";
import DashboardClientContent from "./dashboard/components/DashboardClientContent";
import NewsCarousel from "./dashboard/components/NewsCarousel";
import { AppShellSkeleton } from '@/components/app-shell-skeleton';


export default function DashboardPage() {
    const { user, loading } = useUser();
    const router = useRouter();

    useEffect(() => {
        // If not loading and no user, redirect to the landing page.
        if (!loading && !user) {
            router.replace('/landing');
        }
    }, [user, loading, router]);

    // Show a skeleton while checking for auth state
    if (loading || !user) {
        return <AppShellSkeleton />;
    }

    // If user is logged in, show the dashboard content.
    return (
        <AppShell>
            <div className="space-y-8">
                <DashboardClientContent />
                <NewsCarousel />
            </div>
        </AppShell>
    );
}
