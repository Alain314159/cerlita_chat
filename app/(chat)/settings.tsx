import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { List, Switch, Button, Divider, Text, useTheme as usePaperTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useAuthLogic } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { AvatarSelector } from '@/components/ui/AvatarSelector';
import type { AvatarOption } from '@/types';
import { haptics } from '@/services/haptics';
import { backgroundTaskService } from '@/services/backgroundTasks';
import { useTheme } from '@/providers/ThemeProvider';
import { 
  Bell, 
  RefreshCw, 
  Volume2, 
  Moon, 
  Info, 
  LogOut,
  Image as ImageIcon
} from 'lucide-react-native';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { updateAvatar } = useAuthLogic();
  const insets = useSafeAreaInsets();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const theme = usePaperTheme();

  const [notifications, setNotifications] = React.useState(true);
  const [backgroundPolling, setBackgroundPolling] = React.useState(false);
  const [sound, setSound] = React.useState(true);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  useEffect(() => {
    backgroundTaskService.isPollingEnabled().then(setBackgroundPolling);
  }, []);

  const handleBackgroundPollingToggle = async (value: boolean) => {
    try {
      await backgroundTaskService.setPollingEnabled(value);
      setBackgroundPolling(value);
      if (value) {
        Alert.alert('Modo Respaldo Activado', 'La app revisará si hay mensajes nuevos cada 20 minutos.');
      }
    } catch (error) {
      console.error('Failed to toggle background polling:', error);
    }
  };

  const handleAvatarSelect = useCallback(async (avatar: AvatarOption) => {
    try {
      await updateAvatar(avatar);
      setShowAvatarSelector(false);
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el avatar');
    }
  }, [updateAvatar]);

  const handleAvatarPress = useCallback(() => {
    haptics.medium();
    setShowAvatarSelector(true);
  }, []);

  const handleSignOut = async () => {
    try { await signOut(); } catch (e) { console.error(e); }
  };

  if (!user) return null;

  const userAvatar: AvatarOption | undefined = user.avatar || (
    user.photoURL ? { type: 'custom', uri: user.photoURL } : undefined
  );

  return (
    <>
      <ScrollView
        style={[styles.container, { paddingBottom: insets.bottom, backgroundColor: theme.colors.background }]}
        contentContainerStyle={[styles.content, { backgroundColor: theme.colors.background }]}
      >
        <List.Section>
          <List.Subheader style={{ color: theme.colors.primary }}>Perfil</List.Subheader>
          <List.Item
            title={user.displayName}
            titleStyle={{ color: theme.colors.onSurface }}
            description={user.email}
            descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            left={() => (
              <Avatar
                uri={userAvatar?.type === 'custom' ? userAvatar.uri : undefined}
                systemAvatarId={userAvatar?.type === 'system' ? userAvatar.systemId : undefined}
                size={48}
                displayName={user.displayName}
                isOnline={user.isOnline}
              />
            )}
            onPress={handleAvatarPress}
            style={styles.profileItem}
          />
          <Button
            mode="text"
            onPress={handleAvatarPress}
            style={styles.changeAvatarButton}
            icon={() => <ImageIcon size={20} color={theme.colors.primary} />}
          >
            Cambiar Avatar
          </Button>
        </List.Section>

        <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />

        <List.Section>
          <List.Subheader style={{ color: theme.colors.primary }}>Preferencias</List.Subheader>

          <List.Item
            title="Notificaciones"
            titleStyle={{ color: theme.colors.onSurface }}
            description="Recibir notificaciones push"
            descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            left={() => <View style={styles.iconContainer}><Bell size={24} color={theme.colors.secondary} /></View>}
            right={() => (
              <Switch value={notifications} onValueChange={setNotifications} color={theme.colors.primary} />
            )}
          />

          <List.Item
            title="Modo Respaldo (20m)"
            titleStyle={{ color: theme.colors.onSurface }}
            description="Revisar mensajes cada 20 min"
            descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            left={() => <View style={styles.iconContainer}><RefreshCw size={24} color={theme.colors.secondary} /></View>}
            right={() => (
              <Switch value={backgroundPolling} onValueChange={handleBackgroundPollingToggle} color={theme.colors.primary} />
            )}
          />

          <List.Item
            title="Sonido"
            titleStyle={{ color: theme.colors.onSurface }}
            description="Reproducir sonidos de mensajes"
            descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            left={() => <View style={styles.iconContainer}><Volume2 size={24} color={theme.colors.secondary} /></View>}
            right={() => (
              <Switch value={sound} onValueChange={setSound} color={theme.colors.primary} />
            )}
          />

          <List.Item
            title="Modo oscuro"
            titleStyle={{ color: theme.colors.onSurface }}
            description="Cambiar a tema oscuro"
            descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            left={() => <View style={styles.iconContainer}><Moon size={24} color={theme.colors.secondary} /></View>}
            right={() => (
              <Switch value={isDarkMode} onValueChange={toggleDarkMode} color={theme.colors.primary} />
            )}
          />
        </List.Section>

        <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />

        <List.Section>
          <List.Subheader style={{ color: theme.colors.primary }}>Acerca de</List.Subheader>
          <List.Item
            title="Versión"
            titleStyle={{ color: theme.colors.onSurface }}
            description="1.0.0"
            descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            left={() => <View style={styles.iconContainer}><Info size={24} color={theme.colors.secondary} /></View>}
          />
        </List.Section>

        <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />

        <View style={styles.signOutContainer}>
          <Button
            mode="contained"
            onPress={handleSignOut}
            style={styles.signOutButton}
            contentStyle={styles.buttonContent}
            icon={() => <LogOut size={20} color="#fff" />}
          >
            Cerrar Sesión
          </Button>
        </View>
      </ScrollView>

      <AvatarSelector
        currentAvatar={userAvatar}
        onAvatarSelect={handleAvatarSelect}
        visible={showAvatarSelector}
        onClose={() => setShowAvatarSelector(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 32 },
  profileItem: { paddingVertical: 8 },
  changeAvatarButton: { marginHorizontal: 24, marginTop: 4 },
  signOutContainer: { padding: 24 },
  signOutButton: { backgroundColor: '#FF3B30' },
  buttonContent: { paddingVertical: 8 },
  iconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
