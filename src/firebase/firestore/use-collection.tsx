"use client";

import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  Query,
  DocumentData,
  query,
  where,
  limit,
  orderBy,
  startAfter,
  collectionGroup
} from "firebase/firestore";
import { useFirestore } from "../provider";

interface UseCollectionOptions {
  sort?: {
    field: string;
    direction: "asc" | "desc";
  };
  filter?: {
    field: string;
    operator: "==" | "<" | ">" | "<=" | ">=" | "!=" | "array-contains" | "in" | "not-in";
    value: any;
  };
  limit?: number;
  startAfter?: any;
  isCollectionGroup?: boolean;
}


export function useCollection<T>(path: string, options?: UseCollectionOptions) {
  const db = useFirestore();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If a filter value is empty/null and we're not explicitly allowing it, don't run the query.
    // This is to prevent queries from running before user data is loaded, for example.
    if (options?.filter && !options.filter.value) {
      setLoading(false);
      return;
    }

    let q: Query<DocumentData> = options?.isCollectionGroup ? collectionGroup(db, path) : collection(db, path);
    
    if (options?.filter) {
        q = query(q, where(options.filter.field, options.filter.operator, options.filter.value));
    }
    if (options?.sort) {
        q = query(q, orderBy(options.sort.field, options.sort.direction));
    }
    if (options?.startAfter) {
        q = query(q, startAfter(options.startAfter));
    }
    if (options?.limit) {
        q = query(q, limit(options.limit));
    }

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const result: T[] = [];
        snapshot.forEach((doc) => {
          result.push({ id: doc.id, ...doc.data() } as T);
        });
        setData(result);
        setLoading(false);
      }, 
      (err) => {
        console.error(err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, path, JSON.stringify(options)]);

  return { data, loading, error };
}
