import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, database } from '../../../firebaseConfig';

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [bandName, setBandName] = useState('');
  const [loading, setLoading] = useState(false);

  const generateBandSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleSignup = async () => {
    // Validation
    if (!email || !password || !bandName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Create authentication account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const bandId = userCredential.user.uid;
      const bandSlug = generateBandSlug(bandName);

      // Create band profile in database
      const bandData = {
        bandName: bandName.trim(),
        bandSlug: bandSlug,
        logoUrl: '',
        venmoUsername: '',
        socialLinks: {
          facebook: '',
          instagram: '',
          tiktok: '',
          website: '',
          spotify: '',
          youtube: ''
        },
        subscription: {
          tier: 'free',
          customAds: false,
          expiresAt: null,
          stripeCustomerId: null,
          stripeSubscriptionId: null
        },
        settings: {
          priorityBoostPrice: 10,
          maxRequests: 10,
          isLive: false,
          venmoUsername: '',
         enableTips: false,
         tipAmount1: 5,
         tipAmount2: 10,
         logoUrl: '',
        },
        songs: {},
        setList: {},
        requests: {},
        ads: {}
      };

      await set(ref(database, `bands/${bandId}`), bandData);

      // Add to band directory
      await set(ref(database, `bandDirectory/${bandSlug}`), {
        bandId: bandId,
        bandName: bandName.trim(),
        logoUrl: '',
        isLive: false,
        lastActive: Date.now()
      });

      Alert.alert('Success', 'Account created! Welcome to Live Jukebox.');
      // Navigation happens automatically via onAuthStateChanged
    } catch (error) {
      let message = 'Signup failed';
      if (error.code === 'auth/email-already-in-use') {
        message = 'This email is already registered';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password is too weak';
      }
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Create Band Account</Text>

        <TextInput
          style={styles.input}
          placeholder="Band Name"
          placeholderTextColor="#999"
          value={bandName}
          onChangeText={setBandName}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password (min 6 characters)"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#999"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignup}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.linkText}>
            Already have an account? Log in
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#fff',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#444',
  },
  button: {
    backgroundColor: '#2c5282',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkButton: {
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  linkText: {
    color: '#4299e1',
    fontSize: 14,
  },
});
