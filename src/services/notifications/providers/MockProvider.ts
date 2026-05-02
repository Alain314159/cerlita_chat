import { NotificationProvider, NotificationPayload } from '../types';

export class MockNotificationProvider implements NotificationProvider {
  name = 'MockProvider';

  async initialize() {
    console.log('🔔 Notification Provider Initialized (Mock)');
  }

  async requestPermissions() {
    console.log('🔔 Requesting Notification Permissions...');
    return true;
  }

  async getDeviceToken() {
    return 'mock_device_token_' + Math.random().toString(36).substring(7);
  }

  onNotificationReceived(callback: (notification: NotificationPayload) => void) {
    console.log('🔔 Listener attached for received notifications');
    return () => {};
  }

  onNotificationOpened(callback: (notification: NotificationPayload) => void) {
    console.log('🔔 Listener attached for opened notifications');
    return () => {};
  }

  async cleanup() {
    console.log('🔔 Notification Provider Cleanup');
  }
}
