'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '../provider';
import { doc, onSnapshot } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export const useDoc = <T>(path: string | null | undefined) => {
    const { firestore } = useFirebase();
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!firestore || !path) {
            setLoading(false);
            setData(null);
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
    
    const refetch = () => {
      // The onSnapshot listener handles real-time updates.
      // This is a placeholder for manual refetching if ever needed.
    };

    return { data, loading, error, refetch };
};
