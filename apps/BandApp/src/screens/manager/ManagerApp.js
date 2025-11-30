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
import { ActivityIndicator } from 'react-native';
import { auth } from '../../../firebaseConfig';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native';


export default function ManagerApp() {
  const [bandId, setBandId] = useState(null);
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
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'confirmed', 'masterList', 'setList'
  
  // New song form
  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongArtist, setNewSongArtist] = useState('');
  const [newSongPrice, setNewSongPrice] = useState('5');
  
  // Edit song
  const [editingSong, setEditingSong] = useState(null);
  const [editSongTitle, setEditSongTitle] = useState('');
  const [editSongArtist, setEditSongArtist] = useState('');
  const [editSongPrice, setEditSongPrice] = useState('');  

// Add new state for Master List
const [showLineDanceOnly, setShowLineDanceOnly] = useState(false);
const [showRequestableOnly, setShowRequestableOnly] = useState(false);

// Set List state
const [setListItems, setSetListItems] = useState([]);
const [setListModalVisible, setSetListModalVisible] = useState(false);
const [addSongToSetListModalVisible, setAddSongToSetListModalVisible] = useState(false);
const [breakModalVisible, setBreakModalVisible] = useState(false);
const [breakDuration, setBreakDuration] = useState('15');

const [qrModalVisible, setQrModalVisible] = useState(false);
const [bandSlug, setBandSlug] = useState('');

