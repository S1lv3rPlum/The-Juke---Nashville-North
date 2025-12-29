// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

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

// Mock auth for Expo Go / Production Build
const auth = {
  currentUser: { uid: "Nashville-North" },
  
  onAuthStateChanged: (cb) => {
    cb({ uid: "Nashville-North" });
    return () => {};
  },
  
  signInWithEmailAndPassword: async () => {
    console.warn("Firebase Auth disabled: using mock auth");
    return { user: { uid: "Nashville-North" } };
  },
  
  signOut: async () => {
    console.warn("Firebase Auth disabled: using mock auth");
  },
};

export { app, database, auth };