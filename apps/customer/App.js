// CustomerApp.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  Image,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { database } from './firebaseConfig';
import { ref, onValue, push, set } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

//
// Ad Carousel Component
//
function AdCarousel({ ads }) {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  useEffect(() => {
    const subscription = Dimensions.addEventListener?.('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => {
      if (subscription && typeof subscription.remove === 'function') subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (ads.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentAdIndex((prevIndex) => (prevIndex + 1) % ads.length);
    }, 5000); // Change ad every 5 seconds

    return () => clearInterval(interval);
  }, [ads.length]);

  const currentAd = ads[currentAdIndex];
  const adWidth = screenWidth - 20; // 10px padding on each side
  const adHeight = adWidth / 6; // Maintain 6:1 ratio

  return (
    <View style={adCarouselStyles.container}>
      <TouchableOpacity 
        onPress={() => currentAd.linkURL && Linking.openURL(currentAd.linkURL)}
        activeOpacity={0.7}
      >
        <Image 
          source={{ uri: currentAd.imageURL }} 
          style={{
            width: adWidth,
            height: adHeight,
            borderRadius: 8,
            resizeMode: 'contain',
          }}
        />
      </TouchableOpacity>
    </View>
  );
}

const adCarouselStyles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#666',
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: '#fff',
  },
});

//
// Responsive Header component
//
function Header({ bandName, logoUrl, queueCount, onQueuePress }) {
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [logoHeight, setLogoHeight] = useState(0);
  const LOGO_WIDTH_RATIO = 0.5;
  const MAX_LOGO_HEIGHT = 200;

  useEffect(() => {
    const subscription = Dimensions.addEventListener?.('change', ({ window }) => {
      setScreenWidth(window.width);
    }) || (() => {});
    return () => {
      if (subscription && typeof subscription.remove === 'function') subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!logoUrl) {
      setLogoHeight(0);
      return;
    }
    Image.getSize(
      logoUrl,
      (width, height) => {
        const targetWidth = Math.round(screenWidth * LOGO_WIDTH_RATIO);
        let calculatedHeight = Math.round((height / width) * targetWidth);
        if (calculatedHeight > MAX_LOGO_HEIGHT) calculatedHeight = MAX_LOGO_HEIGHT;
        setLogoHeight(calculatedHeight);
      },
      () => {
        setLogoHeight(Math.min(100, MAX_LOGO_HEIGHT));
      }
    );
  }, [logoUrl, screenWidth]);

  const logoWidth = Math.round(screenWidth * LOGO_WIDTH_RATIO);

  return (
    <View style={headerStyles.headerWrapper}>
      <SafeAreaView style={headerStyles.safeArea}>
        <View style={headerStyles.header}>
          <View style={headerStyles.centerBlock}>
            {logoUrl ? (
              <Image
                source={{ uri: logoUrl }}
                style={{
                  width: logoWidth,
                  height: logoHeight || Math.min(80, MAX_LOGO_HEIGHT),
                  resizeMode: 'contain',
                }}
              />
            ) : (
              <Text style={headerStyles.bandNameFallback}>{bandName || 'Jukebox'}</Text>
            )}
          </View>
          <TouchableOpacity style={headerStyles.queueButton} onPress={onQueuePress}>
            <Text style={headerStyles.queueButtonText}>View Queue ({queueCount})</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: '#8B4513',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  safeArea: {
    backgroundColor: '#8B4513',
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    backgroundColor: '#8B4513' 
  },
  centerBlock: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  queueButton: { 
    backgroundColor: '#fff', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 8, 
    maxWidth: '40%' 
  },
  queueButtonText: { color: '#8B4513', fontWeight: 'bold', fontSize: 14 },
  bandNameFallback: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
});

