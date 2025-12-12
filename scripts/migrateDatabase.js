/*
 * LIVE JUKEBOX - MULTI-BAND PLATFORM
 * Database Schema & Migration Script
 * 
 * This defines the complete Firebase Realtime Database structure
 * and provides a migration script to convert existing single-band data
 * to the new multi-band format.
 */

// ============================================================================
// DATABASE SCHEMA STRUCTURE
// ============================================================================

const DATABASE_SCHEMA = {
  
  // User Authentication (managed by Firebase Auth, not in Realtime DB)
  // Each band creates an account with email/password
  
  // Band profiles and all their data
  bands: {
    '{bandId}': {  // bandId comes from Firebase Auth UID
      
      // Basic Info
      bandName: 'The Nashville Ramblers',
      bandSlug: 'the-nashville-ramblers',  // URL-safe version for deep links
      logoUrl: 'https://example.com/logo.png',
      
      // Contact/Social
      venmoUsername: 'nashville-ramblers',
      socialLinks: {
        facebook: 'https://facebook.com/...',
        instagram: 'https://instagram.com/...',
        tiktok: 'https://tiktok.com/@...',
        website: 'https://...',
        spotify: 'https://open.spotify.com/artist/...',
        youtube: 'https://youtube.com/@...'
      },
      
      // Subscription Info
      subscription: {
        tier: 'free',  // 'free' | 'pro' | 'premium'
        customAds: false,  // true if they pay for custom ads add-on
        expiresAt: 1234567890,  // timestamp, null for free
        stripeCustomerId: 'cus_...',  // for Stripe integration
        stripeSubscriptionId: 'sub_...'
      },
      
      // Settings
      settings: {
        priorityBoostPrice: 10,
        maxRequests: 10,
        isLive: false  // Toggle when band is currently performing
      },
      
      // Master List - All songs band knows
      songs: {
        '{songId}': {
          id: 'song_123',
          title: 'Friends in Low Places',
          artist: 'Garth Brooks',
          price: 5,
          isLineDance: false,
          isRequestable: true,  // Persistent across shows
          createdAt: 1234567890
        }
      },
      
      // Set List - Tonight's performance order
      setList: {
        '{itemId}': {
          id: 'setitem_123',
          order: 1,  // Position in list (0-indexed)
          type: 'song',  // 'song' | 'break'
          
          // If type is 'song':
          songId: 'song_123',
          
          // If type is 'break':
          breakDuration: 15,  // minutes
          
          createdAt: 1234567890
        }
      },
      
      // Song Requests
      requests: {
        '{requestId}': {
          id: 'req_123',
          songId: 'song_123',
          songTitle: 'Friends in Low Places',
          artist: 'Garth Brooks',
          price: 5,
          customerName: 'John Doe',
          timestamp: 1234567890,
          paymentMethod: 'venmo',  // 'venmo' | 'cash'
          status: 'confirmed',  // 'pending' | 'confirmed' | 'played'
          priorityBoost: false,
          playedTimestamp: null  // Set when marked as played
        }
      },
      
      // Custom Ads (only if subscription.customAds === true)
      ads: {
        '{adId}': {
          id: 'ad_123',
          imageURL: 'https://example.com/ad.jpg',
          linkURL: 'https://example.com',
          active: true,
          order: 1
        }
      }
    }
  },
  
  // Global band directory for search/browse
  bandDirectory: {
    '{bandSlug}': {
      bandId: 'uid_123',
      bandName: 'The Nashville Ramblers',
      logoUrl: 'https://example.com/logo.png',
      isLive: false,
      lastActive: 1234567890
    }
  }
};

// ============================================================================
// SUBSCRIPTION LIMITS
// ============================================================================

const SUBSCRIPTION_LIMITS = {
  free: {
    maxRequestableSongs: 10,
    maxMasterListSongs: 50,
    customAds: false
  },
  pro: {
    maxRequestableSongs: 30,
    maxMasterListSongs: 150,
    customAds: false  // Unless they buy the add-on
  },
  premium: {
    maxRequestableSongs: -1,  // Unlimited (we'll use 999 in practice)
    maxMasterListSongs: 500,
    customAds: false  // Unless they buy the add-on
  }
};

// Add-on pricing
const ADDON_CUSTOM_ADS = 2.99;  // per month

