# GitHub Codespace Setup Instructions

## Step 1: Create GitHub Repository

1. Go to https://github.com/
2. Click the **+** icon (top right) → **New repository**
3. Name it: `band-jukebox` (or your band name)
4. Add description: "Live band jukebox system with mobile apps"
5. Choose **Public** or **Private**
6. ✅ Check "Add a README file"
7. Click **Create repository**

---

## Step 2: Open GitHub Codespace

1. On your new repo page, click the green **Code** button
2. Click the **Codespaces** tab
3. Click **Create codespace on main**
4. Wait for Codespace to initialize (30-60 seconds)

You now have a VS Code environment in your browser! 🎉

---

## Step 3: Create Folder Structure

In the Codespace terminal (bottom panel), run these commands:
````bash
# Create folder structure
mkdir -p apps/customer/assets
mkdir -p apps/manager/assets
mkdir -p apps/band-leader/assets
mkdir -p firebase
mkdir -p docs

# Verify structure
tree -L 2
````

You should see:
````
.
├── apps/
│   ├── customer/
│   │   └── assets/
│   ├── manager/
│   │   └── assets/
│   └── band-leader/
│       └── assets/
├── firebase/
├── docs/
└── README.md
````

---

## Step 4: Create All Files

### Create .gitignore
````bash
cat > .gitignore << 'EOF'
# Firebase configs
apps/*/firebaseConfig.js
.env
.env.local

# Dependencies
node_modules/
apps/*/node_modules/

# Expo
apps/*/.expo/
apps/*/.expo-shared/
apps/*/dist/
apps/*/web-build/

# Builds
apps/*/ios/build/
apps/*/android/build/

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Logs
*.log
npm-debug.log*
EOF
````

### Create Customer App Files
````bash
# Create firebaseConfig template
cat > apps/customer/firebaseConfig.template.js << 'EOF'
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
EOF

# You'll paste the customer app code into App.js next
touch apps/customer/App.js
touch apps/customer/package.json
touch apps/customer/app.json
````

### Create Manager App Files
````bash
# Copy template
cp apps/customer/firebaseConfig.template.js apps/manager/firebaseConfig.template.js

touch apps/manager/App.js
touch apps/manager/package.json
touch apps/manager/app.json
````

### Create Band Leader App Files
````bash
# Copy template
cp apps/customer/firebaseConfig.template.js apps/band-leader/firebaseConfig.template.js

touch apps/band-leader/App.js
touch apps/band-leader/package.json
touch apps/band-leader/app.json
````

### Create Firebase Files
````bash
touch firebase/rules.json
touch firebase/sample-data.json
````

---

## Step 5: Copy Code from Artifacts

Now open each file in Codespace and paste the code:

### Customer App
1. Open `apps/customer/App.js`
2. Copy code from artifact **"Customer App - Main Component"**
3. Paste and save (Ctrl+S or Cmd+S)

4. Open `apps/customer/package.json`
5. Copy code from artifact **"customer-package.json"**
6. Paste and save

7. Open `apps/customer/app.json`
8. Copy code from artifact **"customer-app.json"**
9. Paste and save

### Manager App
1. Open `apps/manager/App.js`
2. Copy code from artifact **"Manager App - Main Component"**
3. Paste and save

4. Open `apps/manager/package.json`
5. Copy code from artifact **"manager-package.json"**
6. Paste and save

7. Open `apps/manager/app.json`
8. Copy code from artifact **"manager-app.json"**
9. Paste and save

### Band Leader App
1. Open `apps/band-leader/App.js`
2. Copy code from artifact **"band-leader-app.js"**
3. Paste and save

4. Open `apps/band-leader/package.json`
5. Copy code from artifact **"band-leader-package.json"**
6. Paste and save

