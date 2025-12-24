import { AppShell } from "@/components/layout/AppShell";
import LandingPage from "@/components/landing-page";
import { cookies } from "next/headers";
import DashboardPage from "./dashboard/page";

export default function RootPage() {
  const cookieStore = cookies();
  const isLoggedIn = cookieStore.get('firebaseIdToken');

  if (isLoggedIn) {
    return <DashboardPage />;
  }

  return <LandingPage />;
}
