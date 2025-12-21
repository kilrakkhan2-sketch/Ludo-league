
'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getCountFromServer, QueryConstraint } from 'firebase/firestore';
import { useFirebase } from '../provider';
import { FirebaseError } from 'firebase/app';

interface UseCollectionCountResult {
  count: number;
  loading: boolean;
  error: FirebaseError | null;
}

type WhereClause = readonly [string, any, any];

interface QueryOptions {
    where?: WhereClause | WhereClause[];
}

export function useCollectionCount(collectionName: string, options: QueryOptions = {}): UseCollectionCountResult {
  const { firestore } = useFirebase();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirebaseError | null>(null);

  const optionsMemo = useMemo(() => options, [JSON.stringify(options.where)]);

  useEffect(() => {
    if (!firestore) {
        setLoading(false);
        return;
    };
    
    setLoading(true);

    const getCount = async () => {
      try {
        const constraints: QueryConstraint[] = [];
        if (optionsMemo.where) {
            if (Array.isArray(optionsMemo.where[0])) {
                (optionsMemo.where as WhereClause[]).forEach(w => constraints.push(where(...w)));
            } else {
                constraints.push(where(...(optionsMemo.where as WhereClause)));
            }
        }

        const coll = collection(firestore, collectionName);
        const q = query(coll, ...constraints);
        const snapshot = await getCountFromServer(q);
        setCount(snapshot.data().count);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    getCount();
  }, [collectionName, firestore, optionsMemo]);

  return { count, loading, error };
}
