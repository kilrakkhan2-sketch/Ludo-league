
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, Firestore, getDocs, query, where } from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { useState, useEffect } from 'react';
import { UserProfile } from '@/types';
import { useFirebase } from './provider'; // Import useFirebase

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: any;
let firestore: Firestore;
let functions: Functions;
let storage: FirebaseStorage;

function initializeFirebase() {
    if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        firestore = getFirestore(app);
        functions = getFunctions(app);
        storage = getStorage(app);
    } else {
        app = getApps()[0];
        auth = getAuth(app);
        firestore = getFirestore(app);
        functions = getFunctions(app);
        storage = getStorage(app);
    }
    return { app, auth, firestore, functions, storage };
}

// Custom hook for user auth state and profile data
function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authInstance = getAuth(getApps()[0]);
    const firestoreInstance = getFirestore(getApps()[0]);
    const unsubscribe = onAuthStateChanged(authInstance, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        const userRef = doc(firestoreInstance, 'users', authUser.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          setUserData({ id: docSnap.id, ...docSnap.data() } as UserProfile);
        } else {
          setUserData(null);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, userData, loading };
}


// Generic hook for fetching a collection
function useCollection<T>(path: string | undefined, queryOptions: any = {}) {
    const [data, setData] = useState<T[]>([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { firestore } = useFirebase(); // Use context

    const refetch = async () => {
        if (!firestore || !path) {
            setData([]);
            setCount(0);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            let collectionRef: any = collection(firestore, path);
            if (queryOptions.where) {
                const [field, operator, value] = queryOptions.where;
                collectionRef = query(collectionRef, where(field, operator, value));
            }
            const snapshot = await getDocs(collectionRef);
            const result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
            setData(result);
            setCount(snapshot.size);
        } catch (err: any) {
            console.error("Error fetching collection:", err);
            setError(err);
            setData([]);
            setCount(0);
        }
        setLoading(false);
    };

    useEffect(() => {
        refetch();
    }, [path, firestore]);

    return { data, count, loading, error, refetch };
}

// Generic hook for fetching a document
function useDoc<T>(path: string | undefined) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { firestore } = useFirebase(); // Use context

     const refetch = async () => {
        if (!firestore || !path) {
          setData(null);
          setLoading(false);
          return;
        }
        setLoading(true);
        setError(null);
        try {
            const docRef = doc(firestore, path);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setData({ id: docSnap.id, ...docSnap.data() } as T);
            } else {
                setData(null);
            }
        } catch (err: any) {
            console.error("Error fetching document:", err);
            setError(err);
            setData(null);
        }
        setLoading(false);
    };

    useEffect(() => {
        refetch();
    }, [path, firestore]);

    return { data, loading, error, refetch };
}

// Re-export everything from provider
export * from './provider';

export {
    initializeFirebase,
    useUser,
    useCollection,
    useDoc,
    collection,
    doc
};
