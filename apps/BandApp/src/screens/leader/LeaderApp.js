
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
import { database } from '../../../firebaseConfig';
import { ref, onValue, update, get} from 'firebase/database';
import { auth } from '../../../firebaseConfig';
import { ActivityIndicator } from 'react-native';
  

export default function BandLeaderApp() {
  const [confirmedRequests, setConfirmedRequests] = useState([]);
  const [settings, setSettings] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [bandId, setBandId] = useState(null);
  const [allRequests, setAllRequests] = useState([]);
  const [songs, setSongs] = useState([]);
  const settingsRef2 = React.useRef({});
  
  useEffect(() => {
  const user = auth.currentUser;
  if (user) {
    const bandDirRef = ref(database, 'bandDirectory');
    get(bandDirRef).then((snapshot) => {
      const data = snapshot.val();
      if (data) {
        const ourBand = Object.values(data).find(b => b.authUid === user.uid);
        if (ourBand) {
          setBandId(ourBand.bandSlug);
        }
      }
    });
  }
}, []);

useEffect(() => {
  if (!bandId) return; // DON'T load data until we have bandId
  
  // Load only confirmed requests
  const requestsRef = ref(database, `bands/${bandId}/requests`);
const unsubscribe = onValue(requestsRef, (snapshot) => {
  const data = snapshot.val();
  if (data) {
    const all = Object.values(data).filter(req => req.status !== 'played');
    setAllRequests(all);

    const isVoteMode = settingsRef2.current.requestMode === 'vote';
    console.log('isVoteMode:', isVoteMode, 'requestMode:', settingsRef2.current.requestMode);

if (isVoteMode) {
      // Vote mode: sort by vote count, show top 5
      const songVoteCounts = {};
      all.forEach(req => {
        if (!songVoteCounts[req.songId]) {
          songVoteCounts[req.songId] = {
            songId: req.songId,
            songTitle: req.songTitle,
            artist: req.artist,
            votes: 0,
            firstTimestamp: req.timestamp,
          };
        }
        songVoteCounts[req.songId].votes++;
        if (req.timestamp < songVoteCounts[req.songId].firstTimestamp) {
          songVoteCounts[req.songId].firstTimestamp = req.timestamp;
        }
      });

      console.log('songVoteCounts:', JSON.stringify(songVoteCounts));
      const sorted = Object.values(songVoteCounts)
        .sort((a, b) => {
          if (b.votes !== a.votes) return b.votes - a.votes;
          return a.firstTimestamp - b.firstTimestamp;
        })
        .slice(0, 5); // Top 5 only

      setConfirmedRequests(sorted);
    } else {
      // Paid mode: show confirmed requests
      const confirmed = all
        .filter(req => req.status === 'confirmed')
        .sort((a, b) => {
          if (a.priorityBoost && !b.priorityBoost) return -1;
          if (!a.priorityBoost && b.priorityBoost) return 1;
          return a.timestamp - b.timestamp;
        });
      setConfirmedRequests(confirmed);
    }
  } else {
    setConfirmedRequests([]);
    setAllRequests([]);
  }
});

 // Load settings
const settingsRef = ref(database, `bands/${bandId}/settings`);
const settingsUnsub = onValue(settingsRef, (snapshot) => {
  const data = snapshot.val();
  if (data) {
    setSettings(data);
    settingsRef2.current = data;
    console.log('Leader settings:', JSON.stringify(data));

    // Re-trigger request processing now that settings are loaded
    const requestsSnapshot = ref(database, `bands/${bandId}/requests`);
    get(requestsSnapshot).then((snap) => {
      const reqData = snap.val();
      if (reqData) {
        const all = Object.values(reqData).filter(req => req.status !== 'played');
        setAllRequests(all);
        const isVoteMode = data.requestMode === 'vote';
        console.log('Re-processing with isVoteMode:', isVoteMode);
        if (isVoteMode) {
          const songVoteCounts = {};
          all.forEach(req => {
            if (!songVoteCounts[req.songId]) {
              songVoteCounts[req.songId] = {
                songId: req.songId,
                songTitle: req.songTitle,
                artist: req.artist,
                votes: 0,
                firstTimestamp: req.timestamp,
              };
            }
            songVoteCounts[req.songId].votes++;
            if (req.timestamp < songVoteCounts[req.songId].firstTimestamp) {
              songVoteCounts[req.songId].firstTimestamp = req.timestamp;
            }
          });
          const sorted = Object.values(songVoteCounts)
            .sort((a, b) => {
              if (b.votes !== a.votes) return b.votes - a.votes;
              return a.firstTimestamp - b.firstTimestamp;
            })
            .slice(0, 5);
          setConfirmedRequests(sorted);
        }
      }
    });
  }
});
  return () => {
    unsubscribe();
    settingsUnsub();
  };
}, [bandId]); // ← IMPORTANT: Re-run when bandId changes

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const markAsPlayed = async (item) => {
  const isVoteMode = settingsRef2.current.requestMode === 'vote';

  try {
    if (isVoteMode) {
      // In vote mode, mark ALL votes for this song as played
      const updates = {};
      allRequests
        .filter(req => req.songId === item.songId)
        .forEach(req => {
          updates[`bands/${bandId}/requests/${req.id}/status`] = 'played';
          updates[`bands/${bandId}/requests/${req.id}/playedTimestamp`] = Date.now();
        });
      await update(ref(database), updates);
    } else {
      // In paid mode, mark single request as played
      const requestRef = ref(database, `bands/${bandId}/requests/${item.id}`);
      await update(requestRef, {
        status: 'played',
        playedTimestamp: Date.now()
      });
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to mark as played.');
    console.error(error);
  }
};

  const renderRequest = ({ item, index }) => {
  const isVoteMode = settings.requestMode === 'vote';

  return (
    <View style={[
      styles.requestCard,
      !isVoteMode && item.priorityBoost && styles.priorityCard,
      index === 0 && styles.nextSongCard
    ]}>
      {index === 0 && (
        <View style={styles.nextBadge}>
          <Text style={styles.nextBadgeText}>▶ NEXT UP</Text>
        </View>
      )}

      {!isVoteMode && item.priorityBoost && (
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
        {isVoteMode ? (
          <Text style={styles.voteCount}>🗳️ {item.votes} votes</Text>
        ) : (
          <>
            <Text style={styles.customerName}>👤 {item.customerName}</Text>
            <Text style={styles.price}>
              ${item.priorityBoost ? item.price + settings.priorityBoostPrice : item.price}
            </Text>
          </>
        )}
      </View>

      <TouchableOpacity
        style={styles.playedButton}
        onPress={() => markAsPlayed(item)}
      >
        <Text style={styles.playedButtonText}>✓ Mark as Played</Text>
      </TouchableOpacity>
    </View>
  );
};

if (!bandId) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9C27B0" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎤 Band Leader</Text>
        <View style={styles.headerStats}>
          <Text style={styles.statsText}>
  {settings.requestMode === 'vote' ? `Top ${confirmedRequests.length} 🗳️` : `Queue: ${confirmedRequests.length}`}
</Text>
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
        style={{ flex: 1 }}
        data={confirmedRequests}
        renderItem={renderRequest}
        keyExtractor={(item) => item.id || item.songId}
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
    backgroundColor: '#1a1a1a'
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

  filterRow: {
  flexDirection: 'row',
  padding: 15,
  gap: 10,
},

filterButton: {
  flex: 1,
  backgroundColor: '#2a2a2a',
  padding: 12,
  borderRadius: 8,
  alignItems: 'center',
  borderWidth: 2,
  borderColor: '#2a2a2a',
},
filterButtonActive: {
  borderColor: '#2c5282',
  backgroundColor: '#1a3a5a',
},
filterButtonText: {
  color: '#fff',
  fontSize: 14,
  fontWeight: 'bold',
},
masterListCard: {
  backgroundColor: '#2a2a2a',
  borderRadius: 12,
  padding: 15,
  marginBottom: 15,
  borderLeftWidth: 4,
  borderLeftColor: '#2c5282',
},
masterListHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
},
masterListInfo: {
  flex: 1,
},
masterListTitle: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#fff',
  marginBottom: 4,
},
masterListArtist: {
  fontSize: 14,
  color: '#aaa',
},
masterListPrice: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#4CAF50',
},
toggleRow: {
  flexDirection: 'row',
  gap: 10,
  marginBottom: 12,
},
toggleButton: {
  flex: 1,
  backgroundColor: '#1a1a1a',
  padding: 10,
  borderRadius: 6,
  alignItems: 'center',
  borderWidth: 2,
  borderColor: '#444',
},
toggleButtonActive: {
  borderColor: '#4CAF50',
  backgroundColor: '#1a3a1a',
},
toggleButtonText: {
  color: '#fff',
  fontSize: 13,
  fontWeight: 'bold',
},
voteCount: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#fbbf24',
},
loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
});
