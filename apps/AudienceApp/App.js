import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';

import BandSelectionScreen from './src/screens/BandSelectionScreen';
import BandTabNavigator from './src/navigation/BandTabNavigator';
import { database } from './firebaseConfig';
import { linking, handleDeepLink } from './src/utils/deepLinking';

const Stack = createNativeStackNavigator();

export default function App() {
  const navigationRef = useRef();

  useEffect(() => {
    // Handle initial deep link safely
    const initLinking = async () => {
      try {
        const url = await Linking.getInitialURL();
        if (url && navigationRef.current) {
          handleDeepLink(url, navigationRef.current, database);
        }
      } catch (e) {
        console.log('Error handling initial URL', e);
      }
    };
    initLinking();

    // Handle deep links while app is open safely
    const subscription = Linking.addEventListener('url', ({ url }) => {
      try {
        if (navigationRef.current) {
          handleDeepLink(url, navigationRef.current, database);
        }
      } catch (e) {
        console.log('Error handling URL event', e);
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="BandSelection"
          component={(props) => {
            try {
              return <BandSelectionScreen {...props} />;
            } catch (e) {
              console.log('BandSelectionScreen error', e);
              return null;
            }
          }}
        />
        <Stack.Screen
          name="BandTabs"
          component={(props) => {
            try {
              return <BandTabNavigator {...props} />;
            } catch (e) {
              console.log('BandTabNavigator error', e);
              return null;
            }
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
