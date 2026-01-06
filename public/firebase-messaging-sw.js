
// This service worker is required to show notifications when the app is in the background or closed.

// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// (This is the same config you use in your main app.)
const firebaseConfig = {
    apiKey: "AIzaSyAHRqi6FiM0jjMIqX0j7Jwj91s0JLyAKak",
    authDomain: "studio-4431476254-c1156.firebaseapp.com",
    projectId: "studio-4431476254-c1156",
    storageBucket: "studio-4431476254-c1156.firebasestorage.app",
    messagingSenderId: "23513776021",
    appId: "1:23513776021:web:3e5b6870112641c0fac09c"
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/icon-192x192.png' // You can add a default icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
