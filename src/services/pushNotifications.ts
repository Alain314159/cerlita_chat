import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase/config';
import type { Subscription } from 'expo-notifications';

export interface NotificationData {
  type?: string;
  chatId?: string;
  messageId?: string;
  senderId?: string;
  [key: string]: unknown;
}

class PushNotificationService {
  private static instance: PushNotificationService;
  private receivedListener: Subscription | null = null;
  private responseListener: Subscription | null = null;

  private constructor() {
    this.configureHandler();
  }

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  private configureHandler() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  private async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  }

  private async configureAndroidChannel() {
    if (Platform.OS !== 'android') return;
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF69B4',
    });
  }

  private async getPushToken(): Promise<string | null> {
    if (!Device.isDevice) return null;
    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      return token;
    } catch (error) {
      console.error('[PushNotifications] Error getting token:', error);
      return null;
    }
  }

  public async initialize(uid: string) {
    const permitted = await this.requestPermissions();
    if (!permitted) return;

    await this.configureAndroidChannel();
    const token = await this.getPushToken();

    if (token) {
      // Guardar token en Supabase (Tabla users, columna push_token)
      await supabase.from('users').update({ push_token: token }).eq('id', uid);
    }

    this.receivedListener = Notifications.addNotificationReceivedListener(n => {
      console.log('Notification Received:', n);
    });

    this.responseListener = Notifications.addNotificationResponseReceivedListener(r => {
      console.log('Notification Tapped:', r);
    });
  }

  public cleanup() {
    if (this.receivedListener) Notifications.removeNotificationSubscription(this.receivedListener);
    if (this.responseListener) Notifications.removeNotificationSubscription(this.responseListener);
  }
}

export const pushNotificationService = PushNotificationService.getInstance();
