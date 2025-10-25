// BandLeaderApp.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl
} from 'react-native';
import { database } from './firebaseConfig';
import { ref, onValue, update } from 'firebase/database';

export default function BandLeaderApp() {
  const [confirmedRequests, setConfirmedRequests] = useState([]);
  const [settings, setSettings] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Load only confirmed requests
    const requestsRef = ref(database, 'requests');
    onValue(requestsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const confirmed = Object.values(data)
          .filter(req => req.status === 'confirmed')
          .sort((a, b) => {
            // Priority songs first
            if (a.priorityBoost && !b.priorityBoost) return -1;
            if (!a.priorityBoost && b.priorityBoost) return 1;
            // Then by timestamp
            return a.timestamp - b.timestamp;
          });
        setConfirmedRequests(confirmed);
      } else {
        setConfirmedRequests([]);
      }
    });

    // Load settings
    const settingsRef = ref(database, 'settings');
    onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSettings(data);
      }
    });
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const markAsPlayed = async (request) => {
    Alert.alert(
      'Mark as Played',
      `Mark "${request.songTitle}" as played?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Played',
          onPress: async () => {
            try {
              const requestRef = ref(database, `requests/${request.id}`);
              await update(requestRef, {
                status: 'played',
                playedTimestamp: Date.now()
              });
              Alert.alert('✓', 'Song marked as played!');
            } catch (error) {
              Alert.alert('Error', 'Failed to mark as played.');
              console.error(error);
            }
          }
        }
      ]
    );
  };

  const renderRequest = ({ item, index }) => (
    <View style={[
      styles.requestCard,
      item.priorityBoost && styles.priorityCard,
      index === 0 && styles.nextSongCard
    ]}>
      {index === 0 && (
        <View style={styles.nextBadge}>
          <Text style={styles.nextBadgeText}>▶ NEXT UP</Text>
        </View>
      )}
      
      {item.priorityBoost && (
        <View style={styles.priorityBadge}>
          <Text style={styles.priorityBadgeText}>⚡ PRIORITY</Text>
        </View>
      )}

      <View style={styles.queueNumber}>
        <Text style={styles.queueNumberText}>#{index + 1}</Text>
      </View>

      <Text style={styles.songTitle}>{item.songTitle}</Text>
      <Text style={styles.artist}>{item.artist}</Text>
      
      <View style={styles.infoRow}>
        <Text style={styles.customerName}>👤 {item.customerName}</Text>
        <Text style={styles.price}>
          ${item.priorityBoost ? item.price + settings.priorityBoostPrice : item.price}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.playedButton}
        onPress={() => markAsPlayed(item)}
      >
        <Text style={styles.playedButtonText}>✓ Mark as Played</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎤 Band Leader</Text>
        <View style={styles.headerStats}>
          <Text style={styles.statsText}>Queue: {confirmedRequests.length}</Text>
        </View>
      </View>

      {confirmedRequests.length > 0 && (
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            Next: {confirmedRequests[0].songTitle}
          </Text>
        </View>
      )}

      <FlatList
        data={confirmedRequests}
        renderItem={renderRequest}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎵</Text>
            <Text style={styles.emptyText}>No songs in queue</Text>
            <Text style={styles.emptySubtext}>Waiting for confirmed requests...</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#9C27B0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerStats: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  summaryBar: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#9C27B0',
  },
  summaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  listContainer: {
    padding: 15,
  },
  requestCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    position: 'relative',
  },
  nextSongCard: {
    borderLeftColor: '#FFD700',
    borderLeftWidth: 6,
    backgroundColor: '#2d2a1f',
  },
  priorityCard: {
    borderLeftColor: '#FF6B6B',
  },
  nextBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  nextBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  priorityBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  queueNumber: {
    position: 'absolute',
    top: 15,
    left: -20,
    backgroundColor: '#9C27B0',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1a1a1a',
  },
  queueNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  songTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
    marginTop: 10,
  },
  artist: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  customerName: {
    fontSize: 14,
    color: '#ccc',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  playedButton: {
    backgroundColor: '#9C27B0',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  playedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
  },
});
