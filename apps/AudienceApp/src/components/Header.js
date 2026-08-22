import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SpittoonTip from './SpittoonTip';

export default function Header({ bandName, logoUrl, queueCount, onQueuePress, onBackPress, enableTips, onTipPress }) {
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [logoHeight, setLogoHeight] = useState(0);
  const LOGO_WIDTH_RATIO = 0.4;
  const MAX_LOGO_HEIGHT = 80;

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
        setLogoHeight(Math.min(80, MAX_LOGO_HEIGHT));
      }
    );
  }, [logoUrl, screenWidth]);

  const logoWidth = Math.round(screenWidth * LOGO_WIDTH_RATIO);

  return (
    <View style={styles.headerWrapper}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          {/* Left Column - Back Button */}
          <View style={styles.leftColumn}>
          </View>

          {/* Center Column - Logo */}
          <View style={styles.centerColumn}>
            {logoUrl ? (
              <Image
                source={{ uri: logoUrl }}
                style={{
                  width: logoWidth,
                  height: logoHeight || Math.min(50, MAX_LOGO_HEIGHT),
                  resizeMode: 'contain',
                }}
              />
            ) : (
              <Text style={styles.bandNameFallback}>{bandName || 'Live Jukebox'}</Text>
            )}
          </View>

          {/* Right Column - Spittoon AND Queue side by side */}
          <View style={styles.rightColumn}>
            {/* Tip Spittoon */}
            {enableTips && (
              <View style={styles.spittoonWrapper}>
                <SpittoonTip onPress={onTipPress} size={44} />
              </View>
            )}

            {/* Gap between buttons */}
            <View style={styles.buttonGap} />

            {/* Queue Button */}
            {onQueuePress && (
              <TouchableOpacity
                style={styles.queueButton}
                onPress={onQueuePress}
                activeOpacity={0.7}
              >
                <Text style={styles.queueButtonText} numberOfLines={1}>
                  Queue ({queueCount})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: '#ea580c',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  safeArea: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',           // All columns side by side
    alignItems: 'center',           // Vertically centered
    paddingHorizontal: 8,
    paddingVertical: 8,
    minHeight: 70,                  // Enough room for spittoon
    backgroundColor: 'transparent',
  },

  // Left Column
  leftColumn: {
    width: 70,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fed7aa',
  },
  backButtonText: {
    color: '#9a3412',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Center Column
  centerColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  bandNameFallback: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // Right Column - Spittoon and Queue SIDE BY SIDE
  rightColumn: {
    flexDirection: 'row',           // Side by side!
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 130,                     // Wider to fit both
  },
  spittoonWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonGap: {
    width: 10,                      // Gap between spittoon and queue button
  },
  queueButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fed7aa',
    minWidth: 75,
  },
  queueButtonText: {
    color: '#9a3412',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
});