// edit break modal
const [editBreakModalVisible, setEditBreakModalVisible] = useState(false);
const [editingBreak, setEditingBreak] = useState(null);
const [editBreakDuration, setEditBreakDuration] = useState('');

  useEffect(() => {
    // Get bandId from authenticated user
    const user = auth.currentUser;
    if (user) {
      setBandId(user.uid);
    }
  }, []);

  useEffect(() => {
    if (!bandId) return; // Don't load until we have bandId

    // Load set list
const setListRef = ref(database, `bands/${bandId}/setList`);
const setListUnsub = onValue(setListRef, (snapshot) => {
  const data = snapshot.val();
  if (data) {
    const items = Object.values(data).sort((a, b) => a.order - b.order);
    setSetListItems(items);
  } else {
    setSetListItems([]);
  }
});

    // Load all requests
    const requestsRef = ref(database, `bands/${bandId}/requests`);
    const requestsUnsub = onValue(requestsRef, (snapshot) => {
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
    const songsRef = ref(database, `bands/${bandId}/songs`);
    const songsUnsub = onValue(songsRef, (snapshot) => {
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
    const settingsRef = ref(database, `bands/${bandId}/settings`);
    const settingsUnsub = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSettings(data);
        setNewPriorityPrice(data.priorityBoostPrice?.toString() || '10');
        setNewMaxRequests(data.maxRequests?.toString() || '10');
        setNewVenmoUsername(data.venmoUsername || '');
      }
    });

// Load band slug from directory
let bandDirUnsub = () => {}; // Declare outside if statement
const user = auth.currentUser;
if (user) {
  const bandDirRef = ref(database, 'bandDirectory');
  bandDirUnsub = onValue(bandDirRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const ourBand = Object.values(data).find(b => b.bandId === user.uid);
      if (ourBand) {
        setBandSlug(ourBand.bandSlug || '');
      }
    }
  });
}

    return () => {
  requestsUnsub();
  songsUnsub();
  settingsUnsub();
  setListUnsub(); 
  bandDirUnsub();

};
  }, [bandId, previousPendingCount]);

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
              const requestRef = ref(database, `bands/${bandId}/requests/${request.id}`);
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
              const requestRef = ref(database, `bands/${bandId}/requests/${request.id}`);
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
              const requestRef = ref(database, `bands/${bandId}/requests/${request.id}`);
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
    const settingsRef = ref(database, `bands/${bandId}/settings`);
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
            const requestsRef = ref(database, `bands/${bandId}/requests`);
            const snapshot = await get(requestsRef);
            const data = snapshot.val();
            
            if (data) {
              const deletePromises = Object.keys(data)
                .filter(key => data[key].status === 'played')
                .map(key => remove(ref(database, `bands/${bandId}/requests/${key}`)));
              
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
            const requestsRef = ref(database, `bands/${bandId}/requests`);
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
    const songsRef = ref(database, `bands/${bandId}/songs`);
    const newSongRef = push(songsRef);

    await set(newSongRef, {
      id: newSongRef.key,
      title: newSongTitle.trim(),
      artist: newSongArtist.trim(),
      price: price,
      isLineDance: false,
      isRequestable: true,
      createdAt: Date.now(),
    });

    Alert.alert('Success', 'Song added to master list!');
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
      const songRef = ref(database, `bands/${bandId}/songs/${editingSong.id}`);
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
              const songRef = ref(database, `bands/${bandId}/songs/${song.id}`);
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

  const toggleLineDance = async (song) => {
  try {
    const songRef = ref(database, `bands/${bandId}/songs/${song.id}`);
    await update(songRef, {
      isLineDance: !song.isLineDance
    });
  } catch (error) {
    Alert.alert('Error', 'Failed to update song.');
    console.error(error);
  }
};

const toggleRequestable = async (song) => {
  try {
    const songRef = ref(database, `bands/${bandId}/songs/${song.id}`);
    await update(songRef, {
      isRequestable: !song.isRequestable
    });
  } catch (error) {
    Alert.alert('Error', 'Failed to update song.');
    console.error(error);
  }
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

const renderSetListItem = ({ item, index }) => {
  if (item.type === 'break') {
  return (
    <View style={styles.setListCard}>
      <Text style={styles.setListOrder}>{index + 1}</Text>
      <View style={styles.setListInfo}>
        <Text style={styles.setListBreakText}>🎵 Break</Text>
        <Text style={styles.setListBreakDuration}>{item.breakDuration} minutes</Text>
      </View>
      <View style={styles.setListActions}>
        <TouchableOpacity
          style={styles.editBreakButton}  // NEW: Edit button
          onPress={() => openEditBreak(item)}
        >
          <Text style={styles.editBreakButtonText}>✎</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.moveButton}
          onPress={() => moveSetListItem(index, 'up')}
          disabled={index === 0}
        >
          <Text style={styles.moveButtonText}>↑</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.moveButton}
          onPress={() => moveSetListItem(index, 'down')}
          disabled={index === setListItems.length - 1}
        >
          <Text style={styles.moveButtonText}>↓</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFromSetList(item.id)}
        >
          <Text style={styles.removeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

  // Song item
  const song = songs.find(s => s.id === item.songId);
  if (!song) return null;

  return (
    <View style={styles.setListCard}>
      <Text style={styles.setListOrder}>{index + 1}</Text>
      <View style={styles.setListInfo}>
        <Text style={styles.setListTitle}>
          {song.title}
          {song.isLineDance && ' 👢'}
        </Text>
        <Text style={styles.setListArtist}>{song.artist}</Text>
      </View>
      <View style={styles.setListActions}>
        <TouchableOpacity
          style={styles.moveButton}
          onPress={() => moveSetListItem(index, 'up')}
          disabled={index === 0}
        >
          <Text style={styles.moveButtonText}>↑</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.moveButton}
          onPress={() => moveSetListItem(index, 'down')}
          disabled={index === setListItems.length - 1}
        >
          <Text style={styles.moveButtonText}>↓</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFromSetList(item.id)}
        >
          <Text style={styles.removeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

if (!bandId) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#2c5282" />
      <Text style={styles.loadingText}>Loading band data...</Text>
    </View>
  );
}


const addSongToSetList = async (song) => {
  try {
    const setListRef = ref(database, `bands/${bandId}/setList`);
    const newItemRef = push(setListRef);
    
    await set(newItemRef, {
      id: newItemRef.key,
      order: setListItems.length,
      type: 'song',
      songId: song.id,
      createdAt: Date.now()
    });
    
    setAddSongToSetListModalVisible(false);
  } catch (error) {
    Alert.alert('Error', 'Failed to add song to set list.');
    console.error(error);
  }
};

const addBreakToSetList = async () => {
  const duration = parseInt(breakDuration);
  if (isNaN(duration) || duration < 1) {
    Alert.alert('Invalid Duration', 'Please enter a valid break duration.');
    return;
  }

  try {
    const setListRef = ref(database, `bands/${bandId}/setList`);
    const newItemRef = push(setListRef);
    
    await set(newItemRef, {
      id: newItemRef.key,
      order: setListItems.length,
      type: 'break',
      breakDuration: duration,
      createdAt: Date.now()
    });
    
    setBreakDuration('15');
    setBreakModalVisible(false);
  } catch (error) {
    Alert.alert('Error', 'Failed to add break.');
    console.error(error);
  }
};

const removeFromSetList = async (itemId) => {
  Alert.alert(
    'Remove Item',
    'Remove this item from set list?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const itemRef = ref(database, `bands/${bandId}/setList/${itemId}`);
            await remove(itemRef);
            
            // Reorder remaining items
            await reorderSetList();
          } catch (error) {
            Alert.alert('Error', 'Failed to remove item.');
            console.error(error);
          }
        }
      }
    ]
  );
};

