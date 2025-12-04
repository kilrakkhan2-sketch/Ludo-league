'use client';

import { useState, useEffect } from 'react';
import { collection, getCountFromServer } from 'firebase/firestore';
import { useFirebase } from '../provider';
import { FirebaseError } from 'firebase/app';

interface UseCollectionCountResult {
  count: number;
  loading: boolean;
  error: FirebaseError | null;
}

export function useCollectionCount(collectionName: string): UseCollectionCountResult {
  const { firestore } = useFirebase();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirebaseError | null>(null);

  useEffect(() => {
    const getCount = async () => {
      try {
        if (!firestore) throw new Error('Firestore not initialized');
        const coll = collection(firestore, collectionName);
        const snapshot = await getCountFromServer(coll);
        setCount(snapshot.data().count);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    getCount();
  }, [collectionName, firestore]);

  return { count, loading, error };
}
