'use client';

import { useEffect, useState } from 'react';
import { onIdTokenChanged, User } from 'firebase/auth';
import { useAuth } from '../provider';

interface AuthState {
  user: User | null;
  loading: boolean;
  claims: Record<string, any> | null;
}

export function useUser(): AuthState {
  const auth = useAuth();
  const [state, setState] = useState<AuthState>({
    user: auth.currentUser,
    loading: auth.currentUser === null, // Only loading if user is not already available
    claims: null,
  });

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        const tokenResult = await user.getIdTokenResult();
        setState({ user, loading: false, claims: tokenResult.claims });
      } else {
        setState({ user: null, loading: false, claims: null });
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth]);

  return state;
}
