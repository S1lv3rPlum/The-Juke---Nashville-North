// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCcnnb18BXrU9q0IAAHrBNiFsQYc2Wu31s",
  authDomain: "the-juke---nashville.firebaseapp.com",
  databaseURL: "https://the-juke---nashville-default-rtdb.firebaseio.com",
  projectId: "the-juke---nashville",
  storageBucket: "the-juke---nashville.firebasestorage.app",
  messagingSenderId: "850520994035",
  appId: "1:850520994035:web:e311969207eb4ec7b1c786"
  // measurementId removed (web-only)
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Get a reference to the Realtime Database
export const database = getDatabase(app);

// SETUP INSTRUCTIONS:
// ===================
// 1. Copy this file: cp firebaseConfig.template.js firebaseConfig.js
// 2. Open firebaseConfig.js
// 3. Replace all the "YOUR_" placeholders with actual values from Firebase Console
// 4. Save the file
// 5. NEVER commit firebaseConfig.js to GitHub (it's in .gitignore)

// For other developers:
// When you clone this repo, you'll need to:
// 1. Create your own Firebase project
// 2. Copy firebaseConfig.template.js to firebaseConfig.js
// 3. Add your own Firebase credentials
