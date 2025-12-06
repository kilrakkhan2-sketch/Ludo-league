
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

type WhereClause = readonly [string, "==" | "<" | ">" | "<=" | ">=" | "!=" | "array-contains" | "in" | "not-in", any];
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
            if ( (op === 'in' || op === 'not-in') && (!Array.isArray(value) || value.length === 0) ) {
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

    return () => unsubscribe();
  }, [buildQuery]);

  return { data, loading, error };
}
