import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { List, Switch, Button, Divider } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useAuthLogic } from '@/hooks/useAuth';
import { theme } from '@/config/theme';
import { Avatar } from '@/components/ui/Avatar';
import { AvatarSelector } from '@/components/ui/AvatarSelector';
import type { AvatarOption } from '@/types';
import { haptics } from '@/services/haptics';
import { backgroundTaskService } from '@/services/backgroundTasks';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { updateAvatar } = useAuthLogic();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = React.useState(true);
  const [backgroundPolling, setBackgroundPolling] = React.useState(false);
  const [sound, setSound] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  // Cargar estado inicial del polling
  useEffect(() => {
    backgroundTaskService.isPollingEnabled().then(setBackgroundPolling);
  }, []);

  const handleBackgroundPollingToggle = async (value: boolean) => {
    try {
      await backgroundTaskService.setPollingEnabled(value);
      setBackgroundPolling(value);
      if (value) {
        Alert.alert(
          'Modo Respaldo Activado',
          'La app revisará si hay mensajes nuevos cada 20 minutos de forma automática.'
        );
      }
    } catch (error) {
      console.error('Failed to toggle background polling:', error);
    }
  };

  const handleAvatarSelect = useCallback(
    async (avatar: AvatarOption) => {
      try {
        await updateAvatar(avatar);
        setShowAvatarSelector(false);
      } catch (error) {
        console.error('Failed to update avatar:', error);
        Alert.alert('Error', 'No se pudo actualizar el avatar');
      }
    },
    [updateAvatar]
  );

  const handleAvatarPress = useCallback(() => {
    haptics.medium();
    setShowAvatarSelector(true);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  if (!user) {
    return null;
  }

  // Construir avatar option desde el user
  const userAvatar: AvatarOption | undefined = user.avatar || (
    user.photoURL
      ? { type: 'custom', uri: user.photoURL }
      : undefined
  );

  return (
    <>
      <ScrollView
        style={[styles.container, { paddingBottom: insets.bottom }]}
        contentContainerStyle={styles.content}
      >
        {/* Profile Section */}
        <List.Section>
          <List.Subheader>Perfil</List.Subheader>
          
          <List.Item
            title={user.displayName}
            description={user.email}
            left={() => (
              <View style={styles.avatarWrapper}>
                <Avatar
                  uri={userAvatar?.type === 'custom' ? userAvatar.uri : undefined}
                  systemAvatarId={userAvatar?.type === 'system' ? userAvatar.systemId : undefined}
                  size={48}
                  displayName={user.displayName}
                  isOnline={user.isOnline}
                />
              </View>
            )}
            onPress={handleAvatarPress}
            style={styles.profileItem}
            testID="profile-info"
          />
          
          <Button
            mode="text"
            onPress={handleAvatarPress}
            style={styles.changeAvatarButton}
            icon="image-edit"
            labelStyle={styles.changeAvatarLabel}
            testID="change-avatar-button"
          >
            Cambiar Avatar
          </Button>
        </List.Section>

        <Divider />

        {/* Preferences Section */}
        <List.Section>
          <List.Subheader>Preferencias</List.Subheader>

          <List.Item
            title="Notificaciones"
            description="Recibir notificaciones push"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={() => (
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                color={theme.colors.primary}
              />
            )}
            testID="notifications-switch"
          />

          <List.Item
            title="Modo Respaldo (20m)"
            description="Revisar mensajes cada 20 min"
            left={(props) => <List.Icon {...props} icon="sync" />}
            right={() => (
              <Switch
                value={backgroundPolling}
                onValueChange={handleBackgroundPollingToggle}
                color={theme.colors.primary}
              />
            )}
            testID="background-polling-switch"
          />

          <List.Item
            title="Sonido"
            description="Reproducir sonidos de mensajes"
            left={(props) => <List.Icon {...props} icon="volume-high" />}
            right={() => (
              <Switch
                value={sound}
                onValueChange={setSound}
                color={theme.colors.primary}
              />
            )}
            testID="sound-switch"
          />

          <List.Item
            title="Modo oscuro"
            description="Cambiar a tema oscuro"
            left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
            right={() => (
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                color={theme.colors.primary}
              />
            )}
            testID="dark-mode-switch"
          />
        </List.Section>

        <Divider />

        {/* About Section */}
        <List.Section>
          <List.Subheader>Acerca de</List.Subheader>
          <List.Item
            title="Versión"
            description="1.0.0"
            left={(props) => <List.Icon {...props} icon="information" />}
            testID="version-info"
          />
        </List.Section>

        <Divider />

        {/* Sign Out */}
        <View style={styles.signOutContainer}>
          <Button
            mode="contained"
            onPress={handleSignOut}
            style={styles.signOutButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            icon="logout"
            testID="sign-out-button"
          >
            Cerrar Sesión
          </Button>
        </View>
      </ScrollView>

      {/* Avatar Selector Modal */}
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
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingBottom: theme.spacing.xl,
  },
  avatarWrapper: {
    position: 'relative',
  },
  profileItem: {
    paddingVertical: theme.spacing.sm,
  },
  changeAvatarButton: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xs,
  },
  changeAvatarLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  signOutContainer: {
    padding: theme.spacing.lg,
  },
  signOutButton: {
    backgroundColor: theme.colors.error,
  },
  buttonContent: {
    paddingVertical: theme.spacing.sm,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textInverse,
  },
});
