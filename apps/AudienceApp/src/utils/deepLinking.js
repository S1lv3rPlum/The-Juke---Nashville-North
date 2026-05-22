import * as Linking from 'expo-linking';
import { ref, get } from 'firebase/database';
import { database } from '../../firebaseConfig';

// Deep link prefix
const prefix = Linking.createURL('/');

// Linking configuration
export const linking = {
  prefixes: [prefix, 'livejukebox://'],
  config: {
    screens: {
      BandSelection: '',
      BandTabs: {
        path: 'band/:bandSlug',
        parse: {
          bandSlug: (bandSlug) => bandSlug,
        },
      },
    },
  },
};

// Helper to handle incoming deep links
export const handleDeepLink = async (url, navigation, db) => {
  if (!url) return;

  const { path } = Linking.parse(url);

  if (path && path.startsWith('band/')) {
    const bandSlug = path.replace('band/', '');
    const bandRef = ref(database, `bandDirectory/${bandSlug}`);
    const snapshot = await get(bandRef);

    if (snapshot.exists()) {
      const bandData = snapshot.val();
      navigation.navigate('BandTabs', {
        bandId: bandData.bandId,
        bandSlug: bandSlug,
        bandName: bandData.bandName,
      });
    }
  }
};

// Call this on app start to handle initial URL
export const handleInitialURL = async (navigation) => {
  try {
    const url = await Linking.getInitialURL();
    if (url) {
      await handleDeepLink(url, navigation, database);
    }
  } catch (e) {
    console.log('Error handling initial URL', e);
  }
};