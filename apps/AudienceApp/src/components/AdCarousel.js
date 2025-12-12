import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Linking,
} from 'react-native';

export default function AdCarousel({ ads }) {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  useEffect(() => {
    const subscription = Dimensions.addEventListener?.('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => {
      if (subscription && typeof subscription.remove === 'function') subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (ads.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentAdIndex((prevIndex) => (prevIndex + 1) % ads.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [ads.length]);

  if (!ads || ads.length === 0) return null;

  const currentAd = ads[currentAdIndex];
  const adWidth = screenWidth - 20;
  const adHeight = adWidth / 6;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => currentAd.linkURL && Linking.openURL(currentAd.linkURL)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: currentAd.imageURL }}
          style={{
            width: adWidth,
            height: adHeight,
            borderRadius: 8,
            resizeMode: 'contain',
          }}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});