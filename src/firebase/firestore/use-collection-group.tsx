'use client';

import { useState, useEffect, useMemo } from 'react';
import { collectionGroup, query, onSnapshot, orderBy, where, limit, QueryConstraint } from 'firebase/firestore';
import { useFirebase } from '../provider';
import { FirebaseError } from 'firebase/app';

type WhereClause = readonly [string, any, any];
type OrderByClause = readonly [string, 'asc' | 'desc'];

interface QueryOptions {
    where?: WhereClause | WhereClause[];
    orderBy?: OrderByClause | OrderByClause[];
    limit?: number;
}

export function useCollectionGroup<T extends { id: string }>(collectionId: string, options: QueryOptions = {}) {
  const { firestore } = useFirebase();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirebaseError | null>(null);

  const optionsMemo = useMemo(() => options, [
    JSON.stringify(options.where),
    JSON.stringify(options.orderBy),
    options.limit,
  ]);

  useEffect(() => {
    if (!firestore) return;

    setLoading(true);

    const constraints: QueryConstraint[] = [];

    if (optionsMemo.where) {
        if (Array.isArray(optionsMemo.where[0])) {
            (optionsMemo.where as WhereClause[]).forEach(w => constraints.push(where(...w)));
        } else {
            constraints.push(where(...(optionsMemo.where as WhereClause)));
        }
    }
    if (optionsMemo.orderBy) {
       if (Array.isArray(optionsMemo.orderBy[0])) {
            (optionsMemo.orderBy as OrderByClause[]).forEach(o => constraints.push(orderBy(o[0], o[1])));
        } else {
            constraints.push(orderBy(...(optionsMemo.orderBy as OrderByClause)));
        }
    }
    if (optionsMemo.limit) {
        constraints.push(limit(optionsMemo.limit));
    }

    const q = query(collectionGroup(firestore, collectionId), ...constraints);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const result: T[] = [];
        querySnapshot.forEach((doc) => {
            result.push({ id: doc.id, ...doc.data() } as T);
        });
        setData(result);
        setLoading(false);
    }, (err: any) => {
        console.error(`Error fetching collection group '${collectionId}':`, err);
        setError(err);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, collectionId, optionsMemo]);

  return { data, loading, error };
}
