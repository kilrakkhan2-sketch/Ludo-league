
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
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Memoize options to prevent re-renders from causing new query objects.
  // The stringify is a shallow but effective way to check for changes in nested arrays.
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
        // Ensure whereClauses is always an array of arrays
        const whereClauses = (Array.isArray(optionsMemo.where[0]) ? optionsMemo.where : [optionsMemo.where]) as WhereClause[];
        
        for (const w of whereClauses) {
            const [_field, op, value] = w;
            // Firestore 'in', 'not-in', and 'array-contains-any' queries require a non-empty array.
            // If the array is empty, the query is invalid and will throw an error.
            // We can short-circuit here and return no results.
            if ( (op === 'in' || op === 'not-in' || op === 'array-contains-any') && (!Array.isArray(value) || value.length === 0) ) {
                queryIsValid = false;
                break;
            }
            constraints.push(where(...w));
        }
    }
    
    // If a query is determined to be invalid (e.g., 'in' with empty array), stop here.
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

    return query(collectionRef, ...constraints);
  }, [db, path, optionsMemo]);

  useEffect(() => {
    setLoading(true);
    
    const q = buildQuery();

    // If the query is null (because it's invalid, e.g., 'in' with empty array),
    // set data to empty and stop loading.
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
        setCount(querySnapshot.size);
        setLoading(false);
        setError(null);
    }, (err: any) => {
      // Don't log expected "Query requires an index" errors, as they are part of Firebase's dev flow.
      if (err.message && !err.message.includes("Query requires an index")) {
          console.error(`Error fetching collection from path: ${path}`, err);
      }
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [buildQuery, path]); // Re-run effect only when the memoized query builder changes.

  return { data, count, loading, error };
}

    