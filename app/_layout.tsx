import React, { useEffect } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, Platform, View } from 'react-native';
import { AuthProvider } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Web-only optimizations (Maestro 2026: Performance & Clean Architecture)
if (Platform.OS === 'web' && typeof document !== 'undefined') {
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

  // Forzar viewport para evitar zoom en inputs y mejorar UX móvil en PWA
  const meta = document.createElement('meta');
  meta.name = 'viewport';
  meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0';
  const head = document.getElementsByTagName('head')[0];
  if (head) {
    head.appendChild(meta);
  }
}

function RootNavigation() {
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
  useEffect(() => {
    // Hide splash screen as soon as navigation is ready
    SplashScreen.hideAsync();
  }, []);

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
