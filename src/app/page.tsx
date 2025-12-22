
'use client';

import { useUser, useCollection, useFirestore } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import LandingPage from '@/components/landing-page';
import { AppShellSkeleton } from '@/components/app-shell-skeleton';
import { Match } from '@/types/match';
import DashboardClientContent from './dashboard/DashboardClientContent';

export default function HomePage() {
  const { user, loading: authLoading } = useUser();
  const firestore = useFirestore();

  const { data: matches, loading: matchesLoading, error: matchesError } = useCollection<Match>(
    'matches', { 
        where: ['status', '==', 'open'],
        orderBy: ['createdAt', 'desc'],
        limit: 20
    });
  
  if (authLoading) {
    return <AppShellSkeleton />;
  }
  
  if (matchesError) {
      console.error("Firestore Error fetching matches: ", matchesError);
  }

  if (user) {
    return (
        <DashboardClientContent />
    );
  }

  return <LandingPage />;
}
