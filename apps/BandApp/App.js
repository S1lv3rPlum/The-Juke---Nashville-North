// BandApp/App.js
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';

// Import auth screens
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import RoleSelectionScreen from './src/screens/RoleSelectionScreen';

// Import actual app screens
import BandLeaderApp from './src/screens/leader/LeaderApp';
import ManagerApp from './src/screens/manager/ManagerApp';

const Stack = createNativeStackNavigator();
const DEV_FORCE_LOGIN = false; // Set to true for development testing

// in app browser detection
function isInAppBrowser() {
  const ua = navigator.userAgent || navigator.vendor || '';
  return /FBAN|FBAV|Instagram|Line\/|Twitter|GSA\/|wv\)/i.test(ua);
}

// Auth Stack
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

// Main App Stack (after login)
function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="ManagerApp" component={ManagerApp} />
      <Stack.Screen name="LeaderApp" component={BandLeaderApp} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (DEV_FORCE_LOGIN) {
      // Skip auth for development testing
      setUser({ uid: 'Nashville-North' });
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Safety net: if auth never resolves, stop spinning forever
    const timeout = setTimeout(() => {
      setTimedOut(true);
    }, 6000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (isInAppBrowser()) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.placeholderTitle}>🎸</Text>
        <Text style={styles.loadingText}>
          Please open this link in Chrome or Safari to sign in{'\n'}
          (tap ⋮ or ⋯ above and choose "Open in Browser")
        </Text>
      </View>
    );
  }

  if (loading && !timedOut) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c5282" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (loading && timedOut) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          Taking longer than expected. Please open this link in Chrome or Safari directly, then try again.
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },

  placeholder: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  placeholderTitle: {
    fontSize: 48,
    color: '#fff',
    marginBottom: 20,
  },

  placeholderText: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 24,
  },

  logoutButton: {
    backgroundColor: '#2c5282',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 30,
  },

  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
