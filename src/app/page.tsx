
'use client';

import { useUser } from "@/firebase";
import LandingPage from "@/components/landing-page";
import DashboardPage from "./dashboard/page";
import { AppShellSkeleton } from "@/components/app-shell-skeleton";

export default function RootPage() {
  const { user, loading } = useUser();

  if (loading) {
    return <AppShellSkeleton />;
  }

  if (user) {
    return <DashboardPage />;
  }

  return <LandingPage />;
}