const moveSetListItem = async (currentIndex, direction) => {
  const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  
  if (newIndex < 0 || newIndex >= setListItems.length) return;
  
  // Swap orders
  const currentItem = setListItems[currentIndex];
  const targetItem = setListItems[newIndex];
  
  try {
    await update(ref(database, `bands/${bandId}/setList/${currentItem.id}`), {
      order: newIndex
    });
    
    await update(ref(database, `bands/${bandId}/setList/${targetItem.id}`), {
      order: currentIndex
    });
  } catch (error) {
    Alert.alert('Error', 'Failed to reorder items.');
    console.error(error);
  }
};

const reorderSetList = async () => {
  // After removing an item, fix all order values
  const setListRef = ref(database, `bands/${bandId}/setList`);
  const snapshot = await get(setListRef);
  const data = snapshot.val();
  
  if (data) {
    const items = Object.values(data).sort((a, b) => a.order - b.order);
    const updates = {};
    
    items.forEach((item, index) => {
      updates[`bands/${bandId}/setList/${item.id}/order`] = index;
    });
    
    await update(ref(database), updates);
  }
};
const clearSetList = async () => {
  Alert.alert(
    'Clear Set List',
    'Remove all songs and breaks from set list?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            const setListRef = ref(database, `bands/${bandId}/setList`);
            await remove(setListRef);
            Alert.alert('Success', 'Set list cleared.');
          } catch (error) {
            Alert.alert('Error', 'Failed to clear set list.');
            console.error(error);
          }
        }
      }
    ]
  );
};

const openEditBreak = (breakItem) => {
  setEditingBreak(breakItem);
  setEditBreakDuration(breakItem.breakDuration.toString());
  setEditBreakModalVisible(true);
};

const updateBreak = async () => {
  const duration = parseInt(editBreakDuration);
  if (isNaN(duration) || duration < 1) {
    Alert.alert('Invalid Duration', 'Please enter a valid break duration.');
    return;
  }

  try {
    const breakRef = ref(database, `bands/${bandId}/setList/${editingBreak.id}`);
    await update(breakRef, {
      breakDuration: duration
    });

    Alert.alert('Success', 'Break duration updated!');
    setEditBreakModalVisible(false);
    setEditingBreak(null);
  } catch (error) {
    Alert.alert('Error', 'Failed to update break.');
    console.error(error);
  }
};

// ----------------------------
// Helper function
const isSongInSetList = (songId) => {
  return setListItems.some(item => item.songId === songId);
};

