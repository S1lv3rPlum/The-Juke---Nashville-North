import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
  Linking,
  Platform,  
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { database } from '../../firebaseConfig';
import { ref, onValue, push, set } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RequestSongsScreen({ bandId,route, navigation }) {
  const bandName = route?.params?.bandName;
  const [songs, setSongs] = useState([]);
  const [allSongs, setAllSongs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [setList, setSetList] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [priorityBoost, setPriorityBoost] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [settings, setSettings] = useState({});
  const [myRequests, setMyRequests] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

    React.useLayoutEffect(() => {
    if (bandName) {
      navigation.setOptions({ title: bandName });
    }
  }, [bandName]);

  useEffect(() => {
    if (!bandId) return;

    let loadedSongs = [];
    let loadedRequests = [];
    let loadedSetList = [];

    // Load songs
    const songsRef = ref(database, `bands/${bandId}/songs`);
    const songsUnsub = onValue(songsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        loadedSongs = Object.values(data);
        setAllSongs(loadedSongs);
        filterAvailableSongs(loadedSongs, loadedRequests, loadedSetList);
      }
    });

    // Load requests
    const requestsRef = ref(database, `bands/${bandId}/requests`);
    const requestsUnsub = onValue(requestsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.values(data).filter(r => r.status !== 'played');
        loadedRequests = list;
        setRequests(list);
        filterAvailableSongs(loadedSongs, list, loadedSetList);
      }
    });

    // Load set list
    const setListRef = ref(database, `bands/${bandId}/setList`);
    const setListUnsub = onValue(setListRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        loadedSetList = Object.values(data);
        setSetList(loadedSetList);
        filterAvailableSongs(loadedSongs, loadedRequests, loadedSetList);
      }
    });

    // Load settings
    const settingsRef = ref(database, `bands/${bandId}/settings`);
    const settingsUnsub = onValue(settingsRef, (snapshot) => {
      if (snapshot.val()) setSettings(snapshot.val());
    });

    loadMyRequests();
    checkCooldown();

    return () => {
      songsUnsub();
      requestsUnsub();
      setListUnsub();
      settingsUnsub();
    };
  }, [bandId]);

  const filterAvailableSongs = (allSongsList, requestsList, setListItems) => {
    // Get confirmed request song IDs
    const activeRequests = requestsList.filter(r => r.status === 'pending' || r.status === 'confirmed');
    const activeSongIds = activeRequests.map(r => r.songId);  

    // Get set list song IDs
    const setListSongIds = setListItems
      .filter(item => item.type === 'song')
      .map(item => item.songId);

    // Filter: only requestable songs, not in set list, not already requested
    const availableSongs = allSongsList.filter(
      song =>
        song.isRequestable &&
        !setListSongIds.includes(song.id) &&
        !activeSongIds.includes(song.id)
    );

    // In vote mode, sort by vote count (descending), ties broken by first timestamp
const isVoteModeSort = settings.requestMode === 'vote';

let sortedSongs = availableSongs;
if (isVoteModeSort) {
  sortedSongs = [...availableSongs].sort((a, b) => {
    const aVotes = requests.filter(r => r.songId === a.id).length;
    const bVotes = requests.filter(r => r.songId === b.id).length;
    if (bVotes !== aVotes) return bVotes - aVotes;
    // Tie breaker - first vote timestamp
    const aFirst = requests.filter(r => r.songId === a.id)
      .sort((x, y) => x.timestamp - y.timestamp)[0]?.timestamp || 0;
    const bFirst = requests.filter(r => r.songId === b.id)
      .sort((x, y) => x.timestamp - y.timestamp)[0]?.timestamp || 0;
    return aFirst - bFirst;
  });
}

setSongs(sortedSongs);

if (searchQuery) {
  handleSearch(searchQuery, sortedSongs);
} else {
  setFilteredSongs(sortedSongs);
}
  };  // ← closes filterAvailableSongs

  const loadMyRequests = async () => {
    try {
      const stored = await AsyncStorage.getItem(`myRequests_${bandId}`);
      if (stored) setMyRequests(JSON.parse(stored));
    } catch (e) {
      console.error(e);
    }
  };

  const saveMyRequest = async (requestId) => {
    try {
      const updated = [...myRequests, requestId];
      setMyRequests(updated);
      await AsyncStorage.setItem(`myRequests_${bandId}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const checkCooldown = async () => {
    try {
      const last = await AsyncStorage.getItem(`lastRequestTime_${bandId}`);
      if (last) {
        const cooldownMs = ((settings.cooldownMinutes || 2) * 60 * 1000);
        const remainingMs = cooldownMs - (Date.now() - parseInt(last));
        if (remainingMs > 0) {
          setCooldownTime(Math.ceil(remainingMs / 1000));
          startCooldownTimer(remainingMs);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startCooldownTimer = (remainingMs) => {
    const interval = setInterval(async () => {
      const last = await AsyncStorage.getItem(`lastRequestTime_${bandId}`);
      const cooldownMs = ((settings.cooldownMinutes || 2) * 60 * 1000);
      const timeLeft = Math.ceil((cooldownMs - (Date.now() - parseInt(last || '0'))) / 1000);
      if (timeLeft <= 0) {
        setCooldownTime(0);
        clearInterval(interval);
      } else {
        setCooldownTime(timeLeft);
      }
    }, 1000);
  };

  const handleSearch = (text, songsList = songs) => {
    setSearchQuery(text);
    if (!text) {
      setFilteredSongs(songsList);
    } else {
      setFilteredSongs(
        songsList.filter(
          s =>
            s.title.toLowerCase().includes(text.toLowerCase()) ||
            s.artist.toLowerCase().includes(text.toLowerCase())
        )
      );
    }
  };

  const openRequestModal = (song) => {
    if (cooldownTime > 0) {
      Alert.alert('Cooldown Active', `Please wait ${cooldownTime} seconds before requesting another song.`);
      return;
    }

    const confirmedCount = requests.filter(r => r.status === 'confirmed').length;
    const maxRequests = settings.maxRequests || 10;

    if (confirmedCount >= maxRequests) {
      Alert.alert(
        'Request Limit Reached',
        `The band has reached the maximum of ${maxRequests} song requests for tonight.`
      );
      return;
    }

    setSelectedSong(song);
    setModalVisible(true);
  };

  const submitRequest = async (paymentMethod) => {
    if (!selectedSong) return;

    const requestsRef = ref(database, `bands/${bandId}/requests`);
    const newRef = push(requestsRef);

    const requestData = {
  id: newRef.key,
  songId: selectedSong.id,
  songTitle: selectedSong.title,
  artist: selectedSong.artist,
  price: selectedSong.price,
  customerName: customerName || 'Anonymous',
  timestamp: Date.now(),
  paymentMethod,
  status: 'pending',  // ← ALL payments need confirmation now
  priorityBoost,
  playedTimestamp: null,
};

    try {
      await set(newRef, requestData);
      await saveMyRequest(newRef.key);
      await AsyncStorage.setItem(`lastRequestTime_${bandId}`, Date.now().toString());

      setModalVisible(false);
      setCooldownTime(120);
      startCooldownTimer((settings.cooldownMinutes || 2) * 60 * 1000);

      if (paymentMethod === 'venmo') {
        const amount = priorityBoost
          ? selectedSong.price + settings.priorityBoostPrice
          : selectedSong.price;
        openVenmo(amount);
      }

      Alert.alert(
        'Request Submitted!',
        paymentMethod === 'cash' ? 'Please wait for manager to collect payment.' : 'Please complete Venmo payment.'
      );

      setSelectedSong(null);
      setCustomerName('');
      setPriorityBoost(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to submit request.');
      console.error(e);
    }
  };

  const showToast = (message) => {
  setToastMessage(message);
  setToastVisible(true);
  setTimeout(() => setToastVisible(false), 3000);
};
const submitVote = async (song) => {
  if (cooldownTime > 0) {
    Alert.alert('Cooldown Active', `Please wait ${cooldownTime} seconds before voting again.`);
    return;
  }

  const requestsRef = ref(database, `bands/${bandId}/requests`);
  const newRef = push(requestsRef);

  const voteData = {
    id: newRef.key,
    songId: song.id,
    songTitle: song.title,
    artist: song.artist,
    price: 0,
    customerName: 'Anonymous',
    timestamp: Date.now(),
    paymentMethod: 'vote',
    status: 'confirmed',
    priorityBoost: false,
    voteCount: 1,
    playedTimestamp: null,
  };

console.log('Submitting vote for:', song.title, 'bandId:', bandId);
try {
  await set(newRef, voteData);
    await saveMyRequest(newRef.key);
    const cooldownMs = ((settings.cooldownMinutes || 2) * 60 * 1000);
    await AsyncStorage.setItem(`lastRequestTime_${bandId}`, Date.now().toString());
    setCooldownTime(Math.ceil(cooldownMs / 1000));
    startCooldownTimer(cooldownMs);
    showToast(`✅ Voted for "${song.title}"!`);
  } catch (e) {
    Alert.alert('Error', 'Failed to submit vote.');
    console.error(e);
  }
};

const openVenmo = (amount) => {
  const venmoUrl = `venmo://paycharge?txn=pay&recipients=${settings.venmoUsername}&amount=${amount}&note=Song Request`;
  
  if (Platform.OS === 'web') {
    // Web browser - go straight to Venmo website
    Linking.openURL(`https://account.venmo.com/${settings.venmoUsername}`);
  } else {
    // Mobile - try Venmo app first, fallback to website
    Linking.openURL(venmoUrl).catch(() => {
      Linking.openURL(`https://account.venmo.com/${settings.venmoUsername}`);
    });
  }
};


  const renderSongItem = ({ item, index }) => {
  const isVoteMode = settings.requestMode === 'vote';
  const voteCount = requests.filter(r => r.songId === item.id).length;

  return (
    <TouchableOpacity
      style={styles.songCardWrapper}
      onPress={() => isVoteMode ? submitVote(item) : openRequestModal(item)}
      disabled={cooldownTime > 0}
      activeOpacity={0.8}
    >
      {/* Glow layers */}
      <View style={styles.glowLayer1} />
      <View style={styles.glowLayer2} />

      <View style={styles.songCard}>
        {/* Position number in vote mode */}
        {isVoteMode && (
          <Text style={styles.votePosition}>#{index + 1}</Text>
        )}

        <View style={styles.songInfo}>
          <Text style={styles.songTitle}>
            {item.title}
            {item.isLineDance && ' 👢'}
          </Text>
          <Text style={styles.songArtist}>{item.artist}</Text>
        </View>

        {/* Vote count OR price */}
        {isVoteMode ? (
          <Text style={styles.voteCount}>{voteCount} 🗳️</Text>
        ) : (
          <Text style={styles.songPrice}>${item.price}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

  const confirmedCount = requests.filter(r => r.status === 'confirmed').length;
  const maxRequests = settings.maxRequests || 10;

  const isVoteMode = settings.requestMode === 'vote';

return (
    <View style={styles.container}>
      {/* Toast Notification */}
      {toastVisible && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {cooldownTime > 0 && (
        <View style={styles.cooldownBanner}>
          <Text style={styles.cooldownText}>⏱️ Cooldown: {cooldownTime}s remaining</Text>
        </View>
      )}

      {/* Vote Mode Banner */}
      {isVoteMode ? (
        <View style={styles.voteModeBanner}>
          <Text style={styles.voteModeText}>🗳️ Tap a song to vote! Top songs get played first.</Text>
        </View>
      ) : (
        <View style={styles.requestLimitBanner}>
          <Text style={styles.requestLimitText}>🎵 {confirmedCount}/{maxRequests} song slots filled</Text>
        </View>
      )}

      <TextInput
        style={styles.searchInput}
        placeholder="Search by title or artist..."
        placeholderTextColor="#999"
        value={searchQuery}
        onChangeText={text => handleSearch(text)}
      />

      <FlatList
        data={filteredSongs}
        renderItem={renderSongItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.songList}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {confirmedCount >= maxRequests
              ? 'All song slots are filled! Check back later.'
              : 'No songs available at this time.'}
          </Text>
        }
      />

      {/* Request Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Song</Text>
            {selectedSong && (
              <>
                <Text style={styles.modalSongTitle}>{selectedSong.title}</Text>
                <Text style={styles.modalArtist}>{selectedSong.artist}</Text>
                <Text style={styles.modalPrice}>Base Price: ${selectedSong.price}</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Your name or message (optional)"
                  placeholderTextColor="#999"
                  value={customerName}
                  onChangeText={setCustomerName}
                />

                <View style={styles.priorityContainer}>
                  <TouchableOpacity style={styles.checkbox} onPress={() => setPriorityBoost(!priorityBoost)}>
                    <Text style={styles.checkboxText}>{priorityBoost ? '☑' : '☐'}</Text>
                  </TouchableOpacity>
                  <Text style={styles.priorityText}>Priority Boost (+${settings.priorityBoostPrice})</Text>
                </View>

                <Text style={styles.totalPrice}>
                  Total: ${priorityBoost ? selectedSong.price + settings.priorityBoostPrice : selectedSong.price}
                </Text>

                <View style={styles.paymentButtons}>
                  <TouchableOpacity style={[styles.button, styles.venmoButton]} onPress={() => submitRequest('venmo')}>
                    <Text style={styles.buttonText}>Pay with Venmo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, styles.cashButton]} onPress={() => submitRequest('cash')}>
                    <Text style={styles.buttonText}>Pay Cash</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },  // darker background
  cooldownBanner: { backgroundColor: '#ff6b6b', padding: 10, alignItems: 'center' },
  cooldownText: { color: '#fff', fontWeight: 'bold' },
  requestLimitBanner: { backgroundColor: '#2a2a2a', padding: 10, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#444' },
  requestLimitText: { color: '#4CAF50', fontWeight: 'bold', fontSize: 14 },
  searchInput: { backgroundColor: '#2a2a2a', margin: 15, padding: 12, borderRadius: 8, fontSize: 16, color: '#fff', borderWidth: 1, borderColor: '#444' },
  songList: { padding: 15, paddingBottom: 20 },
  songCardWrapper: {position: 'relative', marginBottom: 12 },
  songInfo: { flex: 1 },
  songTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  songArtist: { fontSize: 14, color: '#fbbf24', marginTop: 4 },  // orange color
  songPrice: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 25, width: '85%', maxWidth: 400 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalSongTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  modalArtist: { fontSize: 16, color: '#666', marginBottom: 10 },
  modalPrice: { fontSize: 16, marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16, color: '#333' },
  priorityContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  checkbox: { marginRight: 10 },
  checkboxText: { fontSize: 24 },
  priorityText: { fontSize: 16 },
  totalPrice: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  paymentButtons: { gap: 10 },
  button: { padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  venmoButton: { backgroundColor: '#3D95CE' },
  cashButton: { backgroundColor: '#4CAF50' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cancelButton: { padding: 12, alignItems: 'center' },
  cancelButtonText: { color: '#666', fontSize: 16 },
  emptyText: { color: '#ccc', textAlign: 'center', marginTop: 20, fontSize: 16 },
  votePosition: {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#fbbf24',
  marginRight: 10,
  minWidth: 35,
},
voteCount: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#fbbf24',
},
voteModeBanner: {
  backgroundColor: '#1e3a5f',
  padding: 10,
  alignItems: 'center',
  borderBottomWidth: 1,
  borderBottomColor: '#4299e1',
},
voteModeText: {
  color: '#4299e1',
  fontWeight: 'bold',
  fontSize: 14,
},
toast: {
  position: 'absolute',
  top: 80,
  left: 20,
  right: 20,
  backgroundColor: '#1e3a5f',
  padding: 15,
  borderRadius: 10,
  alignItems: 'center',
  zIndex: 999,
  borderWidth: 1,
  borderColor: '#4299e1',
},
toastText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: 'bold',
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
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#1e293b',
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
});
