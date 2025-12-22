
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
  const [count, setCount] = useState(0); // Add count state
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
    
    const constraints: QueryConstraint[] = [];
    let queryIsValid = true;

    if (optionsMemo?.where) {
        const whereClauses = (Array.isArray(optionsMemo.where[0]) ? optionsMemo.where : [optionsMemo.where]) as WhereClause[];
        
        for (const w of whereClauses) {
            const [_field, op, value] = w;
            if ( (op === 'in' || op === 'not-in' || op === 'array-contains-any') && (!Array.isArray(value) || value.length === 0) ) {
                queryIsValid = false;
                break;
            }
            constraints.push(where(...w));
        }
    }
    
    if (!queryIsValid) {
        return null;
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
    
    const collectionRef = optionsMemo?.isCollectionGroup ? collectionGroup(db, path) : collection(db, path);

    // If there are no constraints, just return the base collection reference
    if (constraints.length === 0) {
        return collectionRef;
    }

    return query(collectionRef, ...constraints);
  }, [db, path, optionsMemo]);

  useEffect(() => {
    setLoading(true);
    // If a query depends on a value that isn't ready (like a user UID), the where clause might be undefined.
    // In that case, we should not proceed. `buildQuery` will return null.
    if (!path || (options?.where && !options.where)) {
        setData([]);
        setCount(0);
        setLoading(false);
        return;
    }


    const q = buildQuery();

    if (!q) {
      setData([]);
      setCount(0);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const result: T[] = [];
        querySnapshot.forEach((doc) => {
            result.push({ id: doc.id, ...doc.data() } as T);
        });
        setData(result);
        setCount(querySnapshot.size); // Update count on every snapshot
        setLoading(false);
        setError(null);
    }, (err: any) => {
      if (err.message && !err.message.includes("Query requires an index")) {
          console.error(`Error fetching collection from path: ${path}`, err);
      }
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [buildQuery, path, optionsMemo]);

  return { data, count, loading, error };
}
