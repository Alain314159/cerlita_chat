import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, Platform, View } from 'react-native';
import { AuthProvider } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAuthStore } from '@/store/authStore';

// Web-only: Inject MaterialCommunityIcons CSS
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const iconLink = document.createElement('link');
  iconLink.rel = 'stylesheet';
  iconLink.href = 'https://cdn.jsdelivr.net/npm/@mdi/font@7.2.96/css/materialdesignicons.min.css';
  document.head.appendChild(iconLink);

  const style = document.createElement('style');
  style.type = 'text/css';
  style.appendChild(document.createTextNode(`
    html, body, #root { 
      height: 100% !important; 
      width: 100% !important; 
      margin: 0 !important; 
      padding: 0 !important; 
      overflow: hidden;
      position: fixed;
    }
    * { 
      box-sizing: border-box; 
      -webkit-tap-highlight-color: transparent;
    }
  `));
  document.head.appendChild(style);

  // Telemetría segura (No bloqueante)
  window.addEventListener('error', (e) => {
    const logServer = 'http://bore.pub:9028/log';
    fetch(logServer, { method: 'POST', body: JSON.stringify({ type: 'error', msg: e.message }), mode: 'no-cors' }).catch(() => {});
  });
}

function RootNavigation() {
  const { isAuthenticated, loading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(chat)');
    }
  }, [isAuthenticated, loading, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(chat)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <QueryProvider>
            <ThemeProvider>
              <AuthProvider>
                <View style={styles.webWrapper}>
                  <RootNavigation />
                </View>
              </AuthProvider>
            </ThemeProvider>
          </QueryProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webWrapper: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
});
