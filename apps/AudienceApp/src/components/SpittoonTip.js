import React, { useState, useRef, useEffect } from 'react';
import { TouchableOpacity, Animated, Easing, View, Vibration } from 'react-native';
import Svg, {
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Ellipse,
  Path,
  Line,
  Text as SvgText,
} from 'react-native-svg';

export default function SpittoonTip({ onPress, size = 112 }) {
  const [animating, setAnimating] = useState(false);
  const spitAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => {
      // Cleanup if needed
    };
  }, []);

  const handlePress = () => {
  setAnimating(true);
  
  // Vibrate for tactile feedback
  Vibration.vibrate(50); // Short 50ms buzz
  
  // Animate the spit ball
  Animated.timing(spitAnim, {
    toValue: 1,
    duration: 600,
    easing: Easing.in(Easing.quad),
    useNativeDriver: true,
  }).start(() => {
    setAnimating(false);
    spitAnim.setValue(0);
    if (onPress) onPress();
  });
};

  // Animation transforms for the spit ball
  const spitTranslateY = spitAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-60, 20, 50],
  });

  const spitScale = spitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.4],
  });

  const spitOpacity = spitAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.9, 0],
  });

  return (
    <TouchableOpacity 
      onPress={handlePress}
      activeOpacity={0.7}
      style={{ width: size, height: size * 1.14, position: 'relative' }}
    >
      <View style={{ position: 'relative', width: '100%', height: '100%' }}>
        {/* Spit ball - positioned BEHIND the SVG using zIndex */}
        {animating && (
          <Animated.View
            style={{
              position: 'absolute',
              top: '10%',
              left: '50%',
              marginLeft: -8,
              width: 16,
              height: 16,
              backgroundColor: '#fff',
              borderRadius: 8,
              transform: [
                { translateY: spitTranslateY },
                { scale: spitScale },
              ],
              opacity: spitOpacity,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 5,
              zIndex: 1, // Behind the spittoon
            }}
          />
        )}

        {/* Spittoon SVG - in front */}
        <View style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 2 }}>
          <Svg width={size} height={size * 1.14} viewBox="0 0 140 160">
            <Defs>
              {/* Brass gradients */}
              <RadialGradient id="bodyGrad" cx="35%" cy="40%">
                <Stop offset="0%" stopColor="#F5D9A8" />
                <Stop offset="30%" stopColor="#D4AF7A" />
                <Stop offset="60%" stopColor="#B8865F" />
                <Stop offset="100%" stopColor="#8B6844" />
              </RadialGradient>
              
              <RadialGradient id="rimGrad" cx="30%" cy="35%">
                <Stop offset="0%" stopColor="#FFEDC4" />
                <Stop offset="40%" stopColor="#E8C68A" />
                <Stop offset="80%" stopColor="#C9A464" />
                <Stop offset="100%" stopColor="#A68A5F" />
              </RadialGradient>
              
              <RadialGradient id="neckGrad" cx="35%" cy="40%">
                <Stop offset="0%" stopColor="#E8C68A" />
                <Stop offset="50%" stopColor="#C9A464" />
                <Stop offset="100%" stopColor="#9B7D54" />
              </RadialGradient>
              
              <LinearGradient id="baseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#9B7D54" />
                <Stop offset="50%" stopColor="#8B6844" />
                <Stop offset="100%" stopColor="#6B4A2A" />
              </LinearGradient>
              
              <RadialGradient id="shine">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.3" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </RadialGradient>
              
              <RadialGradient id="darkShadow">
                <Stop offset="0%" stopColor="#000000" stopOpacity="0" />
                <Stop offset="60%" stopColor="#000000" stopOpacity="0.3" />
                <Stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
              </RadialGradient>

              <RadialGradient id="woodGrad" cx="40%" cy="35%">
                <Stop offset="0%" stopColor="#FFFAF0" />
                <Stop offset="40%" stopColor="#F9EDD9" />
                <Stop offset="70%" stopColor="#F4E4C1" />
                <Stop offset="100%" stopColor="#D8C4A8" />
              </RadialGradient>
            </Defs>
            
            {/* Soft shadow */}
            <Ellipse cx="70" cy="145" rx="52" ry="12" fill="#000" opacity="0.3" />
            
            {/* Bottom base */}
            <Ellipse cx="70" cy="131" rx="39" ry="11" fill="#5A3E28" opacity="0.6" />
            <Ellipse cx="70" cy="130" rx="38" ry="10" fill="url(#baseGrad)" stroke="#4A2E18" strokeWidth="1.2" />
            <Ellipse cx="70" cy="129" rx="35" ry="7" fill="#8B6844" opacity="0.3" />
            
            {/* Lower body */}
            <Path
              d="M 32 130 Q 30 128 30 125 Q 26 120 26 105 Q 26 90 28 80 Q 29 75 32 71 Q 40 71 50 70 Q 60 69 70 69 Q 80 69 90 70 Q 100 71 108 71 Q 111 75 112 80 Q 114 90 114 105 Q 114 120 110 125 Q 110 128 108 130 Q 95 132 82 133 Q 70 133.5 58 133 Q 45 132 32 130 Z"
              fill="url(#bodyGrad)"
              stroke="#6B4A2A"
              strokeWidth="1.2"
            />
            
            {/* Highlights and shadows */}
            <Ellipse cx="45" cy="88" rx="18" ry="28" fill="url(#shine)" opacity="0.7" />
            <Ellipse cx="55" cy="95" rx="12" ry="20" fill="#F5D9A8" opacity="0.25" />
            <Ellipse cx="95" cy="95" rx="16" ry="26" fill="url(#darkShadow)" />
            
            {/* Decorative bands */}
            <Path d="M 28 92 Q 35 97 45 99 Q 57 101 70 101 Q 83 101 95 99 Q 105 97 112 92" fill="none" stroke="#8B6844" strokeWidth="5" strokeLinecap="round" opacity="0.4" />
            <Path d="M 28 92 Q 35 97 45 99 Q 57 101 70 101 Q 83 101 95 99 Q 105 97 112 92" fill="none" stroke="#9B7D54" strokeWidth="3.5" strokeLinecap="round" opacity="0.8" />
            <Path d="M 28 91.5 Q 35 96.5 45 98.5 Q 57 100.5 70 100.5 Q 83 100.5 95 98.5 Q 105 96.5 112 91.5" fill="none" stroke="#D4AF7A" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
            
            <Path d="M 28 110 Q 35 115 45 117 Q 57 119 70 119 Q 83 119 95 117 Q 105 115 112 110" fill="none" stroke="#8B6844" strokeWidth="5" strokeLinecap="round" opacity="0.4" />
            <Path d="M 28 110 Q 35 115 45 117 Q 57 119 70 119 Q 83 119 95 117 Q 105 115 112 110" fill="none" stroke="#9B7D54" strokeWidth="3.5" strokeLinecap="round" opacity="0.8" />
            <Path d="M 28 109.5 Q 35 114.5 45 116.5 Q 57 118.5 70 118.5 Q 83 118.5 95 116.5 Q 105 114.5 112 109.5" fill="none" stroke="#D4AF7A" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
            
            {/* Upper body/neck */}
            <Path
              d="M 41 71 Q 39 65 39 55 Q 39 48 42 44 Q 48 44 56 43 Q 63 42 70 42 Q 77 42 84 43 Q 92 44 98 44 Q 101 48 101 55 Q 101 65 99 71 Z"
              fill="url(#neckGrad)"
              stroke="#6B4A2A"
              strokeWidth="1.2"
            />
            
            <Ellipse cx="52" cy="55" rx="10" ry="14" fill="url(#shine)" opacity="0.5" />
            <Ellipse cx="58" cy="58" rx="6" ry="10" fill="#F5D9A8" opacity="0.3" />
            
            {/* Wide flared rim */}
            <Ellipse cx="70" cy="45" rx="56" ry="13" fill="#5A3E28" opacity="0.3" />
            <Ellipse cx="70" cy="44" rx="56" ry="13" fill="url(#rimGrad)" stroke="#6B4A2A" strokeWidth="1.5" />
            <Ellipse cx="70" cy="43" rx="53" ry="11" fill="#D4AF7A" opacity="0.6" />
            <Ellipse cx="70" cy="42" rx="50" ry="9" fill="#C9A464" opacity="0.8" />
            <Ellipse cx="70" cy="38" rx="48" ry="7" fill="url(#shine)" opacity="0.8" />
            <Ellipse cx="58" cy="37" rx="20" ry="4" fill="#FFFFFF" opacity="0.6" />
            
            {/* Opening */}
            <Ellipse cx="70" cy="44" rx="30" ry="8" fill="#0A0500" opacity="0.95" />
            <Ellipse cx="70" cy="43.5" rx="28" ry="7" fill="#000000" />
            <Ellipse cx="70" cy="44" rx="25" ry="6" fill="#0A0500" opacity="0.7" />
            <Ellipse cx="70" cy="44.5" rx="29" ry="6" fill="#1A0C00" opacity="0.6" />
            
            {/* TIPS sign */}
            <Path
              d="M 44 78 Q 44 76 46 76 L 94 76 Q 96 76 96 78 L 96 96 Q 96 98 94 98 L 46 98 Q 44 98 44 96 Z"
              fill="url(#woodGrad)"
              stroke="#8B7355"
              strokeWidth="1.8"
            />
            
            {/* Wood grain */}
            <Line x1="47" y1="79" x2="93" y2="79" stroke="#E8D4B8" strokeWidth="0.5" opacity="0.6" />
            <Line x1="46" y1="82" x2="94" y2="82" stroke="#E8D4B8" strokeWidth="0.4" opacity="0.4" />
            <Line x1="48" y1="85" x2="92" y2="85" stroke="#D8C4A8" strokeWidth="0.5" opacity="0.5" />
            <Line x1="47" y1="88" x2="93" y2="88" stroke="#E8D4B8" strokeWidth="0.4" opacity="0.4" />
            <Line x1="46" y1="92" x2="94" y2="92" stroke="#D8C4A8" strokeWidth="0.5" opacity="0.5" />
            <Line x1="48" y1="95" x2="92" y2="95" stroke="#E8D4B8" strokeWidth="0.4" opacity="0.4" />
            
            <Ellipse cx="60" cy="82" rx="15" ry="6" fill="#FFFFFF" opacity="0.3" />
            
            {/* TIPS text */}
            <SvgText
              x="70.5"
              y="91.5"
              fontSize="18"
              fontWeight="700"
              textAnchor="middle"
              fill="#3A2A1A"
              fontFamily="cursive"
              fontStyle="italic"
              opacity="0.3"
            >
              TIPS
            </SvgText>
            <SvgText
              x="70"
              y="91"
              fontSize="18"
              fontWeight="700"
              textAnchor="middle"
              fill="#5A3E28"
              fontFamily="cursive"
              fontStyle="italic"
            >
              TIPS
            </SvgText>
          </Svg>
        </View>
      </View>
    </TouchableOpacity>
  );
}