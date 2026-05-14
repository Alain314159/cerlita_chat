import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { IconButton } from 'react-native-paper';
import { theme } from '@/config/theme';
import type { Call } from '@/types';
import { Video, Phone, PhoneOff } from 'lucide-react-native';

interface IncomingCallModalProps {
  call: Call | null;
  onAnswer: () => void;
  onDecline: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({ call, onAnswer, onDecline }) => {
  if (!call) return null;
  return (
    <Modal visible={!!call} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <IconButton 
            icon={({ size, color }) => call.type === 'video' ? <Video size={size} color={color} /> : <Phone size={size} color={color} />} 
            size={48} 
            iconColor={theme.colors.primary} 
          />
          <Text style={styles.title}>{call.type === 'video' ? 'Videollamada' : 'Llamada'} entrante</Text>
          <Text style={styles.subtitle}>Contacto</Text>
          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.btn, styles.declineBtn]} onPress={onDecline}>
              <IconButton 
                icon={({ size, color }) => <PhoneOff size={size} color={color} />} 
                size={28} 
                iconColor="#fff" 
              />
              <Text style={styles.btnText}>Rechazar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.answerBtn]} onPress={onAnswer}>
              <IconButton 
                icon={({ size, color }) => <Phone size={size} color={color} />} 
                size={28} 
                iconColor="#fff" 
              />
              <Text style={styles.btnText}>Contestar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  container: { width: '85%', backgroundColor: theme.colors.surface, borderRadius: 24, padding: 32, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: theme.colors.textPrimary, marginTop: 12 },
  subtitle: { fontSize: 16, color: theme.colors.textSecondary, marginBottom: 24 },
  buttons: { flexDirection: 'row', gap: 24 },
  btn: { alignItems: 'center', padding: 12 },
  declineBtn: { backgroundColor: theme.colors.error, borderRadius: 16, width: 120 },
  answerBtn: { backgroundColor: '#4CAF50', borderRadius: 16, width: 120 },
  btnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
