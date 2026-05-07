import { supabase } from './config';
import { e2eEncryptionService } from '@/services/crypto/e2e.service';

export type ConnectionStatus = 'pending' | 'accepted' | 'rejected';

export const connectionService = {
  /**
   * Envia una solicitud de conexión cifrada (First Handshake).
   */
  async sendRequest(receiverId: string, initialMessage: string = '¡Hola! Me gustaría conectar contigo.') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // 🔐 CRÍTICO: Establecer clave compartida para el apretón de manos (Handshake)
    const chatId = [user.id, receiverId].sort().join(':');
    await e2eEncryptionService.establishSharedKey(chatId, user.id, receiverId);

    // Ciframos el mensaje inicial para el receptor (handshake)
    const { ciphertext, iv, authTag } = await e2eEncryptionService.encrypt(initialMessage, chatId);

    const { data, error } = await supabase
      .from('connection_requests')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        initial_message_encrypted: ciphertext,
        initial_message_iv: iv,
        initial_message_auth_tag: authTag,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new Error('Ya existe una solicitud pendiente con este usuario.');
      throw new Error(error.message);
    }
    return data;
  },

  /**
   * Obtiene solicitudes recibidas con info del remitente.
   */
  async getIncomingRequests() {
    const { data, error } = await supabase
      .from('connection_requests')
      .select(`
        *,
        sender:users!connection_requests_sender_id_fkey (id, display_name, photo_url)
      `)
      .eq('status', 'pending');

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Acepta la solicitud. El trigger DB 'on_connection_accepted' creará el chat.
   * Inicia el intercambio de claves (Maestro 2026: Zero-Trust).
   */
  async acceptRequest(requestId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // 1. Obtener info de la solicitud para conocer al sender
    const { data: request, error: fetchError } = await supabase
      .from('connection_requests')
      .select('sender_id')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) throw new Error('Request not found');

    // 2. Aceptar en DB
    const { data, error } = await supabase
      .from('connection_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // 3. Obtener el ID del chat recién creado (por el trigger)
    const participantArray = [user.id, request.sender_id].sort();
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('id')
      .contains('participant_ids', participantArray)
      .limit(1)
      .single();

    if (chatError || !chat) {
      console.warn('[Connection] Chat not found yet, derivation might use fallback ID');
    }

    // 4. Establecer clave compartida determinísticamente (First Handshake Solution)
    // Usamos tanto el UUID del chat como un ID determinístico para redundancia
    const deterministicId = participantArray.join(':');
    const finalChatId = chat?.id || deterministicId;
    
    await e2eEncryptionService.establishSharedKey(finalChatId, user.id, request.sender_id);
    
    if (chat?.id && chat.id !== deterministicId) {
      // También asegurar la clave con el ID determinístico por si acaso
      await e2eEncryptionService.establishSharedKey(deterministicId, user.id, request.sender_id);
    }

    return data;
  },

  async rejectRequest(requestId: string) {
    const { error } = await supabase
      .from('connection_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (error) throw new Error(error.message);
  },

  /**
   * Verifica si ya existe una conexión o solicitud entre dos usuarios.
   */
  async getConnectionStatus(otherUserId: string): Promise<ConnectionStatus | 'none'> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'none';

    const { data, error } = await supabase
      .from('connection_requests')
      .select('status')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${otherUserId}`)
      .or(`sender_id.eq.${otherUserId},receiver_id.eq.${user.id}`)
      .maybeSingle();

    if (error) return 'none';
    return data ? data.status as ConnectionStatus : 'none';
  }
};
