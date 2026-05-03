import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/services/supabase/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';
const SETTINGS_KEY = 'settings:background_polling';

// Define the task
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
  try {
    const isEnabled = await AsyncStorage.getItem(SETTINGS_KEY);
    if (isEnabled !== 'true') return BackgroundFetch.BackgroundFetchResult.NoData;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return BackgroundFetch.BackgroundFetchResult.NoData;

    // Check for unread messages in the last 20 minutes
    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, content, sender_id, chats(participant_ids)')
      .eq('status', 'sent')
      .neq('sender_id', user.id)
      .limit(5);

    if (error || !messages || messages.length === 0) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Filter messages where user is a participant
    const myMessages = messages.filter((m: any) => 
      m.chats?.participant_ids?.includes(user.id)
    );

    if (myMessages.length > 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Nuevos mensajes 💌",
          body: `Tienes ${myMessages.length} mensaje(s) sin leer.`,
          data: { type: 'background_check' },
        },
        trigger: null,
      });
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }

    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('[BackgroundFetch] Error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export const backgroundTaskService = {
  async register() {
    return BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
      minimumInterval: 60 * 20, // 20 minutes
      stopOnTerminate: false, // android only
      startOnBoot: true, // android only
    });
  },

  async unregister() {
    return BackgroundFetch.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK);
  },

  async setPollingEnabled(enabled: boolean) {
    await AsyncStorage.setItem(SETTINGS_KEY, enabled ? 'true' : 'false');
    if (enabled) {
      await this.register();
    } else {
      await this.unregister().catch(() => {});
    }
  },

  async isPollingEnabled(): Promise<boolean> {
    const value = await AsyncStorage.getItem(SETTINGS_KEY);
    return value === 'true';
  }
};