7. Create `apps/band-leader/app.json`:
````bash
cat > apps/band-leader/app.json << 'EOF'
{
  "expo": {
    "name": "Band Leader",
    "slug": "band-jukebox-leader",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#9C27B0"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourband.jukebox.leader"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#9C27B0"
      },
      "package": "com.yourband.jukebox.leader"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
EOF
````

### Firebase Files
1. Open `firebase/rules.json`
2. Copy code from artifact **"Firebase Security Rules - Production Ready"**
3. Paste and save

4. Create sample data:
````bash
cat > firebase/sample-data.json << 'EOF'
{
  "songs": {},
  "settings": {
    "priorityBoostPrice": 10,
    "venmoUsername": "YourBandVenmo",
    "venmoQRCode": "https://placeholder-qr-code.com/image.png",
    "bandName": "The Country Stars"
  },
  "requests": {},
  "playedHistory": {}
}
EOF
````

---

## Step 6: Update README
````bash
cat > README.md << 'EOF'
# 🎸 Live Band Jukebox System

A mobile app system for live bands to accept song requests with payment via Venmo or cash.

## 📱 Three Apps

- **Customer App**: Browse songs, make requests, see queue
- **Manager App**: Confirm payments, manage queue, add/edit songs
- **Band Leader App**: View confirmed queue, mark songs played

## 🚀 Quick Start

### Setup Each App
```bash
# Customer App
cd apps/customer
npm install
cp firebaseConfig.template.js firebaseConfig.js
# Edit firebaseConfig.js with your Firebase credentials
npx expo start

# Manager App
cd apps/manager
npm install
cp firebaseConfig.template.js firebaseConfig.js
# Edit firebaseConfig.js with your Firebase credentials
npx expo start

# Band Leader App
cd apps/band-leader
npm install
cp firebaseConfig.template.js firebaseConfig.js
# Edit firebaseConfig.js with your Firebase credentials
npx expo start
```

### Firebase Setup

1. Create project at https://console.firebase.google.com/
2. Add Web app, copy config
3. Enable Realtime Database
4. Import `firebase/sample-data.json`
5. Apply rules from `firebase/rules.json`

See full setup guide in `/docs/SETUP.md`

## 📄 License

MIT License - Free to use for your band!
EOF
````

---

## Step 7: Commit to GitHub
````bash
# Check status
git status

# Add all files
git add .

# Commit
git commit -m "Initial commit: Band Jukebox system with 3 apps"

# Push to GitHub
git push origin main
````

---

## Step 8: Create Placeholder Icons (Optional)

For now, create simple placeholder files:
````bash
# Create 1x1 pixel placeholder images (won't crash the app)
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > apps/customer/assets/icon.png
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > apps/manager/assets/icon.png
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > apps/band-leader/assets/icon.png

# Copy for splash screens
cp apps/customer/assets/icon.png apps/customer/assets/splash.png
cp apps/manager/assets/icon.png apps/manager/assets/splash.png
cp apps/band-leader/assets/icon.png apps/band-leader/assets/splash.png
````

---

## Step 9: Test Locally in Codespace
````bash
# Install Expo CLI
npm install -g expo-cli

# Test customer app
cd apps/customer
npm install
npx expo start --tunnel
````

Scan the QR code with Expo Go app on your phone!

---

## Folder Structure Complete ✅
````
band-jukebox/
├── apps/
│   ├── customer/
│   │   ├── assets/
│   │   ├── App.js
│   │   ├── app.json
│   │   ├── package.json
│   │   └── firebaseConfig.template.js
│   ├── manager/
│   │   ├── assets/
│   │   ├── App.js
│   │   ├── app.json
│   │   ├── package.json
│   │   └── firebaseConfig.template.js
│   └── band-leader/
│       ├── assets/
│       ├── App.js
│       ├── app.json
│       ├── package.json
│       └── firebaseConfig.template.js
├── firebase/
│   ├── rules.json
│   └── sample-data.json
├── .gitignore
└── README.md
````

---

## Next Steps

1. ✅ Create Firebase project
2. ✅ Copy Firebase config to each app's `firebaseConfig.js`
3. ✅ Import sample data to Firebase
4. ✅ Apply security rules
5. ✅ Test each app with `npx expo start`

Done! 🎉
