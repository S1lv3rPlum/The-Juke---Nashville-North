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
      const settingsRef = ref(database, 'settings');
      await update(settingsRef, { priorityBoostPrice: price });
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
      </View>

      {/* Request Lists */}
      {activeTab === 'pending' ? (
        <FlatList
          data={pendingRequests}
          renderItem={renderPendingRequest}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No pending requests</Text>
          }
        />
      ) : (
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

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={updatePriorityPrice}
            >
              <Text style={styles.buttonText}>Save Changes</Text>
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
    fontSize: 16,
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
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  playedButton: {
    backgroundColor: '#9C27B0',
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
  priceInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    marginBottom: 10,
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
