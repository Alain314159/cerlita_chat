import { supabase } from './config';

export type ConnectionStatus = 'pending' | 'accepted' | 'rejected';

export const connectionService = {
  // Enviar solicitud de conexión
  async sendRequest(receiverId: string, initialMessage?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('connection_requests')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        initial_message_encrypted: initialMessage,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Obtener solicitudes recibidas (pendientes)
  async getIncomingRequests() {
    const { data, error } = await supabase
      .from('connection_requests')
      .select(`
        *,
        sender:sender_id (id, display_name, photo_url)
      `)
      .eq('status', 'pending');

    if (error) throw new Error(error.message);
    return data;
  },

  // Aceptar solicitud (esto debería disparar un trigger en Supabase para crear el chat)
  async acceptRequest(requestId: string) {
    const { data, error } = await supabase
      .from('connection_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Rechazar solicitud
  async rejectRequest(requestId: string) {
    const { error } = await supabase
      .from('connection_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (error) throw new Error(error.message);
  }
};
