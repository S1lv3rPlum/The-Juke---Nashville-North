import * as Linking from 'expo-linking';

// Deep link prefix
const prefix = Linking.createURL('/');

// Linking configuration
export const linking = {
  prefixes: [prefix, 'livejukebox://'],
  config: {
    screens: {
      BandSelection: 'home',
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
export const handleDeepLink = async (url, navigation, database) => {
  if (!url) return;

  // Parse URL: livejukebox://band/nashville-ramblers
  const { path, queryParams } = Linking.parse(url);

  if (path && path.startsWith('band/')) {
    const bandSlug = path.replace('band/', '');
    
    // Get bandId from slug
    const { ref, get } = await import('firebase/database');
    const bandRef = ref(database, `bandDirectory/${bandSlug}`);
    const snapshot = await get(bandRef);
    
    if (snapshot.exists()) {
      const bandData = snapshot.val();
      navigation.navigate('BandTabs', {
        bandId: bandData.bandId,
        bandSlug: bandSlug,
      });
    }
  }
};