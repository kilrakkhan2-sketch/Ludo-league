
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the settings page, which serves as the profile page
    router.replace('/settings');
  }, [router]);

  // Render nothing, or a loading spinner
  return null;
}