// ============================================================================
// MIGRATION SCRIPT
// ============================================================================

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set, update, remove } from 'firebase/database';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

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
const auth = getAuth(app);

/**
 * MIGRATION FUNCTION
 * Converts existing single-band data to new multi-band structure
 * 
 * Run this ONCE to migrate your current data
 */
async function migrateToMultiBand() {
  console.log('🎸 Starting migration to multi-band structure...\n');
  
  try {
    // Step 1: Create a band account for your existing data
    console.log('Step 1: Creating band account...');
    const bandEmail = 'DataForgeApps@gmail.com';  // CHANGE THIS
    const bandPassword = '228Goethe';    // CHANGE THIS
    
    const userCredential = await createUserWithEmailAndPassword(auth, bandEmail, bandPassword);
    const bandId = userCredential.user.uid;
    console.log(`✓ Band account created with ID: ${bandId}\n`);
    
    // Step 2: Fetch existing data
    console.log('Step 2: Fetching existing data...');
    const songsSnapshot = await get(ref(database, 'songs'));
    const requestsSnapshot = await get(ref(database, 'requests'));
    const settingsSnapshot = await get(ref(database, 'settings'));
    const adsSnapshot = await get(ref(database, 'ads'));
    
    const oldSongs = songsSnapshot.val() || {};
    const oldRequests = requestsSnapshot.val() || {};
    const oldSettings = settingsSnapshot.val() || {};
    const oldAds = adsSnapshot.val() || {};
    
    console.log(`✓ Found ${Object.keys(oldSongs).length} songs`);
    console.log(`✓ Found ${Object.keys(oldRequests).length} requests`);
    console.log(`✓ Found settings: ${JSON.stringify(oldSettings)}`);
    console.log(`✓ Found ${Object.keys(oldAds).length} ads\n`);
    
    // Step 3: Transform songs (add new fields)
    console.log('Step 3: Transforming songs...');
    const newSongs = {};
    for (const songId in oldSongs) {
      newSongs[songId] = {
        ...oldSongs[songId],
        isLineDance: false,  // Default to false, band can update later
        isRequestable: true,  // All existing songs become requestable
        createdAt: Date.now()
      };
    }
    console.log(`✓ Transformed ${Object.keys(newSongs).length} songs\n`);
    
    // Step 4: Create band slug
    const bandName = oldSettings.bandName || 'My Band';
    const bandSlug = bandName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    console.log(`Step 4: Creating band profile...`);
    console.log(`✓ Band name: ${bandName}`);
    console.log(`✓ Band slug: ${bandSlug}\n`);
    
    // Step 5: Create new band structure
    const newBandData = {
      bandName: bandName,
      bandSlug: bandSlug,
      logoUrl: oldSettings.logoUrl || oldSettings.bandLogoUrl || '',
      venmoUsername: oldSettings.venmoUsername || '',
      socialLinks: {
        facebook: '',
        instagram: '',
        tiktok: '',
        website: '',
        spotify: '',
        youtube: ''
      },
      subscription: {
        tier: 'free',
        customAds: false,
        expiresAt: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null
      },
      settings: {
        priorityBoostPrice: oldSettings.priorityBoostPrice || 10,
        maxRequests: oldSettings.maxRequests || 10,
        isLive: false
      },
      songs: newSongs,
      setList: {},  // Empty set list, band will create
      requests: oldRequests,
      ads: oldAds
    };
    
    console.log('Step 5: Writing new band data...');
    await set(ref(database, `bands/${bandId}`), newBandData);
    console.log(`✓ Band data written to bands/${bandId}\n`);
    
    // Step 6: Update band directory
    console.log('Step 6: Updating band directory...');
    await set(ref(database, `bandDirectory/${bandSlug}`), {
      bandId: bandId,
      bandName: bandName,
      logoUrl: newBandData.logoUrl,
      isLive: false,
      lastActive: Date.now()
    });
    console.log(`✓ Band added to directory\n`);
    
    // Step 7: Backup old data (don't delete yet)
    console.log('Step 7: Backing up old data...');
    await set(ref(database, `_backup_${Date.now()}`), {
      songs: oldSongs,
      requests: oldRequests,
      settings: oldSettings,
      ads: oldAds
    });
    console.log(`✓ Old data backed up\n`);
    
    console.log('✅ MIGRATION COMPLETE!\n');
    console.log('Next steps:');
    console.log('1. Test the new band app with these credentials:');
    console.log(`   Email: ${bandEmail}`);
    console.log(`   Password: ${bandPassword}`);
    console.log('2. Once confirmed working, manually delete old data nodes:');
    console.log('   - /songs');
    console.log('   - /requests');
    console.log('   - /settings');
    console.log('   - /ads');
    console.log('3. Change your band password in the app');
    console.log('4. Your backup is stored at /_backup_[timestamp]');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Full error:', error.message);
  }
}

