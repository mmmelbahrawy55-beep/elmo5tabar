import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import { Platform, Alert } from 'react-native';
import { storage, StorageKeys } from './storage.service';

type NotificationNavigationHandler = (data: Record<string, string>) => void;

class NotificationService {
  private onNotificationTap: NotificationNavigationHandler | null = null;

  setNavigationHandler(handler: NotificationNavigationHandler): void {
    this.onNotificationTap = handler;
  }

  async requestPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      return enabled;
    } catch {
      return false;
    }
  }

  async getFCMToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      if (token) {
        storage.setString(StorageKeys.NOTIFICATION_TOKEN, token);
      }
      return token;
    } catch {
      return null;
    }
  }

  async deleteToken(): Promise<void> {
    try {
      await messaging().deleteToken();
      storage.delete(StorageKeys.NOTIFICATION_TOKEN);
    } catch {
    }
  }

  onMessage(handler: (message: FirebaseMessagingTypes.RemoteMessage) => void): () => void {
    return messaging().onMessage(handler);
  }

  onNotificationOpenedApp(handler: (message: FirebaseMessagingTypes.RemoteMessage) => void): () => void {
    return messaging().onNotificationOpenedApp(handler);
  }

  async getInitialNotification(): Promise<FirebaseMessagingTypes.RemoteMessage | null> {
    try {
      return await messaging().getInitialNotification();
    } catch {
      return null;
    }
  }

  onTokenRefresh(handler: (token: string) => void): () => void {
    return messaging().onTokenRefresh(handler);
  }

  handleNotificationData(data: Record<string, string>): void {
    if (this.onNotificationTap) {
      this.onNotificationTap(data);
      return;
    }

    if (data.appointment_id) {
    } else if (data.result_id) {
    } else if (data.payment_id) {
    } else if (data.message_id) {
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    if (Platform.OS === 'ios') {
      messaging().setBadgeNumber(count);
    }
  }

  async getInitialNotificationAndNavigate(): Promise<void> {
    const initial = await this.getInitialNotification();
    if (initial?.data) {
      this.handleNotificationData(initial.data as Record<string, string>);
    }
  }

  registerPeriodicTokenRefresh(): void {
    this.onTokenRefresh((token) => {
      storage.setString(StorageKeys.NOTIFICATION_TOKEN, token);
    });
  }
}

export const notificationService = new NotificationService();
