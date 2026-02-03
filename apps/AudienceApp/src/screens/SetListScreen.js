import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { database } from '../../firebaseConfig';
import { ref, onValue } from 'firebase/database';
import { LinearGradient } from 'expo-linear-gradient';

// Commenting out AdCarousel temporarily to isolate the crash
// import AdCarousel from '../components/AdCarousel';

export default function SetListScreen({ bandId, route, navigation }) {
  const bandName = route?.params?.bandName;
  const [setList, setSetList] = useState([]);
  const [songs, setSongs] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!bandId) {
      console.log('No bandId provided');
      return;
    }

    console.log('Loading data for bandId:', bandId);

    // Load songs (to get line dance info)
    const songsRef = ref(database, `bands/${bandId}/songs`);
    const songsUnsub = onValue(songsRef, (snapshot) => {
      const data = snapshot.val();
      console.log('Songs loaded:', data ? Object.keys(data).length : 0);
      if (data) {
        setSongs(data);
      }
    }, (error) => {
      console.error('Error loading songs:', error);
    });

    // Load set list
    const setListRef = ref(database, `bands/${bandId}/setList`);
    const setListUnsub = onValue(setListRef, (snapshot) => {
      const data = snapshot.val();
      console.log('SetList loaded:', data ? Object.keys(data).length : 0);
      if (data) {
        const items = Object.values(data).sort((a, b) => a.order - b.order);
        setSetList(items);
      } else {
        setSetList([]);
      }
    }, (error) => {
      console.error('Error loading setList:', error);
    });

    return () => {
      songsUnsub();
      setListUnsub();
    };
  }, [bandId]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderSetListItem = ({ item, index }) => {
    if (item.type === 'break') {
      // BREAK - Subdued gray style
      return (
        <View style={styles.breakCard}>
          <View style={styles.breakNumberContainer}>
            <Text style={styles.breakNumber}>{index + 1}</Text>
          </View>
          <View style={styles.breakInfo}>
            <Text style={styles.breakText}>⏸️ Break</Text>
            <Text style={styles.breakDuration}>{item.breakDuration} minutes</Text>
          </View>
        </View>
      );
    }

    // Song item - Eye-catching with glow!
    const song = songs[item.songId];
    if (!song) {
      console.log('Song not found for songId:', item.songId);
      return null;
    }

    return (
      <TouchableOpacity activeOpacity={0.8} style={styles.songCardWrapper}>
        {/* Glow layers */}
        <View style={styles.glowLayer1} />
        <View style={styles.glowLayer2} />
        
        {/* Main card */}
        <LinearGradient
          colors={['#1e293b', '#0f172a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.songCard}
        >
          <View style={styles.songNumberContainer}>
            <LinearGradient
              colors={['#f59e0b', '#ea580c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.songNumberGradient}
            >
              <Text style={styles.songNumber}>{index + 1}</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.songInfo}>
            <View style={styles.songTitleRow}>
              <Text style={styles.songTitle}>{song.title}</Text>
              {song.isLineDance && <Text style={styles.bootIcon}>👢</Text>}
            </View>
            <Text style={styles.songArtist}>{song.artist}</Text>
          </View>
          
          <View style={styles.hoverIndicator} />
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={['#020617', '#0f172a', '#020617']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {setList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎵</Text>
          <Text style={styles.emptyText}>No set list yet</Text>
          <Text style={styles.emptySubtext}>The band will add songs soon!</Text>
        </View>
      ) : (
        <FlatList
          data={setList}
          renderItem={renderSetListItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#f59e0b"
            />
          }
        />
      )}
      
      {/* AdCarousel temporarily commented out - uncomment after testing */}
      {/* <AdCarousel /> */}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100, // Extra space at bottom for ad carousel later
  },
  
  // BREAK STYLES - Subdued
  breakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#475569',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  breakNumberContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  breakNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#cbd5e1',
  },
  breakInfo: {
    flex: 1,
  },
  breakText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
  },
  breakDuration: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  
  // SONG STYLES - Eye-catching with glow!
  songCardWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  glowLayer1: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    backgroundColor: '#f59e0b',
    borderRadius: 16,
    opacity: 0.4,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 15,
  },
  glowLayer2: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    backgroundColor: '#fbbf24',
    borderRadius: 18,
    opacity: 0.3,
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 25,
    elevation: 20,
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.6)',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 10,
  },
  songNumberContainer: {
    marginRight: 16,
  },
  songNumberGradient: {
    width: 56,
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  songNumber: {
    fontSize: 24,
    fontWeight: 'black',
    color: '#fff',
  },
  songInfo: {
    flex: 1,
  },
  songTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  songTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  bootIcon: {
    fontSize: 24,
    marginLeft: 8,
  },
  songArtist: {
    fontSize: 16,
    color: '#fbbf24',
    fontWeight: '500',
  },
  hoverIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#f59e0b',
    opacity: 0,
  },
  
  // EMPTY STATE
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#64748b',
    fontSize: 14,
  },
});