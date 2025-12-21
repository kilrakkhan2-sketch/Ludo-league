
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

export function MaintenanceShield({ children }: { children: React.ReactNode }) {
    const { data: settings, loading } = useDoc<MaintenanceSettings>('settings/maintenance');

    if (loading) {
        return <FullScreenLoader />;
    }

    if (settings?.isAppDisabled) {
        return <MaintenanceScreen message={settings.appDisabledMessage} />;
    }

    return <>{children}</>;
}
