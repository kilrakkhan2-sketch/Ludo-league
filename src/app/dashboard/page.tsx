
'use client';

import { AppShell } from "@/components/layout/AppShell";
import DashboardClientContent from "./components/DashboardClientContent";
import NewsCarousel from "./components/NewsCarousel";


export default function DashboardPage() {
    return (
        <AppShell>
            <div className="space-y-8">
                <DashboardClientContent />
                <NewsCarousel />
            </div>
        </AppShell>
    );
}
