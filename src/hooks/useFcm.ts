
'use client';
import { useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useFirebaseApp, useFirestore, useUser } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from './use-toast';

export const useFcm = () => {
    const { toast } = useToast();
    const app = useFirebaseApp();
    const { user } = useUser();
    const firestore = useFirestore();

    useEffect(() => {
        if (typeof window === 'undefined' || !app || !user || !firestore) {
            return;
        }

        const setupMessaging = async () => {
            try {
                const messaging = getMessaging(app);

                // Handle messages while app is in foreground
                onMessage(messaging, (payload) => {
                    console.log('Message received. ', payload);
                    toast({
                        title: payload.notification?.title,
                        description: payload.notification?.body,
                    });
                });

                // Request permission and get token
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    console.log('Notification permission granted.');
                    const currentToken = await getToken(messaging, {
                        vapidKey: 'BGlqV0C7wA93gA8P_G-fB3-m9yYgS_1X-cZg8x8fW1l-kHwQ2tV8nZ7rY-jJ9jX-zJ5k-fXwY-oYx0', // Replace with your VAPID key
                    });

                    if (currentToken) {
                        console.log('FCM Token:', currentToken);
                        // Save the token to Firestore
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
            }
        };

        setupMessaging();

    }, [app, user, firestore, toast]);

    return null;
};
