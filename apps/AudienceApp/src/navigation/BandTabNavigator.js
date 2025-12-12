import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { database } from '../../firebaseConfig';
import { ref, onValue } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Header from '../components/Header';
import AdCarousel from '../components/AdCarousel';
import SetListScreen from '../screens/SetListScreen';
import RequestSongsScreen from '../screens/RequestSongsScreen';
import QueueModal from '../components/QueueModal';

const Tab = createBottomTabNavigator();

export default function BandTabNavigator({ route, navigation }) {
  const { bandId, bandSlug } = route.params;
  const [bandInfo, setBandInfo] = useState(null);
  const [ads, setAds] = useState([]);
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [queueModalVisible, setQueueModalVisible] = useState(false);

  useEffect(() => {
    if (!bandId) return;

    // Load band info
    const bandRef = ref(database, `bandDirectory/${bandSlug}`);
    const bandUnsub = onValue(bandRef, (snapshot) => {
      if (snapshot.val()) setBandInfo(snapshot.val());
    });

    // Load ads
    const adsRef = ref(database, `bands/${bandId}/ads`);
    const adsUnsub = onValue(adsRef, (snapshot) => {
      if (snapshot.val()) {
        const allAds = Object.values(snapshot.val());
        const activeAds = allAds.filter(ad => ad.active === true);
        setAds(activeAds);
      }
    });

    // Load requests for queue count
    const requestsRef = ref(database, `bands/${bandId}/requests`);
    const requestsUnsub = onValue(requestsRef, (snapshot) => {
      if (snapshot.val()) {
        const list = Object.values(snapshot.val())
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

    // Load my requests
    loadMyRequests();

    return () => {
      bandUnsub();
      adsUnsub();
      requestsUnsub();
    };
  }, [bandId, bandSlug]);

  const loadMyRequests = async () => {
    try {
      const stored = await AsyncStorage.getItem(`myRequests_${bandId}`);
      if (stored) setMyRequests(JSON.parse(stored));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Header
        bandName={bandInfo?.bandName || 'Live Jukebox'}
        logoUrl={bandInfo?.logoUrl}
        queueCount={requests.length}
        onQueuePress={() => setQueueModalVisible(true)}
        onBackPress={() => navigation.goBack()}
      />

      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#2a2a2a',
            borderTopColor: '#444',
          },
          tabBarActiveTintColor: '#8B4513',
          tabBarInactiveTintColor: '#888',
        }}
      >
        <Tab.Screen
          name="SetList"
          options={{ tabBarLabel: 'Set List', tabBarIcon: () => <Text style={{ fontSize: 20 }}>🎵</Text> }}
        >
          {() => <SetListScreen bandId={bandId} />}
        </Tab.Screen>

        <Tab.Screen
          name="RequestSongs"
          options={{ tabBarLabel: 'Request Songs', tabBarIcon: () => <Text style={{ fontSize: 20 }}>🎸</Text> }}
        >
          {() => <RequestSongsScreen bandId={bandId} />}
        </Tab.Screen>
      </Tab.Navigator>

      {/* Ad Banner at bottom */}
      {ads.length > 0 && (
        <View style={styles.adBannerContainer}>
          <AdCarousel ads={ads} />
        </View>
      )}

      {/* Queue Modal */}
      <QueueModal
        visible={queueModalVisible}
        onClose={() => setQueueModalVisible(false)}
        requests={requests}
        myRequests={myRequests}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  adBannerContainer: {
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingBottom: 10,
  },
});