import { NotificationProvider, NotificationPayload } from './types';
import { authService } from '../supabase/auth.service';

class NotificationManager {
  private provider: NotificationProvider | null = null;

  // Set the provider (e.g., OneSignal, Expo, etc.)
  setProvider(provider: NotificationProvider) {
    this.provider = provider;
  }

  async initialize() {
    if (!this.provider) return;
    
    await this.provider.initialize();
    const hasPermission = await this.provider.requestPermissions();
    
    if (hasPermission) {
      const token = await this.provider.getDeviceToken();
      if (token) {
        // Automatically sync with Supabase when we get a token
        const { data: { session } } = await (await import('../supabase/config')).supabase.auth.getSession();
        if (session?.user) {
          await (await import('../supabase/auth.service')).authService.updateProfile(session.user.id, {
            // We'll add push_token to the updateProfile if needed or create a specific method
          });
          
          // Specific method to update push token
          await (await import('../supabase/config')).supabase
            .from('users')
            .update({ push_token: token })
            .eq('id', session.user.id);
        }
      }
    }
  }

  onNotificationReceived(callback: (notification: NotificationPayload) => void) {
    return this.provider?.onNotificationReceived(callback) || (() => {});
  }

  onNotificationOpened(callback: (notification: NotificationPayload) => void) {
    return this.provider?.onNotificationOpened(callback) || (() => {});
  }
}

export const notificationService = new NotificationManager();
