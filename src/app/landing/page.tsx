'use client';

import { useUser } from "@/firebase";
import LandingPage from "@/components/landing-page";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShellSkeleton } from "@/components/app-shell-skeleton";

export default function LandingRootPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
      // If the user is logged in, redirect them to the dashboard.
      if (user) {
          router.replace('/');
      }
  }, [user, router]);

  if (loading || user) {
    return <AppShellSkeleton />;
  }

  return <LandingPage />;
}
