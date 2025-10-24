# The-Juke---Nashville-North
A live jukebox

# 🎸 Live Band Jukebox System

A mobile app system for live bands to accept song requests with payment via Venmo or cash. Built with React Native and Firebase.

## 📱 Three Apps in This System

### 1. Customer App (Public)
- Browse song catalog
- Request songs with optional priority boost
- Choose Venmo or cash payment
- View live queue
- 2-minute cooldown between requests

### 2. Manager App (Private)
- Confirm cash payments
- Verify Venmo payments
- Move requests to confirmed queue
- Adjust priority boost pricing
- Mark songs as played

### 3. Band Leader App (Private)
- View confirmed/paid queue only
- See next songs to play
- Mark songs as played
- Clean performance-focused interface

---

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ installed
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Firebase account (free)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/band-jukebox.git
   cd band-jukebox
   ```

2. **Install dependencies for each app**
   ```bash
   # Customer App
   cd customer-app
   npm install

   # Manager App
   cd ../manager-app
   npm install

   # Band Leader App
   cd ../band-leader-app
   npm install
   ```

3. **Configure Firebase**
   
   a. Create a Firebase project at https://console.firebase.google.com/
   
   b. Enable Realtime Database in test mode
   
   c. Add a Web app and copy the config
   
   d. In each app folder, copy the template:
   ```bash
   cp firebaseConfig.template.js firebaseConfig.js
   ```
   
   e. Edit `firebaseConfig.js` with your actual Firebase credentials
   
   f. Apply security rules from `firebase-rules.json`

4. **Add initial data to Firebase**
   - Import the sample data from `firebase-sample-data.json`
   - Or manually add songs and settings in Firebase Console

5. **Run the apps**
   ```bash
   # In each app folder:
   npx expo start
   
   # Scan QR code with Expo Go app on your phone
   ```

---

## 🔒 Security Setup

### Firebase Rules (Important!)

Copy the rules from `firebase-rules.json` to your Firebase Console:

1. Go to Firebase Console → Realtime Database → Rules
2. Replace with the rules from the file
3. Click Publish

This ensures:
- ✅ Anyone can read songs and requests
- ✅ Only customers can create requests
- ❌ No one can modify song prices or settings from apps

### Protecting Your Keys

**NEVER commit `firebaseConfig.js` to Git!**

- ✅ The `.gitignore` file protects your keys
- ✅ Use `firebaseConfig.template.js` for sharing
- ✅ Each developer needs their own Firebase credentials

---

## 📂 Project Structure

```
band-jukebox/
├── customer-app/
│   ├── App.js (CustomerApp.js)
│   ├── firebaseConfig.js (gitignored)
│   ├── firebaseConfig.template.js
│   └── package.json
├── manager-app/
│   ├── App.js (ManagerApp.js)
│   ├── firebaseConfig.js (gitignored)
│   ├── firebaseConfig.template.js
│   └── package.json
├── band-leader-app/
│   ├── App.js (BandLeaderApp.js)
│   ├── firebaseConfig.js (gitignored)
│   ├── firebaseConfig.template.js
│   └── package.json
├── firebase-rules.json
├── firebase-sample-data.json
├── .gitignore
└── README.md
```

---

## 🎵 Adding Songs

### Option 1: Firebase Console (Recommended)
1. Go to Firebase Console → Realtime Database
2. Navigate to `songs/`
3. Click `+` to add a new song
4. Required fields:
   - `id`: Unique identifier (e.g., "song_001")
   - `title`: Song name
   - `artist`: Artist name
   - `price`: Base price (number)

### Option 2: Import JSON
1. Export your song list as JSON
2. In Firebase Console, click ⋮ menu → Import JSON
3. Paste your songs array

---

## 💰 Payment Setup

### Venmo Integration
1. Update in Firebase Console → `settings/venmoUsername`
2. Add your band's Venmo handle (e.g., "@YourBandName")
3. Optional: Add QR code URL to `settings/venmoQRCode`

### Priority Boost Pricing
- Adjustable in Manager App settings
- Default: $10 extra
- Moves request to front of queue

---

## 🛠️ Customization for Other Bands

To customize this for a different band:

1. **Update Band Info** (Firebase Console → `settings/`)
   - `bandName`: "Your Band Name"
   - `venmoUsername`: "@YourVenmo"

2. **Update Song Catalog** (Firebase Console → `songs/`)
   - Replace with your band's repertoire

3. **Change App Colors** (in each App.js)
   - Customer App: Brown/Orange theme (`#8B4513`)
   - Manager App: Blue theme (`#2c5282`)
   - Band Leader App: Purple theme (`#9C27B0`)

4. **Update App Icons** (optional)
   - Replace `assets/icon.png` in each app folder

---

## 📱 Building for Production

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

See [Expo documentation](https://docs.expo.dev/distribution/building-standalone-apps/) for details.

---

## 🐛 Common Issues

### "Firebase not configured"
- Make sure you copied `firebaseConfig.template.js` to `firebaseConfig.js`
- Verify your Firebase credentials are correct

### "Permission denied" errors
- Check Firebase Database Rules are published
- Ensure rules allow public read for songs/requests

### App crashes on startup
- Run `npx expo start --clear` to clear cache
- Check Firebase database URL is correct

---

## 📄 License

MIT License - feel free to use this for your band!

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 💬 Support

For issues or questions, please open a GitHub issue.

---

## 🎸 Credits

Built for live country bands to create an interactive jukebox experience at events.

**Tech Stack:**
- React Native
- Expo
- Firebase Realtime Database
- AsyncStorage