// Render function for Master List items with card layout
const renderMasterListItem = ({ item }) => (
  <View style={styles.masterListCard}>
    <View style={styles.masterListHeader}>
      <View style={styles.masterListInfo}>
        <Text style={styles.masterListTitle}>
          {item.title}
          {item.isLineDance && ' 👢'}
        </Text>
        <Text style={styles.masterListArtist}>{item.artist}</Text>
      </View>
      <Text style={styles.masterListPrice}>${item.price}</Text>
    </View>

    <View style={styles.toggleRow}>
      <TouchableOpacity
        style={[styles.toggleButton, item.isLineDance && styles.toggleButtonActive]}
        onPress={() => toggleLineDance(item)}
      >
        <Text style={styles.toggleButtonText}>
          {item.isLineDance ? '✓' : ''} Line Dance
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.toggleButton, item.isRequestable && styles.toggleButtonActive]}
        onPress={() => toggleRequestable(item)}
      >
        <Text style={styles.toggleButtonText}>
          {item.isRequestable ? '✓' : ''} Requestable
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.toggleButton, isSongInSetList(item.id) && styles.toggleButtonActive]}
        onPress={async () => {
          const setListRef = ref(database, `bands/${bandId}/setList`);
          const existingSetItem = setListItems.find(slItem => slItem.songId === item.id);

          try {
            if (existingSetItem) {
              // Remove from set list
              await remove(ref(database, `bands/${bandId}/setList/${existingSetItem.id}`));
            } else {
              // Add to set list
              const newItemRef = push(setListRef);
              await set(newItemRef, {
                id: newItemRef.key,
                order: setListItems.length,
                type: 'song',
                songId: item.id,
                createdAt: Date.now(),
              });
            }
          } catch (error) {
            console.error('Error toggling song in set list:', error);
            Alert.alert('Error', 'Could not update set list.');
          }
        }}
      >
        <Text style={styles.toggleButtonText}>
          {isSongInSetList(item.id) ? '✓ In Set List' : '+ Set List'}
        </Text>
      </TouchableOpacity>
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


// ----------------------------
// JSX RETURN
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
          Queue ({confirmedRequests.length})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'masterList' && styles.activeTab]}
        onPress={() => setActiveTab('masterList')}
      >
        <Text style={[styles.tabText, activeTab === 'masterList' && styles.activeTabText]}>
          Master ({songs.length})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'setList' && styles.activeTab]}
        onPress={() => setActiveTab('setList')}
      >
        <Text style={[styles.tabText, activeTab === 'setList' && styles.activeTabText]}>
          Set List
        </Text>
      </TouchableOpacity>
    </View>

    {/* ------------------- Tab Content ------------------- */}
    {activeTab === 'pending' && (
      <FlatList
        data={pendingRequests}
        renderItem={renderPendingRequest}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>No pending requests</Text>}
      />
    )}

    {activeTab === 'confirmed' && (
      <FlatList
        data={confirmedRequests}
        renderItem={renderConfirmedRequest}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>No confirmed requests</Text>}
      />
    )}

    {activeTab === 'masterList' && (
      <>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterButton, showLineDanceOnly && styles.filterButtonActive]}
            onPress={() => setShowLineDanceOnly(!showLineDanceOnly)}
          >
            <Text style={styles.filterButtonText}>👢 Line Dance Only</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, showRequestableOnly && styles.filterButtonActive]}
            onPress={() => setShowRequestableOnly(!showRequestableOnly)}
          >
            <Text style={styles.filterButtonText}>✓ Requestable Only</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.addSongButton}
          onPress={() => setSongModalVisible(true)}
        >
          <Text style={styles.addSongButtonText}>+ Add New Song</Text>
        </TouchableOpacity>

        <FlatList
          data={songs.filter(song => {
            if (showLineDanceOnly && !song.isLineDance) return false;
            if (showRequestableOnly && !song.isRequestable) return false;
            return true;
          })}
          renderItem={renderMasterListItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>No songs in master list</Text>}
        />
      </>
    )}

    {activeTab === 'setList' && (
      <>
        <View style={styles.setListControls}>
          <TouchableOpacity
            style={[styles.controlButton, styles.addBreakButton]}
            onPress={() => setBreakModalVisible(true)}
          >
            <Text style={styles.controlButtonText}>+ Add Break</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.clearSetListButton]}
            onPress={clearSetList}
          >
            <Text style={styles.controlButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={setListItems}
          renderItem={renderSetListItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎵</Text>
              <Text style={styles.emptyText}>No set list yet</Text>
              <Text style={styles.emptySubtext}>
                Add songs and breaks to create tonight's set list
              </Text>
            </View>
          }
        />
      </>
    )}
  
);


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
  style={[styles.qrButton]}
  onPress={() => {
    setSettingsModalVisible(false);
    setQrModalVisible(true);
  }}
>
  <Text style={styles.qrButtonText}>📱 Generate QR Code</Text>
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

