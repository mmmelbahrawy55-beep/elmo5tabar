import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Dimensions, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../state/auth.store';
import { biometricService } from '../../services/biometric.service';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { theme } = useTheme();
  const { colors, typography } = theme;
  const { hydrate } = useAuthStore();

  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const dot1Opacity = useRef(new Animated.Value(0)).current;
  const dot2Opacity = useRef(new Animated.Value(0)).current;
  const dot3Opacity = useRef(new Animated.Value(0)).current;
  const versionOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          damping: 10,
          stiffness: 100,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.stagger(300, [
        Animated.timing(dot1Opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dot2Opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dot3Opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(versionOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(async () => {
      try {
        hydrate();
        const bio = await biometricService.isAvailable();
        void bio;
      } catch {}

      const minDuration = 2000;
      const elapsed = 0;
      const remaining = Math.max(0, minDuration - elapsed);

      setTimeout(() => {
        onFinish();
      }, remaining);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Animated.View
        style={{
          transform: [{ scale: logoScale }],
          opacity: logoOpacity,
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 30,
            backgroundColor: 'rgba(255,255,255,0.15)',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 48, color: '#fff' }}>🔬</Text>
        </View>
        <Text
          style={{
            fontSize: typography.fontSize.display,
            fontWeight: '700',
            color: colors.textInverse,
            fontFamily: typography.fontFamily.arabic.bold,
            textAlign: 'center',
          }}
        >
          المختبر
        </Text>
        <Text
          style={{
            fontSize: typography.fontSize.md,
            color: 'rgba(255,255,255,0.8)',
            marginTop: 8,
            fontFamily: typography.fontFamily.english.regular,
          }}
        >
          Al Mokhtabar Laboratory
        </Text>
      </Animated.View>

      <View
        style={{
          flexDirection: 'row',
          marginTop: 48,
          gap: 8,
        }}
      >
        {[dot1Opacity, dot2Opacity, dot3Opacity].map((opacity, index) => (
          <Animated.View
            key={index}
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: 'rgba(255,255,255,0.9)',
              opacity,
            }}
          />
        ))}
      </View>

      <Animated.Text
        style={{
          position: 'absolute',
          bottom: 40,
          fontSize: 12,
          color: 'rgba(255,255,255,0.6)',
          fontFamily: typography.fontFamily.english.regular,
          opacity: versionOpacity,
        }}
      >
        Version 1.0.0
      </Animated.Text>
    </View>
  );
};
