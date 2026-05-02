export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  image?: string;
}

export interface NotificationProvider {
  name: string;
  
  // Initialize the provider
  initialize(): Promise<void>;
  
  // Request user permissions
  requestPermissions(): Promise<boolean>;
  
  // Get the device token for push notifications
  getDeviceToken(): Promise<string | null>;
  
  // Listen for incoming notifications
  onNotificationReceived(callback: (notification: NotificationPayload) => void): () => void;
  
  // Listen for notification clicks/opens
  onNotificationOpened(callback: (notification: NotificationPayload) => void): () => void;
  
  // Unregister/cleanup
  cleanup(): Promise<void>;
}
