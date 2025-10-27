import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  Linking,
  StyleSheet,
} from 'react-native';
import { ref, onValue, push } from 'firebase/database';
import { database } from './firebaseConfig';

const BAND_LOGO =
  'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=375,fit=crop,q=95/A0xwVVE355TJNvWo/img_9794-dJo6461XeNIkQwnN.jpg';

// ===== Header with Band Logo =====
function Header() {
  return (
    <View style={styles.header}>
      <Image source={{ uri: BAND_LOGO }} style={styles.logo} />
    </View>
  );
}

// ===== Banner Ad Component =====
function BannerAd() {
  const [ad, setAd] = useState(null);

  useEffect(() => {
    const adsRef = ref(database, 'ads');
    const unsubscribe = onValue(adsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const activeAds = Object.values(data).filter((a) => a.active);
        if (activeAds.length > 0) {
          const randomAd =
            activeAds[Math.floor(Math.random() * activeAds.length)];
          setAd(randomAd);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  if (!ad) return null;

  return (
    <TouchableOpacity
      onPress={() => Linking.openURL(ad.linkUrl)}
      style={styles.bannerContainer}
    >
      <Image source={{ uri: ad.imageUrl }} style={styles.bannerImage} />
    </TouchableOpacity>
  );
}

// ===== Main Customer App =====
export default function CustomerApp() {
  const [songs, setSongs] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Load songs from Firebase Realtime Database
  useEffect(() => {
    const songsRef = ref(database, 'songs');
    const unsubscribe = onValue(songsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const songList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setSongs(songList);
      } else {
        setSongs([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSongSelect = (song) => {
    setSelectedSong(song);
    setModalVisible(true);
  };

  const handleRequestSong = async () => {
    if (!selectedSong) return;

    const queueRef = ref(database, 'queue');
    await push(queueRef, {
      title: selectedSong.title,
      artist: selectedSong.artist,
      price: selectedSong.price,
      status: 'requested',
      timestamp: Date.now(),
    });

    setModalVisible(false);
    setSelectedSong(null);
  };

  const renderSong = ({ item }) => (
    <TouchableOpacity
      style={styles.songItem}
      onPress={() => handleSongSelect(item)}
    >
      <Text style={styles.songTitle}>{item.title}</Text>
      <Text style={styles.songArtist}>{item.artist}</Text>
      <Text style={styles.songPrice}>${item.price}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header />
      <Text style={styles.title}>Request a Song</Text>
      <FlatList
        data={songs}
        keyExtractor={(item) => item.id}
        renderItem={renderSong}
        contentContainerStyle={styles.songList}
      />

      {/* Song Request Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedSong && (
              <>
                <Text style={styles.modalTitle}>{selectedSong.title}</Text>
                <Text style={styles.modalArtist}>{selectedSong.artist}</Text>
                <Text style={styles.modalPrice}>
                  Price: ${selectedSong.price}
                </Text>

                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleRequestSong}
                >
                  <Text style={styles.confirmText}>Confirm Request</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <BannerAd />
    </View>
  );
}

// ===== Styles =====
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 200,
    height: 100,
    resizeMode: 'contain',
  },
  title: {
    color: '#f1f5f9',
    fontSize: 22,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  songList: {
    padding: 15,
    paddingBottom: 100,
  },
  songItem: {
    backgroundColor: '#1e293b',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  songTitle: {
    color: '#e2e8f0',
    fontSize: 18,
    fontWeight: '600',
  },
  songArtist: {
    color: '#94a3b8',
    fontSize: 14,
  },
  songPrice: {
    color: '#38bdf8',
    fontSize: 14,
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 12,
    width: '80%',
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: 'bold',
  },
  modalArtist: {
    color: '#cbd5e1',
    fontSize: 18,
    marginBottom: 10,
  },
  modalPrice: {
    color: '#38bdf8',
    fontSize: 16,
    marginBottom: 20,
  },
  confirmButton: {
    backgroundColor: '#38bdf8',
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  confirmText: {
    color: '#0f172a',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  cancelButton: {
    borderColor: '#38bdf8',
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelText: {
    color: '#38bdf8',
    textAlign: 'center',
  },
  bannerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0f172a',
    borderTopWidth: 2,
    borderTopColor: '#0891b2',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  bannerImage: {
    width: '100%',
    height: 60,
    resizeMode: 'contain',
  },
});