'use client';

import { useState, useEffect } from 'react';
import { collectionGroup, query, onSnapshot, getDocs, orderBy, where, limit } from 'firebase/firestore';
import { useFirebase } from '../provider';
import { FirebaseError } from 'firebase/app';

interface QueryOptions {
    where?: [string, any, any];
    orderBy?: [string, 'asc' | 'desc'];
    limit?: number;
}

export function useCollectionGroup<T>(collectionId: string, options: QueryOptions = {}) {
  const { firestore } = useFirebase();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirebaseError | null>(null);

  useEffect(() => {
    if (!firestore) return;

    const q = query(
        collectionGroup(firestore, collectionId),
        ...(options.where ? [where(...options.where)] : []),
        ...(options.orderBy ? [orderBy(...options.orderBy)] : []),
        ...(options.limit ? [limit(options.limit)] : [])
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const result: T[] = [];
        querySnapshot.forEach((doc) => {
            result.push({ id: doc.id, ...doc.data() } as T);
        });
        setData(result);
        setLoading(false);
    }, (err: any) => {
        setError(err);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, collectionId, options.where, options.orderBy, options.limit]);

  return { data, loading, error };
}
