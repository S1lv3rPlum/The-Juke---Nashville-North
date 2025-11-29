import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

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

// Mock auth for Expo Go testing
const auth = {
  currentUser: { uid: "dev-testing-user" },
  onAuthStateChanged: (cb) => {
    cb({ uid: "dev-testing-user" }); // Fake logged-in user
    return () => {};
  },
  signInWithEmailAndPassword: async () => {
    console.warn("Firebase Auth disabled: using Expo Go");
    return { user: { uid: "dev-testing-user" } };
  },
  signOut: async () => {
    console.warn("Firebase Auth disabled: using Expo Go");
  },
};

export { app, database, auth };