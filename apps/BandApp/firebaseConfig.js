import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// ❌ REMOVE these imports (Expo Go cannot use them)
// import { 
//   getReactNativePersistence,
//   initializeAuth
// } from 'firebase/auth';
// import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCcnnb18BXrU9q0IAAHrBNiFsQYc2Wu31s",
  authDomain: "the-juke---nashville.firebaseapp.com",
  databaseURL: "https://the-juke---nashville-default-rtdb.firebaseio.com",
  projectId: "the-juke---nashville",
  storageBucket: "the-juke---nashville.firebasestorage.app",
  messagingSenderId: "850520994035",
  appId: "1:850520994035:web:e311969207eb4ec7b1c786"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const auth = {
  currentUser: null,

  // Immediately call the callback so App.js stops "loading"
  onAuthStateChanged: (cb) => {
    cb(null); // Always "logged out"
    return () => {};
  },

  signInWithEmailAndPassword: async () => {
    console.warn("Firebase Auth disabled: using Expo Go");
    return { user: null };
  },

  signOut: async () => {
    console.warn("Firebase Auth disabled: using Expo Go");
  },
};


export { app, database, auth };
