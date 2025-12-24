
import LandingPage from "@/components/landing-page";

export default function RootPage() {
  // The root page now simply renders the static landing page.
  // The logic for redirecting logged-in vs. logged-out users
  // is handled by the individual pages and the AppShell.
  return <LandingPage />;
}
