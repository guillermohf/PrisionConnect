// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { environment } from '../enviroments/enviroment.prod';
import {  CACHE_SIZE_UNLIMITED, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Initialize Firebase

const app = initializeApp(environment.firebaseConfig);

export const auth = getAuth(app);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),  // Múltiples pestañas comparten caché
    cacheSizeBytes: CACHE_SIZE_UNLIMITED          // Sin límite de caché local
  })
});