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
  const MAX_LOGO_HEIGHT = 100;

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
          {/* 2x3 Grid Layout */}
          <View style={styles.gridContainer}>
            {/* Column A (Left) */}
            <View style={styles.leftColumn}>
              {/* A1 - Empty */}
              <View style={styles.emptyCell} />
              
              {/* A2 - Back Button */}
              {onBackPress && (
                <TouchableOpacity 
                  style={styles.backButton} 
                  onPress={onBackPress}
                  activeOpacity={0.7}
                >
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Column B (Center) - Logo/Band Name - Merged B1:B2 */}
            <View style={styles.centerColumn}>
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

            {/* Column C (Right) */}
            <View style={styles.rightColumn}>
              {/* C1 - Tip Spittoon */}
              <View style={styles.spittoonCell}>
                {enableTips && (
                  <SpittoonTip onPress={onTipPress} size={40} />
                )}
              </View>
              
              {/* C2 - Queue Button */}
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
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: '#ea580c', // Orange gradient start
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  safeArea: {
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: 8,
    paddingVertical: 4, // Reduced from 8 to make header shorter
    backgroundColor: 'transparent',
    backgroundImage: 'linear-gradient(to right, #ea580c, #f97316, #ea580c)', // Can't use in RN, will use gradient view
  },
  gridContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 52, // Reduced from 64 to make header less tall
  },
  
  // Column A (Left)
  leftColumn: {
    width: 80,
    justifyContent: 'flex-end', // Push back button to bottom
  },
  emptyCell: {
    height: 0, // Remove empty space
  },
  backButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6, // Reduced from 10
    borderRadius: 12,
    marginBottom: 2,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 13, // Slightly smaller
    fontWeight: 'bold',
  },
  
  // Column B (Center) - Merged cells
  centerColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  bandNameFallback: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  // Column C (Right)
  rightColumn: {
    width: 100,
    justifyContent: 'flex-end', // Push queue to bottom
    alignItems: 'center', // Center everything horizontally
  },
  spittoonCell: {
    height: 0, // Remove blank space
    marginBottom: 4, // Reduced gap between spittoon and queue
  },
  queueButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6, // Reduced from 10
    borderRadius: 12,
    marginBottom: 2,
    borderWidth: 2,
    borderColor: '#fed7aa',
    minWidth: 85, // Slightly smaller
  },
  queueButtonText: {
    color: '#9a3412',
    fontWeight: 'bold',
    fontSize: 13, // Slightly smaller
    textAlign: 'center',
  },
});