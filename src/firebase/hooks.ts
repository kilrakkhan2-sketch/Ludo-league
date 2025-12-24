'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirebase } from './provider';
import { onSnapshot, collection, doc, query, where, orderBy, limit } from 'firebase/firestore';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';

export const useDoc = <T,>(path: string | null) => {
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
                operation: 'read',
            });
            errorEmitter.emit('permission-error', permissionError);

            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [firestore, path]);

    return { data, loading, error };
};


interface CollectionQuery {
    where?: readonly [string, '==', any] | readonly [string, '!=', any] | readonly [string, 'array-contains', any];
    orderBy?: readonly [string, 'asc' | 'desc'];
    limit?: number;
}

export const useCollection = <T,>(path: string, q?: CollectionQuery) => {
    const { firestore } = useFirebase();
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [rerun, setRerun] = useState(0);

    const refetch = useCallback(() => setRerun(Date.now()), []);

    useEffect(() => {
        if (!firestore) return;
        setLoading(true);

        const collRef = collection(firestore, path);
        
        let queryRef = query(collRef);
        if (q) {
            if (q.where) queryRef = query(queryRef, where(...q.where));
            if (q.orderBy) queryRef = query(queryRef, orderBy(...q.orderBy));
            if (q.limit) queryRef = query(queryRef, limit(q.limit));
        }

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
                operation: 'read',
            });
            errorEmitter.emit('permission-error', permissionError);

            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [firestore, path, JSON.stringify(q), rerun]); // Deep compare for query object

    return { data, loading, error, refetch, count: data.length };
};
