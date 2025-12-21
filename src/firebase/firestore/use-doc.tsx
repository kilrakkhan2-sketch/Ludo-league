
"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot, DocumentData } from "firebase/firestore";
import { useFirestore } from "../provider";

export function useDoc<T>(path: string | undefined | null) {
  const db = useFirestore();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If the path is not provided, don't fetch anything.
    if (!db || !path) {
      setData(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const docRef = doc(db, path);

    const unsubscribe = onSnapshot(docRef, 
      (doc) => {
        if (doc.exists()) {
          setData({ id: doc.id, ...doc.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
      }, 
      (err) => {
        console.error(`Error fetching doc from path: ${path}`, err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, path]);

  return { data, loading, error };
}
