import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { database } from '../../firebaseConfig';
import { ref, onValue } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_BANDS_KEY = 'recentBands';

export default function BandSelectionScreen({ navigation }) {
  const [bands, setBands] = useState([]);
  const [filteredBands, setFilteredBands] = useState([]);
  const [recentBands, setRecentBands] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Load all bands from directory
    const bandsRef = ref(database, 'bandDirectory');
    const unsubscribe = onValue(bandsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const bandList = Object.values(data).sort((a, b) =>
          a.bandName.localeCompare(b.bandName)
        );
        setBands(bandList);
        setFilteredBands(bandList);
      }
    });

    // Load recent bands from AsyncStorage
    loadRecentBands();

    return unsubscribe;
  }, []);

  const loadRecentBands = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_BANDS_KEY);
      if (stored) {
        const recentIds = JSON.parse(stored);
        // Get full band info for recent bands
        const recents = bands.filter(b => recentIds.includes(b.bandId));
        setRecentBands(recents);
      }
    } catch (e) {
      console.error('Failed to load recent bands:', e);
    }
  };

  const saveRecentBand = async (bandId) => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_BANDS_KEY);
      let recentIds = stored ? JSON.parse(stored) : [];

      // Remove if exists, then add to front
      recentIds = recentIds.filter(id => id !== bandId);
      recentIds.unshift(bandId);

      // Keep only last 5
      recentIds = recentIds.slice(0, 5);

      await AsyncStorage.setItem(RECENT_BANDS_KEY, JSON.stringify(recentIds));
    } catch (e) {
      console.error('Failed to save recent band:', e);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (!text) {
      setFilteredBands(bands);
    } else {
      setFilteredBands(
        bands.filter(b =>
          b.bandName.toLowerCase().includes(text.toLowerCase())
        )
      );
    }
  };

  const selectBand = async (band) => {
    await saveRecentBand(band.bandId);
    navigation.navigate('BandTabs', { bandId: band.bandId, bandSlug: band.bandSlug, bandName: band.bandName });
  };

  const renderBandItem = ({ item }) => (
    <TouchableOpacity style={styles.bandCard} onPress={() => selectBand(item)}>
      {item.logoUrl ? (
        <Image source={{ uri: item.logoUrl }} style={styles.bandLogo} />
      ) : (
        <View style={styles.bandLogoPlaceholder}>
          <Text style={styles.bandLogoText}>🎸</Text>
        </View>
      )}
      <View style={styles.bandInfo}>
        <Text style={styles.bandName}>{item.bandName}</Text>
        {item.isLive && (
          <View style={styles.liveBadge}>
            <Text style={styles.liveText}>● LIVE NOW</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B4513" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎸 Live Jukebox</Text>
        <Text style={styles.headerSubtitle}>Select a Band</Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search bands..."
        placeholderTextColor="#999"
        value={searchQuery}
        onChangeText={handleSearch}
      />

      <FlatList
        data={filteredBands}
        renderItem={renderBandItem}
        keyExtractor={(item) => item.bandId}
        contentContainerStyle={styles.bandList}
        ListHeaderComponent={
          recentBands.length > 0 && !searchQuery ? (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Recently Viewed</Text>
              {recentBands.map((band) => (
                <TouchableOpacity
                  key={band.bandId}
                  style={styles.bandCard}
                  onPress={() => selectBand(band)}
                >
                  {band.logoUrl ? (
                    <Image source={{ uri: band.logoUrl }} style={styles.bandLogo} />
                  ) : (
                    <View style={styles.bandLogoPlaceholder}>
                      <Text style={styles.bandLogoText}>🎸</Text>
                    </View>
                  )}
                  <View style={styles.bandInfo}>
                    <Text style={styles.bandName}>{band.bandName}</Text>
                    {band.isLive && (
                      <View style={styles.liveBadge}>
                        <Text style={styles.liveText}>● LIVE NOW</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
              <Text style={styles.sectionTitle}>All Bands</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No bands found</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    backgroundColor: '#8B4513',
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
  },
  searchInput: {
    backgroundColor: '#2a2a2a',
    margin: 15,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#444',
  },
  bandList: {
    padding: 15,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    marginTop: 10,
  },
  bandCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  bandLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  bandLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#444',
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bandLogoText: {
    fontSize: 30,
  },
  bandInfo: {
    flex: 1,
  },
  bandName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  liveBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
});