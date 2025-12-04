
"use client";

import { useState, useEffect, useCallback, useReducer } from "react";
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

  const buildQuery = useCallback((startAfterDoc: QueryDocumentSnapshot<DocumentData> | null = null) => {
    let q: Query<DocumentData> = options?.isCollectionGroup ? collectionGroup(db, path) : collection(db, path);
    const constraints: QueryConstraint[] = [];

    if (options?.where) {
        if (Array.isArray(options.where[0])) {
            (options.where as WhereClause[]).forEach(w => constraints.push(where(w[0], w[1], w[2])));
        } else {
            const w = options.where as WhereClause;
            constraints.push(where(w[0], w[1], w[2]));
        }
    }
    if (options?.orderBy) {
       if (Array.isArray(options.orderBy[0])) {
            (options.orderBy as OrderByClause[]).forEach(o => constraints.push(orderBy(o[0], o[1])));
        } else {
            const o = options.orderBy as OrderByClause;
            constraints.push(orderBy(o[0], o[1]));
        }
    }
    if (startAfterDoc) {
        constraints.push(startAfter(startAfterDoc));
    }
    if (options?.limit) {
        constraints.push(limit(options.limit));
    }

    return query(q, ...constraints);
  }, [db, path, JSON.stringify(options)]);

  const loadInitial = useCallback(async () => {
    if ((options?.where && (!options.where[2] && !Array.isArray(options.where[0]))) || !db) {
       dispatch({ type: 'data', payload: [], lastDoc: null, hasMore: false });
       return;
    }
    dispatch({ type: 'loading' });

    try {
      const q = buildQuery();
      const snapshot = await getDocs(q);
      const result: T[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const hasMore = options?.limit ? result.length === options.limit : false;
      dispatch({ type: 'data', payload: result, lastDoc: lastVisible || null, hasMore });
    } catch (err: any) {
      console.error(err);
      dispatch({ type: 'error', payload: err });
    }
  }, [buildQuery, db, options?.limit, options?.where]);
  
  useEffect(() => {
    loadInitial();
  }, [loadInitial]);


  const loadMore = useCallback(async () => {
    if (!state.lastDoc || !state.hasMore || state.loading) return;

    dispatch({ type: 'loading' });

    try {
        const q = buildQuery(state.lastDoc);
        const snapshot = await getDocs(q);
        const result: T[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        const lastVisible = snapshot.docs[snapshot.docs.length - 1];
        const hasMore = options?.limit ? result.length === options.limit : false;

        dispatch({ type: 'more-data', payload: result, lastDoc: lastVisible || null, hasMore });
    } catch (err: any)        {
        console.error(err);
        dispatch({ type: 'error', payload: err });
    }
  }, [state.lastDoc, state.hasMore, state.loading, buildQuery, options?.limit]);

  return { ...state, loadMore, reload: loadInitial };
}
