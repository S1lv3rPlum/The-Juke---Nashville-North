// firebaseConfig.template.js
// This is a TEMPLATE file - safe to commit to GitHub
// Copy this file to 'firebaseConfig.js' and add your actual Firebase credentials

import { initializeApp } from 'firebase/app';
import { getFirestore} from 'firebase/firestore';

// Replace these with your actual Firebase configuration values
// Get these from: Firebase Console → Project Settings → Your Apps → Web App
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
export const database = getfirestore(app);

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
