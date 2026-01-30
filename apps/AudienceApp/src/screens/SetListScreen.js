import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { database } from '../../firebaseConfig';
import { ref, onValue } from 'firebase/database';
import SpittoonTip from '../components/SpittoonTip';
import TipModal from '../components/TipModal';

export default function SetListScreen({ bandId, route, navigation }) {
  const bandName = route?.params?.bandName;
  const [setList, setSetList] = useState([]);
  const [songs, setSongs] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [settings, setSettings] = useState({
    enableTips: false,
    venmoUsername: '',
    tipAmount1: 5,
    tipAmount2: 10,
  });

  React.useLayoutEffect(() => {
    console.log('Setting header, bandName:', bandName, 'enableTips:', settings.enableTips);
    if (bandName) {
      navigation.setOptions({ 
        title: bandName,
        headerRight: () => 
          settings.enableTips ? (
            <View style={{ marginRight: 10 }}>
              <SpittoonTip 
                onPress={() => setShowTipModal(true)} 
                size={44}
              />
            </View>
          ) : null,
      });
    }
  }, [bandName, settings.enableTips, navigation]);

  useEffect(() => {
    if (!bandId) return;

    // Load band settings
    const settingsRef = ref(database, `bands/${bandId}/settings`);
    const settingsUnsub = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSettings({
          enableTips: data.enableTips || false,
          venmoUsername: data.venmoUsername || '',
          tipAmount1: data.tipAmount1 || 5,
          tipAmount2: data.tipAmount2 || 10,
        });
      }
    });

    // Load songs (to get line dance info)
    const songsRef = ref(database, `bands/${bandId}/songs`);
    const songsUnsub = onValue(songsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSongs(data);
      }
    });

    // Load set list
    const setListRef = ref(database, `bands/${bandId}/setList`);
    const setListUnsub = onValue(setListRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const items = Object.values(data).sort((a, b) => a.order - b.order);
        setSetList(items);
      } else {
        setSetList([]);
      }
    });

    return () => {
      settingsUnsub();
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
      return (
        <View style={[styles.setListCard, styles.breakCard]}>
          <Text style={styles.orderNumber}>{index + 1}</Text>
          <View style={styles.breakInfo}>
            <Text style={styles.breakText}>🎵 Break</Text>
            <Text style={styles.breakDuration}>{item.breakDuration} minutes</Text>
          </View>
        </View>
      );
    }

    // Song item
    const song = songs[item.songId];
    if (!song) return null;

    return (
      <View style={styles.setListCard}>
        <Text style={styles.orderNumber}>{index + 1}</Text>
        <View style={styles.songInfo}>
          <Text style={styles.songTitle}>
            {song.title}
            {song.isLineDance && ' 👢'}
          </Text>
          <Text style={styles.songArtist}>{song.artist}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={{ backgroundColor: 'red', padding: 10 }}>
      <Text style={{ color: 'white' }}>
        DEBUG: enableTips={String(settings.enableTips)} 
        venmo={settings.venmoUsername}
        bandId={bandId}
      </Text>
    </View>
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
              tintColor="#8B4513"
            />
          }
        />
      )}

      <TipModal
        visible={showTipModal}
        onClose={() => setShowTipModal(false)}
        venmoUsername={settings.venmoUsername}
        tipAmount1={settings.tipAmount1}
        tipAmount2={settings.tipAmount2}
      />
    </View>

  
  );
  
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  listContainer: {
    padding: 15,
  },
  setListCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#8B4513',
  },
  breakCard: {
    borderLeftColor: '#FFD700',
  },
  orderNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
    marginRight: 15,
    minWidth: 35,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 14,
    color: '#aaa',
  },
  breakInfo: {
    flex: 1,
  },
  breakText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  breakDuration: {
    fontSize: 14,
    color: '#aaa',
  },
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