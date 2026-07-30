import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
  withSequence,
} from 'react-native-reanimated';
import Voice from '@react-native-voice/voice';
import { useTheme } from '../../theme/ThemeContext';
import { BottomSheet, BottomSheetRef } from '../common/BottomSheet';

interface VoiceSearchButtonProps {
  onResult: (text: string) => void;
  onError?: (error: string) => void;
}

export const VoiceSearchButton: React.FC<VoiceSearchButtonProps> = ({
  onResult,
  onError,
}) => {
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const pulseAnim = useSharedValue(0);
  const bottomSheetRef = useRef<BottomSheetRef>(null);

  useEffect(() => {
    Voice.onSpeechResults = (e) => {
      if (e.value?.[0]) {
        setRecognizedText(e.value[0]);
      }
    };
    Voice.onSpeechPartialResults = (e) => {
      if (e.value?.[0]) {
        setRecognizedText(e.value[0]);
      }
    };
    Voice.onSpeechError = (e) => {
      const msg = e.error?.message || 'Voice recognition error';
      setError(msg);
      onError?.(msg);
      setIsListening(false);
    };
    Voice.onSpeechEnd = () => {
      setIsListening(false);
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  useEffect(() => {
    if (isListening) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      pulseAnim.value = withTiming(0, { duration: 300 });
    }
  }, [isListening]);

  const handlePress = useCallback(async () => {
    try {
      setError(null);
      setRecognizedText('');
      const available = await Voice.isAvailable();
      if (!available) {
        throw new Error('Voice recognition not available');
      }
      await Voice.start('ar-SA');
      setIsListening(true);
      bottomSheetRef.current?.expand();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Voice recognition failed';
      setError(msg);
      onError?.(msg);
    }
  }, []);

  const handleStop = useCallback(async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch {}
  }, []);

  const handleConfirmResult = useCallback(() => {
    if (recognizedText) {
      onResult(recognizedText);
      bottomSheetRef.current?.close();
    }
  }, [recognizedText, onResult]);

  const pulseStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      pulseAnim.value,
      [0, 1],
      [1, 1.2],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      pulseAnim.value,
      [0, 1],
      [0.3, 0.1],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <>
      <TouchableOpacity
        onPress={isListening ? handleStop : handlePress}
        activeOpacity={0.7}
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: isListening ? colors.error : colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
        }}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: 28,
              backgroundColor: colors.primary,
            },
            pulseStyle,
          ]}
        />
        <Text style={{ fontSize: 24, color: '#fff' }}>
          {isListening ? '■' : '🎤'}
        </Text>
      </TouchableOpacity>

      <BottomSheet ref={bottomSheetRef} snapPoints={['30%', '50%']}>
        <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
          {error ? (
            <Text style={{ color: colors.error, fontFamily: typography.fontFamily.arabic.regular }}>
              {error}
            </Text>
          ) : (
            <>
              <Text
                style={{
                  fontSize: typography.fontSize.lg,
                  color: colors.text,
                  marginBottom: spacing.lg,
                  textAlign: 'center',
                  fontFamily: typography.fontFamily.arabic.regular,
                }}
              >
                {isListening ? 'Listening...' : recognizedText || 'Tap to speak'}
              </Text>
              {recognizedText && (
                <TouchableOpacity
                  onPress={handleConfirmResult}
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: spacing.xxl,
                    paddingVertical: spacing.md,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>
                    Search
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </BottomSheet>
    </>
  );
};
