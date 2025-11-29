import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { database } from './firebaseConfig';

import BandSelectionScreen from './src/screens/BandSelectionScreen';
import BandTabNavigator from './src/navigation/BandTabNavigator';
import { linking, handleDeepLink } from './src/utils/deepLinking';

const Stack = createNativeStackNavigator();

export default function App() {
  const navigationRef = React.useRef();

  useEffect(() => {
    // Handle initial deep link (app opened from link)
    Linking.getInitialURL().then((url) => {
      if (url && navigationRef.current) {
        handleDeepLink(url, navigationRef.current, database);
      }
    });

    // Handle deep links while app is open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (navigationRef.current) {
        handleDeepLink(url, navigationRef.current, database);
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="BandSelection" component={BandSelectionScreen} />
        <Stack.Screen name="BandTabs" component={BandTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}