import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';

export default function Header({ bandName, logoUrl, queueCount, onQueuePress, onBackPress }) {
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [logoHeight, setLogoHeight] = useState(0);
  const LOGO_WIDTH_RATIO = 0.5;
  const MAX_LOGO_HEIGHT = 200;

  useEffect(() => {
    const subscription = Dimensions.addEventListener?.('change', ({ window }) => {
      setScreenWidth(window.width);
    }) || (() => {});
    return () => {
      if (subscription && typeof subscription.remove === 'function') subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!logoUrl) {
      setLogoHeight(0);
      return;
    }
    Image.getSize(
      logoUrl,
      (width, height) => {
        const targetWidth = Math.round(screenWidth * LOGO_WIDTH_RATIO);
        let calculatedHeight = Math.round((height / width) * targetWidth);
        if (calculatedHeight > MAX_LOGO_HEIGHT) calculatedHeight = MAX_LOGO_HEIGHT;
        setLogoHeight(calculatedHeight);
      },
      () => {
        setLogoHeight(Math.min(100, MAX_LOGO_HEIGHT));
      }
    );
  }, [logoUrl, screenWidth]);

  const logoWidth = Math.round(screenWidth * LOGO_WIDTH_RATIO);

  return (
    <View style={styles.headerWrapper}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          {onBackPress && (
            <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.centerBlock}>
            {logoUrl ? (
              <Image
                source={{ uri: logoUrl }}
                style={{
                  width: logoWidth,
                  height: logoHeight || Math.min(80, MAX_LOGO_HEIGHT),
                  resizeMode: 'contain',
                }}
              />
            ) : (
              <Text style={styles.bandNameFallback}>{bandName || 'Live Jukebox'}</Text>
            )}
          </View>
          
          {onQueuePress && (
            <TouchableOpacity style={styles.queueButton} onPress={onQueuePress}>
              <Text style={styles.queueButtonText}>Queue ({queueCount})</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: '#8B4513',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  safeArea: {
    backgroundColor: '#8B4513',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#8B4513',
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    maxWidth: '40%',
  },
  queueButtonText: {
    color: '#8B4513',
    fontWeight: 'bold',
    fontSize: 14,
  },
  bandNameFallback: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});