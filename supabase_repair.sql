-- ============================================
-- CERLITA CHAT - DATABASE REPAIR & OPTIMIZATION (CORREGIDO V2)
-- ============================================

-- 1. FIX: Trigger de sincronización (con COALESCE para evitar NULL y ORDER BY para consistencia)
CREATE OR REPLACE FUNCTION sync_chat_participant_ids()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE chats
        SET participant_ids = COALESCE(
            (SELECT array_agg(user_id ORDER BY user_id)
             FROM chat_participants
             WHERE chat_id = NEW.chat_id),
            ARRAY[]::UUID[]
        )
        WHERE id = NEW.chat_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE chats
        SET participant_ids = COALESCE(
            (SELECT array_agg(user_id ORDER BY user_id)
             FROM chat_participants
             WHERE chat_id = OLD.chat_id),
            ARRAY[]::UUID[]
        )
        WHERE id = OLD.chat_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_chat_participants ON chat_participants;
CREATE TRIGGER trigger_sync_chat_participants
AFTER INSERT OR DELETE ON chat_participants
FOR EACH ROW EXECUTE FUNCTION sync_chat_participant_ids();

-- 2. FIX: RLS para notificaciones (Blindaje completo)
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

CREATE POLICY "Users can only insert own notifications" ON notifications
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update own notifications" ON notifications
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete own notifications" ON notifications
FOR DELETE USING (auth.uid() = user_id);

-- 3. FIX: Cleanup de presencia (Función preparada para cron externo)
-- NOTA: Se recomienda llamar a esta función vía Supabase Edge Function + GitHub Action o cron-job.org cada 10 min.
CREATE OR REPLACE FUNCTION cleanup_stuck_online_users()
RETURNS void AS $$
BEGIN
    UPDATE users
    SET is_online = FALSE, is_typing = FALSE
    WHERE is_online = TRUE
    AND last_seen_at < NOW() - INTERVAL '10 minutes';
END;
$$ LANGUAGE plpgsql;

-- 4. FIX: Índice pg_trgm (Orden corregido: Extensión primero)
CREATE EXTENSION IF NOT EXISTS pg_trgm; 
CREATE INDEX IF NOT EXISTS idx_messages_content_trgm 
ON messages USING gin (content gin_trgm_ops);

-- 5. FIX: Constraints de integridad para mensajes (Estados y Lógica temporal)
ALTER TABLE messages DROP CONSTRAINT IF EXISTS check_read_at_if_read;
ALTER TABLE messages ADD CONSTRAINT check_read_at_if_read
CHECK (status <> 'read' OR read_at IS NOT NULL);

ALTER TABLE messages DROP CONSTRAINT IF EXISTS check_read_at_logical;
ALTER TABLE messages ADD CONSTRAINT check_read_at_logical
CHECK (read_at IS NULL OR (read_at >= created_at AND read_at <= NOW()));
