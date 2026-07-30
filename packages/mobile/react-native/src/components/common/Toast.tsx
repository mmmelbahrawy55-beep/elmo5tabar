import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

type ToastListener = (toast: ToastMessage) => void;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

class ToastManager {
  private static listeners: ToastListener[] = [];

  static show(toast: Omit<ToastMessage, 'id'>): void {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const fullToast: ToastMessage = { ...toast, id, duration: toast.duration ?? 3000 };
    this.listeners.forEach((listener) => listener(fullToast));
  }

  static success(title: string, message?: string): void {
    this.show({ type: 'success', title, message });
  }

  static error(title: string, message?: string): void {
    this.show({ type: 'error', title, message });
  }

  static warning(title: string, message?: string): void {
    this.show({ type: 'warning', title, message });
  }

  static info(title: string, message?: string): void {
    this.show({ type: 'info', title, message });
  }

  static subscribe(listener: ToastListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}

export const toast = ToastManager;

const getColors = (type: ToastType) => {
  switch (type) {
    case 'success':
      return { bg: '#28A745', icon: '✓' };
    case 'error':
      return { bg: '#DC3545', icon: '✕' };
    case 'warning':
      return { bg: '#FFC107', icon: '⚠' };
    case 'info':
      return { bg: '#17A2B8', icon: 'ℹ' };
  }
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const currentToast = toasts[0];

  useEffect(() => {
    const unsubscribe = ToastManager.subscribe((toast) => {
      setToasts((prev) => [...prev, toast]);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (currentToast) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 15,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        dismissToast();
      }, currentToast.duration);

      return () => clearTimeout(timer);
    }
  }, [currentToast?.id]);

  const dismissToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToasts((prev) => prev.slice(1));
    });
  }, []);

  if (!currentToast) return null;

  const colors = getColors(currentToast.type);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={dismissToast}
        activeOpacity={0.8}
        style={styles.content}
      >
        <Text style={styles.icon}>{colors.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{currentToast.title}</Text>
          {currentToast.message && (
            <Text style={styles.message}>{currentToast.message}</Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    borderRadius: 12,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  icon: {
    fontSize: 20,
    color: '#fff',
    marginRight: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  message: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
});
