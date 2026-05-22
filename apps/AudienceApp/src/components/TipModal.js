import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Linking,
  Vibration,
} from 'react-native';

export default function TipModal({ 
  visible, 
  onClose, 
  venmoUsername,
  tipAmount1 = 5,
  tipAmount2 = 10,
}) {
  const [customAmount, setCustomAmount] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const playCoinSound = () => {
    // Simple haptic feedback instead of sound for now
    // You can add actual sound file later if desired
    Vibration.vibrate(50);
  };

  const handleTipAmount = (amount) => {
    if (!venmoUsername) {
      Alert.alert('Tips Not Available', 'Venmo is not set up for this band.');
      onClose();
      return;
    }

    playCoinSound();

    setTimeout(() => {
      openVenmo(amount);
      onClose();
      setShowCustomInput(false);
      setCustomAmount('');
    }, 300);
  };

  const openVenmo = (amount) => {
  const isMobile = /iPhone|Android/i.test(navigator.userAgent);
  const url = isMobile
    ? `venmo://paycharge?txn=pay&recipients=${venmoUsername}&amount=${amount}&note=Tip%20for%20the%20band!`
    : `https://venmo.com/${venmoUsername}?txn=pay&amount=${amount}&note=Tip%20for%20the%20band!`;
  
  if (typeof window !== 'undefined') {
    window.open(url, '_blank');
  } else {
    Linking.openURL(url).catch(() => {
      Alert.alert('Venmo Not Available', 'Please make sure Venmo is installed on your device.');
    });
  }
};

  const handleCustomSubmit = () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid tip amount.');
      return;
    }
    handleTipAmount(amount);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Thanks Partner! 🤠</Text>
          <Text style={styles.subtitle}>Choose your tip amount</Text>

          {!showCustomInput ? (
            <>
              <View style={styles.buttonGrid}>
                <TouchableOpacity
                  style={styles.tipButton}
                  onPress={() => handleTipAmount(tipAmount1)}
                >
                  <Text style={styles.tipButtonText}>${tipAmount1}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.tipButton}
                  onPress={() => handleTipAmount(tipAmount2)}
                >
                  <Text style={styles.tipButtonText}>${tipAmount2}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.tipButton}
                  onPress={() => setShowCustomInput(true)}
                >
                  <Text style={styles.tipButtonText}>Custom</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.customInputContainer}>
              <Text style={styles.customLabel}>Enter amount:</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  style={styles.customInput}
                  value={customAmount}
                  onChangeText={setCustomAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#999"
                  autoFocus
                />
              </View>
              <View style={styles.customButtonRow}>
                <TouchableOpacity
                  style={[styles.customButton, styles.backButton]}
                  onPress={() => {
                    setShowCustomInput(false);
                    setCustomAmount('');
                  }}
                >
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.customButton, styles.submitButton]}
                  onPress={handleCustomSubmit}
                >
                  <Text style={styles.submitButtonText}>Send Tip</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2a2a2a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  tipButton: {
    flex: 1,
    backgroundColor: '#8B4513',
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  customInputContainer: {
    marginBottom: 16,
  },
  customLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8B4513',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 16,
  },
  dollarSign: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  customInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    paddingVertical: 16,
  },
  customButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  customButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#e0e0e0',
  },
  backButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#8B4513',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});