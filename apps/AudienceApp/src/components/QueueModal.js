import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';

export default function QueueModal({ visible, onClose, requests, myRequests }) {
  const renderRequestItem = ({ item }) => {
    const isMine = myRequests.includes(item.id);
    return (
      <View style={[styles.requestItem, isMine && styles.myRequestItem]}>
        <View style={styles.requestInfo}>
          <Text style={styles.requestTitle}>
            {item.songTitle}
            {item.priorityBoost && ' ⚡'}
          </Text>
          <Text style={styles.requestArtist}>{item.artist}</Text>
          <Text style={styles.requestCustomer}>Requested by: {item.customerName}</Text>
        </View>
        <View style={styles.requestStatus}>
          <Text style={[styles.statusText, item.status === 'confirmed' ? styles.confirmed : styles.pending]}>
            {item.paymentMethod === 'vote' ? '🗳️ Voted' : item.status === 'confirmed' ? '✓ Paid' : 'Requested'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Current Queue</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>Close</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={requests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.queueList}
          ListEmptyComponent={<Text style={styles.emptyText}>No requests yet!</Text>}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: 50,
    backgroundColor: '#8B4513',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  closeButton: { color: '#fff', fontWeight: 'bold' },
  queueList: { padding: 15 },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  myRequestItem: { borderWidth: 2, borderColor: '#FFD700' },
  requestInfo: { flex: 1 },
  requestTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  requestArtist: { color: '#aaa', marginTop: 2 },
  requestCustomer: { color: '#ccc', fontSize: 12, marginTop: 4 },
  requestStatus: { justifyContent: 'center', alignItems: 'center' },
  statusText: { fontWeight: 'bold', fontSize: 14 },
  confirmed: { color: '#4CAF50' },
  pending: { color: '#FFA500' },
  emptyText: { color: '#ccc', textAlign: 'center', marginTop: 20, fontSize: 16 },
});