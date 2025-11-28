// ManagerApp.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  Vibration,
} from 'react-native';
import { database } from '../../../firebaseConfig';
import { ref, onValue, update, remove, push, set, get } from 'firebase/database';

export default function ManagerApp() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [confirmedRequests, setConfirmedRequests] = useState([]);
  const [songs, setSongs] = useState([]);
  const [settings, setSettings] = useState({});
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [songModalVisible, setSongModalVisible] = useState(false);
  const [editSongModalVisible, setEditSongModalVisible] = useState(false);
  const [newPriorityPrice, setNewPriorityPrice] = useState('');
  const [newMaxRequests, setNewMaxRequests] = useState('');
  const [newVenmoUsername, setNewVenmoUsername] = useState('');
  const [previousPendingCount, setPreviousPendingCount] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'confirmed', 'songs'
  
  // New song form
  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongArtist, setNewSongArtist] = useState('');
  const [newSongPrice, setNewSongPrice] = useState('5');
  
  // Edit song
  const [editingSong, setEditingSong] = useState(null);
  const [editSongTitle, setEditSongTitle] = useState('');
  const [editSongArtist, setEditSongArtist] = useState('');
  const [editSongPrice, setEditSongPrice] = useState('');

  useEffect(() => {
    // Load all requests
    const requestsRef = ref(database, 'requests');
    onValue(requestsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allRequests = Object.values(data);
        
        const pending = allRequests
          .filter(req => req.status === 'pending')
          .sort((a, b) => {
            if (a.priorityBoost && !b.priorityBoost) return -1;
            if (!a.priorityBoost && b.priorityBoost) return 1;
            return a.timestamp - b.timestamp;
          });

        const confirmed = allRequests
          .filter(req => req.status === 'confirmed')
          .sort((a, b) => {
            if (a.priorityBoost && !b.priorityBoost) return -1;
            if (!a.priorityBoost && b.priorityBoost) return 1;
            return a.timestamp - b.timestamp;
          });

        // Check if new pending request arrived and vibrate
        if (pending.length > previousPendingCount && previousPendingCount > 0) {
          Vibration.vibrate([0, 500, 200, 500]);
        }

        setPendingRequests(pending);
        setConfirmedRequests(confirmed);
        setPreviousPendingCount(pending.length);
      } else {
        setPendingRequests([]);
        setConfirmedRequests([]);
      }
    });

    // Load songs
    const songsRef = ref(database, 'songs');
    onValue(songsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const songList = Object.values(data).sort((a, b) => 
          a.title.localeCompare(b.title)
        );
        setSongs(songList);
      } else {
        setSongs([]);
      }
    });

    // Load settings
    const settingsRef = ref(database, 'settings');
    onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSettings(data);
        setNewPriorityPrice(data.priorityBoostPrice?.toString() || '10');
        setNewMaxRequests(data.maxRequests?.toString() || '10');
        setNewVenmoUsername(data.venmoUsername || '');
      }
    });
  }, [previousPendingCount]);

  const confirmPayment = async (request) => {
    Alert.alert(
      'Confirm Payment',
      `Confirm payment received for "${request.songTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const requestRef = ref(database, `requests/${request.id}`);
              await update(requestRef, { status: 'confirmed' });
              Alert.alert('Success', 'Payment confirmed!');
            } catch (error) {
              Alert.alert('Error', 'Failed to confirm payment.');
              console.error(error);
            }
          }
        }
      ]
    );
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
              Alert.alert('Success', 'Song marked as played!');
            } catch (error) {
              Alert.alert('Error', 'Failed to mark as played.');
              console.error(error);
            }
          }
        }
      ]
    );
  };

  const deleteRequest = async (request) => {
    Alert.alert(
      'Delete Request',
      `Delete request for "${request.songTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const requestRef = ref(database, `requests/${request.id}`);
              await remove(requestRef);
              Alert.alert('Success', 'Request deleted.');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete request.');
              console.error(error);
            }
          }
        }
      ]
    );
  };

 const updateSettings = async () => {
  const price = parseFloat(newPriorityPrice);
  const maxReq = parseInt(newMaxRequests);
  
  if (isNaN(price) || price < 0) {
    Alert.alert('Invalid Price', 'Please enter a valid priority boost price.');
    return;
  }
  
  if (isNaN(maxReq) || maxReq < 1) {
    Alert.alert('Invalid Number', 'Please enter a valid number for max requests (minimum 1).');
    return;
  }

  if (!newVenmoUsername.trim()) {
    Alert.alert('Missing Info', 'Please enter your Venmo username.');
    return;
  }

  try {
    const settingsRef = ref(database, 'settings');
    await update(settingsRef, { 
      priorityBoostPrice: price,
      maxRequests: maxReq,
      venmoUsername: newVenmoUsername.trim()
    });
    Alert.alert('Success', `Settings updated!\nPriority boost: $${price}\nMax requests: ${maxReq}\nVenmo: @${newVenmoUsername.trim()}`);
    setSettingsModalVisible(false);
  } catch (error) {
    Alert.alert('Error', 'Failed to update settings.');
    console.error(error);
  }
};

 const resetQueue = async () => {
  Alert.alert(
    'Reset Queue',
    'What would you like to reset?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear Played Songs Only',
        onPress: async () => {
          try {
            const requestsRef = ref(database, 'requests');
            const snapshot = await get(requestsRef);
            const data = snapshot.val();
            
            if (data) {
              const deletePromises = Object.keys(data)
                .filter(key => data[key].status === 'played')
                .map(key => remove(ref(database, `requests/${key}`)));
              
              await Promise.all(deletePromises);
              Alert.alert('Success', 'Played songs cleared!');
            } else {
              Alert.alert('Info', 'No played songs to clear.');
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to clear played songs.');
            console.error(error);
          }
        }
      },
      {
        text: 'Reset Entire Queue',
        style: 'destructive',
        onPress: async () => {
          try {
            const requestsRef = ref(database, 'requests');
            await remove(requestsRef);
            Alert.alert('Success', 'Queue completely reset for new show!');
          } catch (error) {
            Alert.alert('Error', 'Failed to reset queue.');
            console.error(error);
          }
        }
      }
    ]
  );
};
  const addSong = async () => {
    if (!newSongTitle.trim() || !newSongArtist.trim()) {
      Alert.alert('Missing Info', 'Please enter both title and artist.');
      return;
    }

    const price = parseFloat(newSongPrice);
    if (isNaN(price) || price < 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price.');
      return;
    }

    try {
      const songsRef = ref(database, 'songs');
      const newSongRef = push(songsRef);
      
      await set(newSongRef, {
  id: newSongRef.key,
  title: newSongTitle.trim(),
  artist: newSongArtist.trim(),
  price: parseFloat(newSongPrice),
  appKey: "MY_SECRET_APP_KEY"
});

      Alert.alert('Success', 'Song added to catalog!');
      setNewSongTitle('');
      setNewSongArtist('');
      setNewSongPrice('5');
      setSongModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to add song.');
      console.error(error);
    }
  };

  const openEditSong = (song) => {
    setEditingSong(song);
    setEditSongTitle(song.title);
    setEditSongArtist(song.artist);
    setEditSongPrice(song.price.toString());
    setEditSongModalVisible(true);
  };

  const updateSong = async () => {
    if (!editSongTitle.trim() || !editSongArtist.trim()) {
      Alert.alert('Missing Info', 'Please enter both title and artist.');
      return;
    }

    const price = parseFloat(editSongPrice);
    if (isNaN(price) || price < 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price.');
      return;
    }

    try {
      const songRef = ref(database, `songs/${editingSong.id}`);
      await update(songRef, {
        title: editSongTitle.trim(),
        artist: editSongArtist.trim(),
        price: price
      });

      Alert.alert('Success', 'Song updated!');
      setEditSongModalVisible(false);
      setEditingSong(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update song.');
      console.error(error);
    }
  };

  const deleteSong = async (song) => {
    Alert.alert(
      'Delete Song',
      `Remove "${song.title}" from catalog?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const songRef = ref(database, `songs/${song.id}`);
              await remove(songRef);
              Alert.alert('Success', 'Song removed from catalog.');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete song.');
              console.error(error);
            }
          }
        }
      ]
    );
  };

  const renderPendingRequest = ({ item }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Text style={styles.songTitle}>
          {item.songTitle}
          {item.priorityBoost && ' ⚡'}
        </Text>
        <Text style={styles.priceText}>
          ${item.priorityBoost ? item.price + settings.priorityBoostPrice : item.price}
        </Text>
      </View>
      
      <Text style={styles.artist}>{item.artist}</Text>
      <Text style={styles.customerName}>👤 {item.customerName}</Text>
      
      <View style={styles.infoRow}>
        <Text style={styles.paymentMethod}>
          💳 {item.paymentMethod === 'venmo' ? 'Venmo' : 'Cash'}
        </Text>
        <Text style={styles.timestamp}>
          🕒 {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.confirmButton]}
          onPress={() => confirmPayment(item)}
        >
          <Text style={styles.buttonText}>✓ Confirm Payment</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={() => deleteRequest(item)}
        >
          <Text style={styles.buttonText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderConfirmedRequest = ({ item }) => (
    <View style={[styles.requestCard, styles.confirmedCard]}>
      <View style={styles.requestHeader}>
        <Text style={styles.songTitle}>
          {item.songTitle}
          {item.priorityBoost && ' ⚡'}
        </Text>
        <Text style={styles.priceText}>
          ${item.priorityBoost ? item.price + settings.priorityBoostPrice : item.price}
        </Text>
      </View>
      
      <Text style={styles.artist}>{item.artist}</Text>
      <Text style={styles.customerName}>👤 {item.customerName}</Text>
      
      <View style={styles.infoRow}>
        <Text style={styles.confirmedBadge}>✓ PAID</Text>
        <Text style={styles.timestamp}>
          🕒 {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.playedButton]}
          onPress={() => markAsPlayed(item)}
        >
          <Text style={styles.buttonText}>✓ Mark as Played</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={() => deleteRequest(item)}
        >
          <Text style={styles.buttonText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSongItem = ({ item }) => (
    <View style={styles.songCard}>
      <View style={styles.songCardHeader}>
        <View style={styles.songCardInfo}>
          <Text style={styles.songCardTitle}>{item.title}</Text>
          <Text style={styles.songCardArtist}>{item.artist}</Text>
        </View>
        <Text style={styles.songCardPrice}>${item.price}</Text>
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={() => openEditSong(item)}
        >
          <Text style={styles.buttonText}>✎ Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={() => deleteSong(item)}
        >
          <Text style={styles.buttonText}>✕ Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manager Dashboard</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setSettingsModalVisible(true)}
        >
          <Text style={styles.settingsButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pending ({pendingRequests.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'confirmed' && styles.activeTab]}
          onPress={() => setActiveTab('confirmed')}
        >
          <Text style={[styles.tabText, activeTab === 'confirmed' && styles.activeTabText]}>
            Confirmed ({confirmedRequests.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'songs' && styles.activeTab]}
          onPress={() => setActiveTab('songs')}
        >
          <Text style={[styles.tabText, activeTab === 'songs' && styles.activeTabText]}>
            Songs ({songs.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content based on active tab */}
      {activeTab === 'pending' && (
        <FlatList
          data={pendingRequests}
          renderItem={renderPendingRequest}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No pending requests</Text>
          }
        />
      )}

      {activeTab === 'confirmed' && (
        <FlatList
          data={confirmedRequests}
          renderItem={renderConfirmedRequest}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No confirmed requests</Text>
          }
        />
      )}

      {activeTab === 'songs' && (
        <>
          <TouchableOpacity
            style={styles.addSongButton}
            onPress={() => setSongModalVisible(true)}
          >
            <Text style={styles.addSongButtonText}>+ Add New Song</Text>
          </TouchableOpacity>
          
          <FlatList
            data={songs}
            renderItem={renderSongItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No songs in catalog</Text>
            }
          />
        </>
      )}

      {/* Settings Modal */}
      <Modal
        visible={settingsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSettingsModalVisible(false)}
      >
       <View style={styles.modalOverlay}>
  <View style={styles.modalContent}>
    <Text style={styles.modalTitle}>Manager Settings</Text>

    <View style={styles.settingItem}>
      <Text style={styles.settingLabel}>Priority Boost Price ($)</Text>
      <TextInput
        style={styles.priceInput}
        value={newPriorityPrice}
        onChangeText={setNewPriorityPrice}
        keyboardType="numeric"
        placeholder="10"
      />
    </View>

    <View style={styles.settingItem}>
      <Text style={styles.settingLabel}>Max Song Requests</Text>
      <TextInput
        style={styles.priceInput}
        value={newMaxRequests}
        onChangeText={setNewMaxRequests}
        keyboardType="numeric"
        placeholder="10"
      />
    </View>

          <View style={styles.settingItem}>
  <Text style={styles.settingLabel}>Venmo Username</Text>
  <TextInput
    style={styles.priceInput}
    value={newVenmoUsername}
    onChangeText={setNewVenmoUsername}
    placeholder="your-venmo-username"
    autoCapitalize="none"
  />
</View>

  <TouchableOpacity
  style={[styles.saveButton]}
  onPress={updateSettings}
>
  <Text style={styles.saveButtonText}>Save Changes</Text>
</TouchableOpacity>

<TouchableOpacity
  style={[styles.resetButton]}
  onPress={resetQueue}
>
  <Text style={styles.resetButtonText}>🔄 Reset Queue</Text>
</TouchableOpacity>

<TouchableOpacity
  style={styles.cancelButton}
  onPress={() => setSettingsModalVisible(false)}
>
  <Text style={styles.cancelButtonText}>Cancel</Text>
</TouchableOpacity>
  </View>
</View>
      </Modal>

      {/* Add Song Modal */}
      <Modal
        visible={songModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSongModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Song</Text>

            <TextInput
              style={styles.input}
              placeholder="Song Title"
              placeholderTextColor="#999"
              value={newSongTitle}
              onChangeText={setNewSongTitle}
            />

            <TextInput
              style={styles.input}
              placeholder="Artist Name"
              placeholderTextColor="#999"
              value={newSongArtist}
              onChangeText={setNewSongArtist}
            />

            <TextInput
              style={styles.input}
              placeholder="Price"
              placeholderTextColor="#999"
              value={newSongPrice}
              onChangeText={setNewSongPrice}
              keyboardType="numeric"
            />

           <TouchableOpacity
  style={[styles.saveButton]}
  onPress={addSong}
>
  <Text style={styles.saveButtonText}>Add Song</Text>
</TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setSongModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Song Modal */}
      <Modal
        visible={editSongModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditSongModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Song</Text>

            <TextInput
              style={styles.input}
              placeholder="Song Title"
              value={editSongTitle}
              onChangeText={setEditSongTitle}
            />

            <TextInput
              style={styles.input}
              placeholder="Artist Name"
              value={editSongArtist}
              onChangeText={setEditSongArtist}
            />

            <TextInput
              style={styles.input}
              placeholder="Price"
              value={editSongPrice}
              onChangeText={setEditSongPrice}
              keyboardType="numeric"
            />

            <TouchableOpacity
  style={[styles.saveButton]}
  onPress={updateSong}
>
  <Text style={styles.saveButtonText}>Update Song</Text>
</TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setEditSongModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#2c5282',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  settingsButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 8,
  },
  settingsButtonText: {
    fontSize: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4299e1',
  },
  tabText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#4299e1',
  },
  listContainer: {
    padding: 15,
  },
  requestCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  confirmedCard: {
    borderLeftColor: '#4CAF50',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  songTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  artist: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  paymentMethod: {
    fontSize: 13,
    color: '#fff',
    backgroundColor: '#3D95CE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  confirmedBadge: {
    fontSize: 13,
    color: '#fff',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 13,
    color: '#888',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  playedButton: {
    backgroundColor: '#9C27B0',
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#f44336',
    flex: 0.3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addSongButton: {
    backgroundColor: '#4CAF50',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addSongButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  songCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  songCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  songCardInfo: {
    flex: 1,
  },
  songCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  songCardArtist: {
    fontSize: 14,
    color: '#aaa',
  },
  songCardPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  emptyText: {
    textAlign: 'center',
    color: '#aaa',
    fontSize: 16,
    marginTop: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 25,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  settingItem: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f5f5f5',
    color: '#000000',
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    backgroundColor: '#f5f5f5',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
      marginBottom: 10,
    paddingVertical: 25,
    alignItems: 'center'
    },
  resetButton: {
  backgroundColor: '#ff9800',
  marginBottom: 10,
  padding: 12,
  borderRadius: 8,
  alignItems: 'center',
  justifyContent: 'center',
},
  cancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});
