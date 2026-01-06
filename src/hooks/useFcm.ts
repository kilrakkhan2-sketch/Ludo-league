'use client';
import { useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useFirebaseApp, useFirestore, useUser } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from './use-toast';
import { firebaseConfig } from '@/firebase/config';

export const useFcm = () => {
    const { toast } = useToast();
    const app = useFirebaseApp();
    const { user } = useUser();
    const firestore = useFirestore();

    useEffect(() => {
        if (typeof window === 'undefined' || !app || !user || !firestore) {
            return;
        }
        
        const vapidKey = firebaseConfig.vapidKey;
        if (!vapidKey) {
            console.error('VAPID key is not configured in firebaseConfig.');
            return;
        }

        const setupMessaging = async () => {
            try {
                const messaging = getMessaging(app);

                onMessage(messaging, (payload) => {
                    console.log('Message received. ', payload);
                    toast({
                        title: payload.notification?.title,
                        description: payload.notification?.body,
                    });
                });

                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    console.log('Notification permission granted.');
                    const currentToken = await getToken(messaging, { vapidKey });

                    if (currentToken) {
                        console.log('FCM Token:', currentToken);
                        const userProfileRef = doc(firestore, 'users', user.uid);
                        await setDoc(userProfileRef, { fcmToken: currentToken }, { merge: true });
                    } else {
                        console.log('No registration token available. Request permission to generate one.');
                    }
                } else {
                    console.log('Unable to get permission to notify.');
                }
            } catch (error) {
                console.error('An error occurred while setting up notifications.', error);
                 toast({
                    title: "Could not initialize notifications",
                    description: error instanceof Error ? error.message : "An unknown error occurred.",
                    variant: "destructive"
                });
            }
        };

        setupMessaging();

    }, [app, user, firestore, toast]);

    return null;
};
