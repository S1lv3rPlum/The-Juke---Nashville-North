//copied from firebaseConfig.template.js

import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Get these from: Firebase Console → Project Settings → Your Apps → Web App
const firebaseConfig = {
  paste the things here
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
