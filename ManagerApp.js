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
  ScrollView
} from 'react-native';
import { database } from './firebaseConfig';
import { ref, onValue, update, remove } from 'firebase/database';

export default function ManagerApp() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [confirmedRequests, setConfirmedRequests] = useState([]);
  const [settings, setSettings] = useState({});
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [newPriorityPrice, setNewPriorityPrice] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'confirmed'

  useEffect(() => {
    // Load all requests
    const requestsRef = ref(database, 'requests');
    onValue(requestsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allRequests = Object.values(data);
        
        // Separate pending and confirmed
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

        setPendingRequests(pending);
        setConfirmedRequests(confirmed);
      } else {
        setPendingRequests([]);
        setConfirmedRequests([]);
      }
    });

    // Load settings
    const settingsRef = ref(database, 'settings');
    onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSettings(data);
        setNewPriorityPrice(data.priorityBoostPrice?.toString() || '10');
      }
    });
  }, []);

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

  const updatePriorityPrice = async () => {
    const price = parseFloat(newPriorityPrice);
    if (isNaN(price) || price < 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price.');
      return;
    }

    try {
      const settingsRef = ref(database, 'settings/priorityBoostPrice');
      await update(ref(database, 'settings'), { priorityBoostPrice: price });
      Alert.alert('Success', `Priority boost price updated to $${price}`);
      setSettingsModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update price.');
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
    
