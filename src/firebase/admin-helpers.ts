
// This file is intended to be used in Server Components for read-only operations.
// It uses the Firebase Admin SDK to securely access Firestore from the server.
// DO NOT use this for write operations from the client.

import { initializeFirebaseAdmin } from '@/firebase/admin';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import type { Announcement } from '@/types';

// This function is idempotent. It initializes the admin app if it's not already.
const getFirestoreAdmin = () => {
    const adminApp = initializeFirebaseAdmin();
    return adminApp.firestore();
};

export async function getAnnouncements(): Promise<Announcement[]> {
    try {
        const firestore = getFirestoreAdmin();
        const announcementsCol = collection(firestore, 'announcements');
        const q = query(announcementsCol, orderBy('createdAt', 'desc'), limit(5));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return [];
        }

        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            // Firestore admin SDK returns Timestamps, we need to convert them for the client
            const serializedData = {
                ...data,
                createdAt: data.createdAt.toDate().toISOString(),
            };
            return { id: doc.id, ...serializedData } as Announcement;
        });
    } catch (error) {
        console.error("Error fetching announcements on server:", error);
        // In case of error, return an empty array to prevent breaking the page.
        return [];
    }
}
