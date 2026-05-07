-- ============================================
-- CERLITA CHAT - DATABASE REPAIR & OPTIMIZATION
-- ============================================

-- 1. FIX: Redundancia en Chats (Sincronización automática de participant_ids)
-- En lugar de insertar manualmente en ambas, usamos un trigger.

CREATE OR REPLACE FUNCTION sync_chat_participant_ids()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE chats 
        SET participant_ids = (
            SELECT array_agg(user_id) 
            FROM chat_participants 
            WHERE chat_id = NEW.chat_id
        )
        WHERE id = NEW.chat_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE chats 
        SET participant_ids = (
            SELECT array_agg(user_id) 
            FROM chat_participants 
            WHERE chat_id = OLD.chat_id
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

-- 2. FIX: Seguridad en Notificaciones (Lockdown RLS)
-- Evitar que usuarios inserten notificaciones para otros.

DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
CREATE POLICY "Users can only insert own notifications" ON notifications 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. FIX: Gestión de Presencia (Cleanup de usuarios "atascados")
-- Función para marcar como offline a usuarios que no han tenido actividad en 10 min.

CREATE OR REPLACE FUNCTION cleanup_stuck_online_users()
RETURNS void AS $$
BEGIN
    UPDATE users
    SET is_online = FALSE, is_typing = FALSE
    WHERE is_online = TRUE 
    AND last_seen_at < NOW() - INTERVAL '10 minutes';
END;
$$ LANGUAGE plpgsql;

-- 4. FIX: Optimización de consultas de Chat (Index para búsqueda por texto)
-- Útil para cuando implementemos búsqueda de mensajes.
CREATE INDEX IF NOT EXISTS idx_messages_content_trgm ON messages USING gin (content gin_trgm_ops);
-- Nota: Requiere pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 5. FIX: Seguridad - Asegurar que mensajes E2E no sean leídos si el status es 'read' sin read_at
ALTER TABLE messages ADD CONSTRAINT check_read_at_if_read 
CHECK (status <> 'read' OR read_at IS NOT NULL);
