import { supabase } from '../services/supabase/config';

/**
 * Script de mantenimiento para el proyecto Cerlita Chat.
 * Elimina notificaciones antiguas y mensajes de chats inactivos (opcional).
 */
export async function cleanupDatabase() {
  console.log('[Cleanup] Starting database maintenance...');

  try {
    // 1. Eliminar notificaciones leídas de más de 30 días
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count, error: notifyError } = await supabase
      .from('notifications')
      .delete()
      .eq('status', 'read')
      .lt('created_at', thirtyDaysAgo.toISOString());

    if (notifyError) throw notifyError;
    console.log(`[Cleanup] Deleted ${count || 0} old notifications.`);

    // 2. Marcar usuarios inactivos como offline (si no se actualizaron en 5 min)
    const fiveMinAgo = new Date();
    fiveMinAgo.setMinutes(fiveMinAgo.getMinutes() - 5);

    const { error: userError } = await supabase
      .from('users')
      .update({ is_online: false })
      .lt('last_seen_at', fiveMinAgo.toISOString())
      .eq('is_online', true);

    if (userError) throw userError;
    console.log('[Cleanup] Synced user online status.');

  } catch (error) {
    console.error('[Cleanup] Maintenance failed:', error);
  }
}