//
// Main CustomerApp
//
export default function CustomerApp() {
  const [songs, setSongs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [priorityBoost, setPriorityBoost] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [queueModalVisible, setQueueModalVisible] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [settings, setSettings] = useState({});
  const [myRequests, setMyRequests] = useState([]);
  const [ads, setAds] = useState([]);

  // Load songs, requests, settings, ads, my requests
  useEffect(() => {
    const songsRef = ref(database, 'songs');
    onValue(songsRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        const list = Object.values(data);
        setSongs(list);
        setFilteredSongs(list);
      }
    });

    const requestsRef = ref(database, 'requests');
    onValue(requestsRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        const list = Object.values(data)
          .filter(r => r.status !== 'played')
          .sort((a, b) => {
            if (a.status === 'confirmed' && b.status === 'pending') return -1;
            if (a.status === 'pending' && b.status === 'confirmed') return 1;
            if (a.priorityBoost && !b.priorityBoost) return -1;
            if (!a.priorityBoost && b.priorityBoost) return 1;
            return a.timestamp - b.timestamp;
          });
        setRequests(list);
      }
    });

    const settingsRef = ref(database, 'settings');
    onValue(settingsRef, snapshot => { if (snapshot.val()) setSettings(snapshot.val()); });

    const adsRef = ref(database, 'ads');
    onValue(adsRef, snapshot => { 
      if (snapshot.val()) {
        const allAds = Object.values(snapshot.val());
        // Only show active ads
        const activeAds = allAds.filter(ad => ad.active === true);
        setAds(activeAds);
      }
    });

    loadMyRequests();
    checkCooldown();
  }, []);

  const loadMyRequests = async () => {
    try {
      const stored = await AsyncStorage.getItem('myRequestIds');
      if (stored) setMyRequests(JSON.parse(stored));
    } catch (e) { console.error(e); }
  };

  const saveMyRequest = async (requestId) => {
    try {
      const updated = [...myRequests, requestId];
      setMyRequests(updated);
      await AsyncStorage.setItem('myRequestIds', JSON.stringify(updated));
    } catch (e) { console.error(e); }
  };

  const checkCooldown = async () => {
    try {
      const last = await AsyncStorage.getItem('lastRequestTime');
      if (last) {
        const remainingMs = 120000 - (Date.now() - parseInt(last));
        if (remainingMs > 0) {
          setCooldownTime(Math.ceil(remainingMs / 1000));
          startCooldownTimer(remainingMs);
        }
      }
    } catch (e) { console.error(e); }
  };

  const startCooldownTimer = (remainingMs) => {
    const interval = setInterval(async () => {
      const last = await AsyncStorage.getItem('lastRequestTime');
      const timeLeft = Math.ceil((120000 - (Date.now() - parseInt(last || '0'))) / 1000);
      if (timeLeft <= 0) { setCooldownTime(0); clearInterval(interval); }
      else setCooldownTime(timeLeft);
    }, 1000);
  };

  const handleSearch = text => {
    setSearchQuery(text);
    if (!text) setFilteredSongs(songs);
    else setFilteredSongs(songs.filter(s =>
      s.title.toLowerCase().includes(text.toLowerCase()) ||
      s.artist.toLowerCase().includes(text.toLowerCase())
    ));
  };

  const openRequestModal = song => {
    if (cooldownTime > 0) {
      Alert.alert('Cooldown Active', `Please wait ${cooldownTime} seconds before requesting another song.`);
      return;
    }
    setSelectedSong(song);
    setModalVisible(true);
  };

  const submitRequest = async (paymentMethod) => {
    if (!selectedSong) return;
    const requestsRef = ref(database, 'requests');
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
      status: 'pending',
      priorityBoost,
      playedTimestamp: null
    };

    try {
      await set(newRef, requestData);
      await saveMyRequest(newRef.key);
      await AsyncStorage.setItem('lastRequestTime', Date.now().toString());

      setModalVisible(false);
      setCooldownTime(120);
      startCooldownTimer(120000);

      if (paymentMethod === 'venmo') {
        const amount = priorityBoost ? selectedSong.price + settings.priorityBoostPrice : selectedSong.price;
        openVenmo(amount);
      }

      Alert.alert('Request Submitted!',
        paymentMethod === 'cash' ? 'Please wait for manager to collect payment.' : 'Please complete Venmo payment.'
      );

      setSelectedSong(null);
      setCustomerName('');
      setPriorityBoost(false);
    } catch (e) { Alert.alert('Error', 'Failed to submit request.'); console.error(e); }
  };

  const openVenmo = (amount) => {
    const venmoUrl = `venmo://paycharge?txn=pay&recipients=${settings.venmoUsername}&amount=${amount}&note=Song Request`;
    Linking.canOpenURL(venmoUrl).then(supported => supported ? Linking.openURL(venmoUrl) : Alert.alert('Venmo Not Found', 'Please install Venmo.'));
  };

  const renderSongItem = ({ item }) => (
    <TouchableOpacity style={styles.songItem} onPress={() => openRequestModal(item)} disabled={cooldownTime > 0}>
      <View style={styles.songInfo}>
        <Text style={styles.songTitle}>{item.title}</Text>
        <Text style={styles.songArtist}>{item.artist}</Text>
      </View>
      <Text style={styles.songPrice}>${item.price}</Text>
    </TouchableOpacity>
  );

  const renderRequestItem = ({ item }) => {
    const isMine = myRequests.includes(item.id);
    return (
      <View style={[styles.requestItem, isMine && styles.myRequestItem]}>
        <View style={styles.requestInfo}>
          <Text style={styles.requestTitle}>{item.songTitle}{item.priorityBoost && ' ⚡'}</Text>
          <Text style={styles.requestArtist}>{item.artist}</Text>
          <Text style={styles.requestCustomer}>Requested by: {item.customerName}</Text>
        </View>
        <View style={styles.requestStatus}>
          <Text style={[styles.statusText, item.status === 'confirmed' ? styles.confirmed : styles.pending]}>
            {item.status === 'confirmed' ? '✓ Paid' : 'Pending'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B4513" />
      
      <Header
        bandName={settings.bandName || 'Jukebox'}
        logoUrl={settings.logoUrl || settings.bandLogoUrl || "https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=375,fit=crop,q=95/A0xwVVE355TJNvWo/img_9794-dJo6461XeNIkQwnN.jpg"}
        queueCount={requests.length}
        onQueuePress={() => setQueueModalVisible(true)}
      />

      <View style={styles.contentContainer}>
        {cooldownTime > 0 && (
          <View style={styles.cooldownBanner}><Text style={styles.cooldownText}>⏱️ Cooldown: {cooldownTime}s remaining</Text></View>
        )}

        <TextInput style={styles.searchInput} placeholder="Search by title or artist..." value={searchQuery} onChangeText={handleSearch} />

        <FlatList data={filteredSongs} renderItem={renderSongItem} keyExtractor={item => item.id} contentContainerStyle={styles.songList} />
      </View>

      {/* Request Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Song</Text>
            {selectedSong && <>
              <Text style={styles.modalSongTitle}>{selectedSong.title}</Text>
              <Text style={styles.modalArtist}>{selectedSong.artist}</Text>
              <Text style={styles.modalPrice}>Base Price: ${selectedSong.price}</Text>

              <TextInput style={styles.input} placeholder="Your name (optional)" value={customerName} onChangeText={setCustomerName} />

              <View style={styles.priorityContainer}>
                <TouchableOpacity style={styles.checkbox} onPress={() => setPriorityBoost(!priorityBoost)}>
                  <Text style={styles.checkboxText}>{priorityBoost ? '☑' : '☐'}</Text>
                </TouchableOpacity>
                <Text style={styles.priorityText}>Priority Boost (+${settings.priorityBoostPrice})</Text>
              </View>

              <Text style={styles.totalPrice}>Total: ${priorityBoost ? selectedSong.price + settings.priorityBoostPrice : selectedSong.price}</Text>

              <View style={styles.paymentButtons}>
                <TouchableOpacity style={[styles.button, styles.venmoButton]} onPress={() => submitRequest('venmo')}><Text style={styles.buttonText}>Pay with Venmo</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.cashButton]} onPress={() => submitRequest('cash')}><Text style={styles.buttonText}>Pay Cash</Text></TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}><Text style={styles.cancelButtonText}>Cancel</Text></TouchableOpacity>
            </>}
          </View>
        </View>
      </Modal>

      {/* Queue Modal */}
      <Modal visible={queueModalVisible} animationType="slide" transparent={false} onRequestClose={() => setQueueModalVisible(false)}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Current Queue</Text>
            <TouchableOpacity onPress={() => setQueueModalVisible(false)}><Text style={styles.closeButton}>Close</Text></TouchableOpacity>
          </View>
          <FlatList data={requests} renderItem={renderRequestItem} keyExtractor={item => item.id} contentContainerStyle={styles.queueList} ListEmptyComponent={<Text style={styles.emptyText}>No requests yet!</Text>} />
        </View>
      </Modal>

      {/* Banner Ads */}
{ads.length > 0 && (
  <SafeAreaView style={styles.adBannerContainer} edges={['bottom']}>
    <View style={styles.adBannerInner}>
      <AdCarousel ads={ads} />
    </View>
  </SafeAreaView>
)}
    </View>
  );
}

// ----- Styles -----
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  contentContainer: { flex: 1 },
  cooldownBanner: { backgroundColor: '#ff6b6b', padding: 10, alignItems: 'center' },
  cooldownText: { color: '#fff', fontWeight: 'bold' },
  searchInput: { backgroundColor: '#fff', margin: 15, padding: 12, borderRadius: 8, fontSize: 16 },
  songList: { padding: 15, paddingBottom: 20 },
  songItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2a2a2a', padding: 15, borderRadius: 8, marginBottom: 10 },
  songInfo: { flex: 1 },
  songTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  songArtist: { fontSize: 14, color: '#aaa', marginTop: 4 },
  songPrice: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 25, width: '85%', maxWidth: 400 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalSongTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  modalArtist: { fontSize: 16, color: '#666', marginBottom: 10 },
  modalPrice: { fontSize: 16, marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#8B4513' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  closeButton: { color: '#fff', fontWeight: 'bold' },
  queueList: { padding: 15 },
  requestItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#2a2a2a', padding: 12, borderRadius: 8, marginBottom: 10 },
  myRequestItem: { borderWidth: 2, borderColor: '#FFD700' },
  requestInfo: { flex: 1 },
  requestTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  requestArtist: { color: '#aaa', marginTop: 2 },
  requestCustomer: { color: '#ccc', fontSize: 12 },
  requestStatus: { justifyContent: 'center', alignItems: 'center' },
  statusText: { fontWeight: 'bold', fontSize: 14 },
  confirmed: { color: '#4CAF50' },
  pending: { color: '#FFA500' },
  emptyText: { color: '#ccc', textAlign: 'center', marginTop: 20 },
  adBannerContainer: { 
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  adBannerInner: {
  paddingBottom: 30,
},
});