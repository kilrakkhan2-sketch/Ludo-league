'use client';

import { useDoc } from "@/firebase";
import { MaintenanceSettings } from "@/types";
import { Skeleton } from "../ui/skeleton";
import { PowerOff } from "lucide-react";
import Image from "next/image";

const FullScreenLoader = () => (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <div className="p-2 bg-primary rounded-lg mb-4">
            <Image src="/favicon.ico" alt="LudoLeague Logo" width={32} height={32} />
        </div>
        <p className="text-muted-foreground">Loading application...</p>
    </div>
);

const MaintenanceScreen = ({ message }: { message?: string }) => (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
        <div className="p-4 bg-destructive text-destructive-foreground rounded-full mb-6">
            <PowerOff className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-bold font-headline mb-2">Under Maintenance</h1>
        <p className="max-w-md text-muted-foreground">
            {message || "We are currently performing scheduled maintenance. We'll be back online shortly. Thank you for your patience."}
        </p>
    </div>
);

// Helper function to check if current time is within a disabled time range.
// Handles overnight ranges (e.g., 22:00 to 10:00).
export const isTimeInDisabledRange = (startTimeStr?: string, endTimeStr?: string): boolean => {
    if (!startTimeStr || !endTimeStr) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startHours, startMinutes] = startTimeStr.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;

    const [endHours, endMinutes] = endTimeStr.split(':').map(Number);
    const endTotalMinutes = endHours * 60 + endMinutes;

    // Case 1: Overnight range (e.g., 22:00 - 10:00)
    if (startTotalMinutes > endTotalMinutes) {
        return currentMinutes >= startTotalMinutes || currentMinutes < endTotalMinutes;
    } 
    // Case 2: Same-day range (e.g., 10:00 - 17:00)
    else {
        return currentMinutes >= startTotalMinutes && currentMinutes < endTotalMinutes;
    }
};


export function MaintenanceShield({ children }: { children: React.ReactNode }) {
    const { data: settings, loading } = useDoc<MaintenanceSettings>('settings/maintenance');

    if (loading) {
        return <FullScreenLoader />;
    }

    if (settings?.isAppDisabled) {
        return <MaintenanceScreen message={settings.appDisabledMessage} />;
    }

    // We can pass the settings down via context if multiple child components need them,
    // but for now, the check happens here and at the feature-specific pages.
    return <>{children}</>;
}
