'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useFirebase } from './provider';
import { onSnapshot, collection, doc, query, where, orderBy, limit, QueryConstraint } from 'firebase/firestore';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';

export const useDoc = <T,>(path: string | null | undefined) => {
    const { firestore } = useFirebase();
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!firestore || !path) {
            setLoading(false);
            return;
        };

        setLoading(true);

        const docRef = doc(firestore, path);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setData({ id: docSnap.id, ...docSnap.data() } as T);
            } else {
                setData(null);
            }
            setLoading(false);
        }, (err) => {
            console.error(`Error fetching document at ${path}:`, err);
            
            const permissionError = new FirestorePermissionError({
                path,
                operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);

            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [firestore, path]);
    
    const refetch = useCallback(() => {
      // The onSnapshot listener handles real-time updates.
      // This is a placeholder for manual refetching if ever needed.
    }, []);

    return { data, setData, loading, error, refetch };
};


type WhereClause = readonly [string, any, any];
type OrderByClause = readonly [string, 'asc' | 'desc'];

interface CollectionQuery {
    where?: WhereClause | WhereClause[];
    orderBy?: OrderByClause | OrderByClause[];
    limit?: number;
}


export const useCollection = <T,>(path: string | null | undefined, q?: CollectionQuery) => {
    const { firestore } = useFirebase();
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    
    const memoizedQuery = useMemo(() => q, [
        JSON.stringify(q?.where),
        JSON.stringify(q?.orderBy),
        q?.limit,
    ]);

    const refetch = useCallback(() => {
        // This is a dummy implementation for now.
    }, []);


    useEffect(() => {
        if (!firestore || !path) {
            setLoading(false);
            setData([]); // Ensure data is cleared when path is invalid
            return () => {};
        };
        setLoading(true);

        const constraints: QueryConstraint[] = [];
        if (memoizedQuery) {
            // Handle 'where' clauses
            if (memoizedQuery.where) {
                if (Array.isArray(memoizedQuery.where[0])) { 
                    (memoizedQuery.where as WhereClause[]).forEach(w => {
                        if (w[2] !== undefined) constraints.push(where(...w));
                    });
                } else {
                    const w = memoizedQuery.where as WhereClause;
                    if (w[2] !== undefined) constraints.push(where(...w));
                }
            }
            // Handle 'orderBy' clauses
            if (memoizedQuery.orderBy) {
                if (Array.isArray(memoizedQuery.orderBy[0])) {
                    (memoizedQuery.orderBy as OrderByClause[]).forEach(o => constraints.push(orderBy(o[0], o[1])));
                } else {
                     constraints.push(orderBy(...(memoizedQuery.orderBy as OrderByClause)));
                }
            }
            // Handle 'limit'
            if (memoizedQuery.limit) {
                constraints.push(limit(memoizedQuery.limit));
            }
        }

        const queryRef = query(collection(firestore, path), ...constraints);

        const unsubscribe = onSnapshot(queryRef, (querySnapshot) => {
            const collectionData: T[] = [];
            querySnapshot.forEach((doc) => {
                collectionData.push({ id: doc.id, ...doc.data() } as T);
            });
            setData(collectionData);
            setLoading(false);
        }, (err) => {
            console.error(`Error fetching collection at ${path}:`, err);
            const permissionError = new FirestorePermissionError({
                path,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [firestore, path, memoizedQuery]);

    return { data, loading, error, refetch, count: data.length };
};
