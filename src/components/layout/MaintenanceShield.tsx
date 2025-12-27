'use client';

import { useDoc, useUser } from "@/firebase";
import { MaintenanceSettings } from "@/types";
import { Skeleton } from "../ui/skeleton";
import { PowerOff } from "lucide-react";
import Image from "next/image";
import NewMaintenanceScreen from './NewMaintenanceScreen';

const ADMIN_ROLES = ['superadmin', 'deposit_admin', 'withdrawal_admin', 'match_admin'];

const FullScreenLoader = () => (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <div className="p-2 rounded-lg mb-4">
            <Image src="https://firebasestorage.googleapis.com/v0/b/studio-4431476254-c1156.appspot.com/o/appImages%2F26323-removebg-preview.png?alt=media&token=6ffa1383-0a70-44ca-acce-98d738ef99ed" alt="LudoLeague Logo" width={40} height={40} />
        </div>
        <p className="text-muted-foreground">Loading application...</p>
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
    const { data: settings, loading: settingsLoading } = useDoc<MaintenanceSettings>('settings/maintenance');
    const { userData, loading: userLoading } = useUser();

    const isLoading = settingsLoading || userLoading;
    const isMaintenanceMode = settings?.isAppDisabled;
    const isAdmin = userData?.role && ADMIN_ROLES.includes(userData.role);

    if (isLoading) {
        return <FullScreenLoader />;
    }

    if (isMaintenanceMode && !isAdmin) {
        return <NewMaintenanceScreen />;
    }

    return <>{children}</>;
}
