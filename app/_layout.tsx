import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { theme } from '@/config/theme';
import { AuthProvider } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { backgroundTaskService } from '@/services/backgroundTasks';

export default function RootLayout() {
  useEffect(() => {
    // Re-register task if enabled on startup
    backgroundTaskService.isPollingEnabled().then(enabled => {
      if (enabled) {
        backgroundTaskService.register().catch(console.error);
      }
    });
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <QueryProvider>
            <PaperProvider theme={theme}>
              <AuthProvider>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                  }}
                >
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(chat)" />
                  <Stack.Screen name="+not-found" />
                </Stack>
              </AuthProvider>
            </PaperProvider>
          </QueryProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