{/* Add Break Modal */}
<Modal
  visible={breakModalVisible}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setBreakModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Add Break</Text>

      <Text style={styles.settingLabel}>Duration (minutes)</Text>
      <TextInput
        style={styles.input}
        placeholder="15"
        placeholderTextColor="#999"
        value={breakDuration}
        onChangeText={setBreakDuration}
        keyboardType="numeric"
      />

      <TouchableOpacity
        style={styles.saveButton}
        onPress={addBreakToSetList}
      >
        <Text style={styles.saveButtonText}>Add Break</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => setBreakModalVisible(false)}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

{/* Edit Break Modal */}
<Modal
  visible={editBreakModalVisible}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setEditBreakModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Edit Break</Text>

      <Text style={styles.settingLabel}>Duration (minutes)</Text>
      <TextInput
        style={styles.input}
        value={editBreakDuration}
        onChangeText={setEditBreakDuration}
        keyboardType="numeric"
      />

      <TouchableOpacity
        style={styles.saveButton}
        onPress={updateBreak}
      >
        <Text style={styles.saveButtonText}>Update Break</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => setEditBreakModalVisible(false)}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

{/* QR Code Modal */}
<Modal
  visible={qrModalVisible}
  animationType="slide"
  transparent={false}
  onRequestClose={() => setQrModalVisible(false)}
>
  <SafeAreaView style={styles.qrModalContainer}>
    <View style={styles.qrHeader}>
      <Text style={styles.qrTitle}>Your Band QR Code</Text>
      <TouchableOpacity onPress={() => setQrModalVisible(false)}>
        <Text style={styles.qrCloseButton}>Close</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.qrContent}>
      <Text style={styles.qrInstructions}>
        Customers can scan this QR code to go directly to your band in the app!
      </Text>

      <View style={styles.qrCodeWrapper}>
        <QRCode
          value={`livejukebox://band/${bandSlug}`}
          size={250}
          backgroundColor="white"
        />
      </View>

      <View style={styles.qrLinkBox}>
        <Text style={styles.qrLinkLabel}>Deep Link:</Text>
        <Text style={styles.qrLinkText}>livejukebox://band/{bandSlug}</Text>
      </View>

      <Text style={styles.qrUsageText}>
        💡 Add this QR code to:{'\n'}
        • Flyers and posters{'\n'}
        • Table tents{'\n'}
        • Social media posts{'\n'}
        • Your website
      </Text>
    </View>
  </SafeAreaView>
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
    alignItems: 'center',
    },
    saveButtonText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: 'bold',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
  setListControls: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  controlButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addSongToSetButton: {
    backgroundColor: '#4CAF50',
  },
  addBreakButton: {
    backgroundColor: '#CC9900',
  },
  clearSetListButton: {
    backgroundColor: '#f44336',
  },
  controlButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  setListCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  setListOrder: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginRight: 15,
    width: 30,
  },
  setListInfo: {
    flex: 1,
  },
  setListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  setListArtist: {
    fontSize: 14,
    color: '#aaa',
  },
  setListBreakText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  setListBreakDuration: {
    fontSize: 14,
    color: '#aaa',
  },
  setListActions: {
    flexDirection: 'row',
    gap: 5,
  },
  moveButton: {
    backgroundColor: '#2c5282',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  removeButton: {
    backgroundColor: '#f44336',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  songSelectList: {
    maxHeight: 400,
  },
  songSelectItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  songSelectTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  songSelectArtist: {
    fontSize: 14,
    color: '#666',
  },
  qrButton: {
    backgroundColor: '#9C27B0',
    marginBottom: 10,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  qrModalContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  qrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2c5282',
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  qrCloseButton: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  qrContent: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  qrInstructions: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  qrCodeWrapper: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
  },
  qrLinkBox: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginBottom: 30,
  },
  qrLinkLabel: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 5,
  },
  qrLinkText: {
    color: '#4299e1',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  qrUsageText: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  editBreakButton: {
  backgroundColor: '#2196F3',
  width: 36,
  height: 36,
  borderRadius: 18,
  justifyContent: 'center',
  alignItems: 'center',
},
editBreakButtonText: {
  color: '#fff',
  fontSize: 18,
  fontWeight: 'bold',
},
});