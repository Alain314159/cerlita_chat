import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/config/theme';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!displayName.trim() || !email.trim() || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    try {
      setLoading(true);
      await signUp(email, password, displayName);
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert('Error', error.message || 'No se pudo crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>
            Únete a Cerlita Chat y conecta con tu persona especial
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Nombre Completo"
            value={displayName}
            onChangeText={setDisplayName}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon={({ size, color }) => <User size={size} color={color} />} />}
          />

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            left={<TextInput.Icon icon={({ size, color }) => <Mail size={size} color={color} />} />}
          />

          <TextInput
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            style={styles.input}
            left={<TextInput.Icon icon={({ size, color }) => <Lock size={size} color={color} />} />}
            right={
              <TextInput.Icon
                icon={({ size, color }) => showPassword ? <EyeOff size={size} color={color} /> : <Eye size={size} color={color} />}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Registrarse
          </Button>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.link}>Inicia Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: theme.spacing.lg },
  header: { alignItems: 'center', marginBottom: theme.spacing.xl },
  title: { fontSize: 28, fontWeight: 'bold', color: theme.colors.primary, marginBottom: theme.spacing.sm },
  subtitle: { fontSize: 16, color: theme.colors.textSecondary, textAlign: 'center' },
  form: { gap: theme.spacing.md },
  input: { marginBottom: theme.spacing.xs },
  button: { marginTop: theme.spacing.md },
  buttonContent: { paddingVertical: theme.spacing.xs },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: theme.spacing.md },
  footerText: { color: theme.colors.textSecondary, fontSize: 14 },
  link: { color: theme.colors.primary, fontWeight: 'bold', fontSize: 14 },
});
