
"use client";

import { useState, useEffect, useCallback, useReducer, useMemo } from "react";
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
  collectionGroup,
  QueryConstraint,
  getDocs,
  QueryDocumentSnapshot,
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

type State<T> = {
  data: T[];
  loading: boolean;
  error: Error | null;
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
};

type Action<T> =
  | { type: 'loading' }
  | { type: 'data'; payload: T[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null; hasMore: boolean }
  | { type: 'more-data'; payload: T[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null; hasMore: boolean }
  | { type: 'error'; payload: Error };

const createInitialState = <T>(): State<T> => ({
  data: [],
  loading: true,
  error: null,
  lastDoc: null,
  hasMore: false,
});

const stateReducer = <T>(state: State<T>, action: Action<T>): State<T> => {
  switch (action.type) {
    case 'loading':
      return { ...state, loading: true };
    case 'data':
      return { ...state, loading: false, data: action.payload, lastDoc: action.lastDoc, hasMore: action.hasMore, error: null };
    case 'more-data':
      return { ...state, loading: false, data: [...state.data, ...action.payload], lastDoc: action.lastDoc, hasMore: action.hasMore, error: null };
    case 'error':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};


export function useCollection<T extends { id: string }>(path: string, options?: UseCollectionOptions) {
  const db = useFirestore();
  const [state, dispatch] = useReducer(stateReducer, createInitialState<T>());

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

  const loadInitial = useCallback(() => {
    dispatch({ type: 'loading' });
    const q = buildQuery();

    if (!q) {
       dispatch({ type: 'data', payload: [], lastDoc: null, hasMore: false });
       return;
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const result: T[] = [];
        querySnapshot.forEach((doc) => {
            result.push({ id: doc.id, ...doc.data() } as T);
        });
        const lastVisible = querySnapshot.docs[querySnapshot.docs.length-1];
        const hasMore = optionsMemo?.limit ? result.length === optionsMemo.limit : false;
        dispatch({ type: 'data', payload: result, lastDoc: lastVisible || null, hasMore });
    }, (err: any) => {
      console.error(err);
      dispatch({ type: 'error', payload: err });
    });

    return unsubscribe;
  }, [buildQuery, optionsMemo?.limit]);
  
  useEffect(() => {
    const unsubscribe = loadInitial();
    return () => unsubscribe?.();
  }, [loadInitial]);


  const loadMore = useCallback(async () => {
    if (!state.lastDoc || !state.hasMore || state.loading) return;

    dispatch({ type: 'loading' });

    try {
        let q: Query<DocumentData> | null = null;
        if (path && db) {
            let baseQuery: Query<DocumentData> = optionsMemo?.isCollectionGroup ? collectionGroup(db, path) : collection(db, path);
            const constraints: QueryConstraint[] = [];

            if (optionsMemo?.where) {
                const whereClauses = Array.isArray(optionsMemo.where[0]) ? (optionsMemo.where as WhereClause[]) : ([optionsMemo.where] as WhereClause[]);
                whereClauses.forEach(w => constraints.push(where(w[0], w[1], w[2])));
            }
             if (optionsMemo?.orderBy) {
                if (Array.isArray(optionsMemo.orderBy[0])) {
                        (optionsMemo.orderBy as OrderByClause[]).forEach(o => constraints.push(orderBy(o[0], o[1])));
                } else {
                    const o = optionsMemo.orderBy as OrderByClause;
                    constraints.push(orderBy(o[0], o[1]));
                }
            }
            constraints.push(startAfter(state.lastDoc));
            if (optionsMemo?.limit) {
                constraints.push(limit(optionsMemo.limit));
            }
            q = query(baseQuery, ...constraints);
        }

        if (!q) return;

        const snapshot = await getDocs(q);
        const result: T[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        const lastVisible = snapshot.docs[snapshot.docs.length - 1];
        const hasMore = optionsMemo?.limit ? result.length === optionsMemo.limit : false;

        dispatch({ type: 'more-data', payload: result, lastDoc: lastVisible || null, hasMore });
    } catch (err: any)        {
        console.error(err);
        dispatch({ type: 'error', payload: err });
    }
  }, [state.lastDoc, state.hasMore, state.loading, path, db, optionsMemo]);

  return { ...state, loadMore, reload: loadInitial };
}
