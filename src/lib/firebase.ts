import { getApps, initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (!config.apiKey) {
  console.warn("VITE_FIREBASE_API_KEY is missing; live bot stats will be disabled.");
}

const app = getApps().length ? getApps()[0] : initializeApp(config);
const isBrowser = typeof window !== "undefined";

export const db = isBrowser
  ? initializeFirestore(app, {
      experimentalForceLongPolling: true,
      useFetchStreams: false,
    })
  : getFirestore(app);
