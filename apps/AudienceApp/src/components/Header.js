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
            {/* Column A (Left) - 2 rows */}
            <View style={styles.leftColumn}>
              {/* A1 - Empty (Row 1) */}
              <View style={styles.row1Cell} />
              
              {/* A2 - Back Button (Row 2) */}
              {onBackPress && (
                <TouchableOpacity 
                  style={[styles.backButton, styles.row2Cell]} 
                  onPress={onBackPress}
                  activeOpacity={0.7}
                >
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Column B (Center) - Logo/Band Name spans both rows (B1:B2 merged) */}
            <View style={styles.centerColumn}>
              {logoUrl ? (
                <Image
                  source={{ uri: logoUrl }}
                  style={{
                    width: logoWidth,
                    height: logoHeight || Math.min(50, MAX_LOGO_HEIGHT), // Reduced max
                    resizeMode: 'contain',
                  }}
                />
              ) : (
                <Text style={styles.bandNameFallback}>{bandName || 'Live Jukebox'}</Text>
              )}
            </View>

            {/* Column C (Right) - 2 rows */}
            <View style={styles.rightColumn}>
              {/* C1 - Tip Spittoon (Row 1) */}
              <View style={styles.row1Cell}>
                {enableTips && (
                  <SpittoonTip onPress={onTipPress} size={44} />
                )}
              </View>
              
              {/* C2 - Queue Button (Row 2) */}
              {onQueuePress && (
                <TouchableOpacity 
                  style={[styles.queueButton, styles.row2Cell]} 
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
    paddingVertical: 0, // Remove all vertical padding
    backgroundColor: 'transparent',
    backgroundImage: 'linear-gradient(to right, #ea580c, #f97316, #ea580c)',
  },
  gridContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: 60, // Reduced from 64
  },
  
  // Shared row styles
  row1Cell: {
    height: 30, // Reduced from 32
    justifyContent: 'center',
    alignItems: 'center',
  },
  row2Cell: {
    height: 30, // Reduced from 32
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Column A (Left)
  leftColumn: {
    width: 70,
    justifyContent: 'space-between', // Distributes rows evenly
  },
  emptyCell: {
    height: 0, // Remove this - using row1Cell/row2Cell instead
  },
  backButton: {
    backgroundColor: '#fff', // Changed from rgba(0, 0, 0, 0.3) to white
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fed7aa', // Match queue button border
  },
  backButtonText: {
    color: '#9a3412', // Match queue button text color
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  // Column B (Center) - Merged cells spanning both rows
  centerColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: 60, // Match new grid height
  },
  bandNameFallback: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  // Column C (Right) - 2 rows
  rightColumn: {
    width: 90,
    justifyContent: 'space-between', // Distributes rows evenly
    alignItems: 'center',
  },
  spittoonCell: {
    // Removed - using row1Cell directly
  },
  queueButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fed7aa',
    minWidth: 80,
  },
  queueButtonText: {
    color: '#9a3412',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
});