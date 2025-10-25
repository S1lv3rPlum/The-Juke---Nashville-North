//copied from firebaseConfig.template.js

import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Get these from: Firebase Console → Project Settings → Your Apps → Web App
const firebaseConfig = {
  apiKey: "AlzaSyCcnnb18BXrU9q0IAAHrBNiFsQYc2Wu31s",
  authDomain: "the-juke---nashville.firebaseapp.com",
  databaseURL: "https://console.firebase.google.com/u/3/project/the-juke---nashville/database/the-juke---nashville-default-rtdb/data/~2F",
  projectId: "the-juke---nashville",
  storageBucket: "the-juke---nashville.firebasestorage.com",
  messagingSenderId: "850520994035",
  appId: "1:850520994035:web:e311969207eb4ec7b1c786"
  measurementId: "G-DBTJJR3C1"
};


const app = initializeApp(firebaseConfig);
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
