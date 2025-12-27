'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirebase } from '../provider';
import { collection, query, where, orderBy, limit, onSnapshot, QueryConstraint } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

type WhereClause = readonly [string, any, any];
type OrderByClause = readonly [string, 'asc' | 'desc'];

interface CollectionQuery {
    where?: WhereClause | WhereClause[];
    orderBy?: OrderByClause | OrderByClause[];
    limit?: number;
}

export const useCollection = <T>(path: string | null | undefined, q?: CollectionQuery) => {
    const { firestore } = useFirebase();
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    
    const memoizedQuery = useMemo(() => q, [
        JSON.stringify(q?.where),
        JSON.stringify(q?.orderBy),
        q?.limit,
    ]);

    const refetch = () => {
        // This is a dummy implementation for now as onSnapshot handles real-time.
    };

    useEffect(() => {
        if (!firestore || !path) {
            setLoading(false);
            setData([]);
            return;
        };
        
        setLoading(true);

        const constraints: QueryConstraint[] = [];
        if (memoizedQuery) {
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
            if (memoizedQuery.orderBy) {
                if (Array.isArray(memoizedQuery.orderBy[0])) {
                    (memoizedQuery.orderBy as OrderByClause[]).forEach(o => constraints.push(orderBy(o[0], o[1])));
                } else {
                     constraints.push(orderBy(...(memoizedQuery.orderBy as OrderByClause)));
                }
            }
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
