
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  collection,
  onSnapshot,
  Query,
  DocumentData,
  query,
  where,
  limit,
  orderBy,
  collectionGroup,
  QueryConstraint,
} from "firebase/firestore";
import { useFirestore } from "../provider";

type WhereClause = readonly [string, "==" | "<" | ">" | "<=" | ">=" | "!=" | "array-contains" | "array-contains-any" | "in" | "not-in", any];
type OrderByClause = readonly [string, "asc" | "desc"];

interface UseCollectionOptions {
  where?: WhereClause | WhereClause[];
  orderBy?: OrderByClause | OrderByClause[];
  limit?: number;
  isCollectionGroup?: boolean;
}

export function useCollection<T extends { id: string }>(path: string, options?: UseCollectionOptions) {
  const db = useFirestore();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Memoize options to prevent re-renders from object recreation
  const optionsMemo = useMemo(() => options, [
      JSON.stringify(options?.where),
      JSON.stringify(options?.orderBy),
      options?.limit,
      options?.isCollectionGroup
  ]);

  const buildQuery = useCallback(() => {
    if (!path || !db) {
        return null;
    }
    let q: Query<DocumentData> = optionsMemo?.isCollectionGroup ? collectionGroup(db, path) : collection(db, path);
    const constraints: QueryConstraint[] = [];

    if (optionsMemo?.where) {
        const whereClauses = Array.isArray(optionsMemo.where[0]) ? (optionsMemo.where as WhereClause[]) : ([optionsMemo.where] as WhereClause[]);
        
        for (const w of whereClauses) {
            const [field, op, value] = w;
            // Firestore 'in' and 'not-in' queries require a non-empty array.
            if ( (op === 'in' || op === 'not-in' || op === 'array-contains-any') && (!Array.isArray(value) || value.length === 0) ) {
                // Return null to signify an invalid query that should not be run.
                // This prevents Firestore from throwing an error.
                return null;
            }
            constraints.push(where(field, op, value));
        }
    }
    if (optionsMemo?.orderBy) {
       if (Array.isArray(optionsMemo.orderBy[0])) {
            (optionsMemo.orderBy as OrderByClause[]).forEach(o => constraints.push(orderBy(o[0], o[1])));
        } else {
            const o = optionsMemo.orderBy as OrderByClause;
            constraints.push(orderBy(o[0], o[1]));
        }
    }
    if (optionsMemo?.limit) {
        constraints.push(limit(optionsMemo.limit));
    }

    return query(q, ...constraints);
  }, [db, path, optionsMemo]);

  useEffect(() => {
    setLoading(true);
    const q = buildQuery();

    // If the query is invalid (e.g., 'in' with an empty array), don't execute it.
    if (!q) {
      setData([]);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const result: T[] = [];
        querySnapshot.forEach((doc) => {
            result.push({ id: doc.id, ...doc.data() } as T);
        });
        setData(result);
        setLoading(false);
        setError(null);
    }, (err: any) => {
      console.error(err);
      setError(err);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [buildQuery]);

  return { data, loading, error };
}