// ============================================================================
// HELPER FUNCTIONS FOR NEW SYSTEM
// ============================================================================

/**
 * Check if band has reached their song limit
 */
function canAddSong(subscription, currentSongCount) {
  const tier = subscription.tier || 'free';
  const limit = SUBSCRIPTION_LIMITS[tier].maxMasterListSongs;
  return currentSongCount < limit;
}

/**
 * Check if band can mark more songs as requestable
 */
function canMarkRequestable(subscription, currentRequestableCount) {
  const tier = subscription.tier || 'free';
  const limit = SUBSCRIPTION_LIMITS[tier].maxRequestableSongs;
  return limit === -1 || currentRequestableCount < limit;
}

/**
 * Generate band slug from name
 */
function generateBandSlug(bandName) {
  return bandName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Check if slug is available
 */
async function isSlugAvailable(slug) {
  const snapshot = await get(ref(database, `bandDirectory/${slug}`));
  return !snapshot.exists();
}

/**
 * Get requestable songs not in tonight's set list
 */
async function getAvailableRequestSongs(bandId) {
  // Get all songs
  const songsSnapshot = await get(ref(database, `bands/${bandId}/songs`));
  const allSongs = songsSnapshot.val() || {};
  
  // Get set list
  const setListSnapshot = await get(ref(database, `bands/${bandId}/setList`));
  const setList = setListSnapshot.val() || {};
  
  // Get set list song IDs
  const setListSongIds = Object.values(setList)
    .filter(item => item.type === 'song')
    .map(item => item.songId);
  
  // Get confirmed requests
  const requestsSnapshot = await get(ref(database, `bands/${bandId}/requests`));
  const requests = requestsSnapshot.val() || {};
  const confirmedRequestSongIds = Object.values(requests)
    .filter(req => req.status === 'confirmed')
    .map(req => req.songId);
  
  // Filter available songs
  const available = Object.values(allSongs).filter(song => 
    song.isRequestable && 
    !setListSongIds.includes(song.id) &&
    !confirmedRequestSongIds.includes(song.id)
  );
  
  return available;
}

// ============================================================================
// FIREBASE SECURITY RULES (RECOMMENDED)
// ============================================================================

const RECOMMENDED_SECURITY_RULES = `
{
  "rules": {
    "bands": {
      "$bandId": {
        // Band can read/write their own data
        ".read": "auth.uid === $bandId",
        ".write": "auth.uid === $bandId",
        
        // Public read access to specific fields for customer app
        "bandName": { ".read": true },
        "bandSlug": { ".read": true },
        "logoUrl": { ".read": true },
        "socialLinks": { ".read": true },
        "settings": { 
          "isLive": { ".read": true }
        },
        "songs": { ".read": true },
        "setList": { ".read": true },
        "ads": { ".read": true },
        
        // Requests can be created by anyone (customers)
        "requests": {
          ".read": true,
          "$requestId": {
            ".write": "!data.exists() || auth.uid === $bandId"
          }
        }
      }
    },
    
    "bandDirectory": {
      ".read": true,
      "$slug": {
        ".write": false  // Only writable by band through their authenticated endpoint
      }
    }
  }
}
`;

// ============================================================================
// EXPORT MIGRATION FUNCTION
// ============================================================================

// Uncomment to run migration:
 migrateToMultiBand();

export {
  DATABASE_SCHEMA,
  SUBSCRIPTION_LIMITS,
  ADDON_CUSTOM_ADS,
  migrateToMultiBand,
  canAddSong,
  canMarkRequestable,
  generateBandSlug,
  isSlugAvailable,
  getAvailableRequestSongs,
  RECOMMENDED_SECURITY_RULES
};
