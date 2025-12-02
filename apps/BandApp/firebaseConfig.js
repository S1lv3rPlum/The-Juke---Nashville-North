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
export const database = getDatabase(app);