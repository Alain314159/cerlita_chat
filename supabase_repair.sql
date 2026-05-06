-- ========================================================
-- REPARACIÓN MAESTRA CERLITA CHAT (REALTIME + RLS + RPC)
-- ========================================================

-- 1. Habilitar Realtime para Chats y Mensajes
BEGIN;
  -- Eliminar si ya existe para evitar errores
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE chats, messages, users;
COMMIT;

-- 2. Función Inteligente: get_or_create_direct_chat
-- Esta función asegura que el chat sea real y devuelva un ID válido
CREATE OR REPLACE FUNCTION get_or_create_direct_chat(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
    chat_id UUID;
BEGIN
    -- 1. Buscar si ya existe un chat entre estos dos
    SELECT id INTO chat_id
    FROM chats
    WHERE participant_ids @> ARRAY[user1_id, user2_id]
      AND array_length(participant_ids, 1) = 2
    LIMIT 1;

    -- 2. Si no existe, crearlo
    IF chat_id IS NULL THEN
        INSERT INTO chats (participant_ids)
        VALUES (ARRAY[user1_id, user2_id])
        RETURNING id INTO chat_id;

        -- Agregar a los participantes a la tabla de relación
        INSERT INTO chat_participants (chat_id, user_id)
        VALUES (chat_id, user1_id), (chat_id, user2_id);
    END IF;

    RETURN chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Corregir RLS de Mensajes (Permitir lectura y escritura real)
DROP POLICY IF EXISTS "Users can view messages from their chats" ON messages;
CREATE POLICY "Users can view messages from their chats" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chats 
            WHERE chats.id = messages.chat_id 
            AND auth.uid() = ANY(chats.participant_ids)
        )
    );

DROP POLICY IF EXISTS "Users can insert messages into their chats" ON messages;
CREATE POLICY "Users can insert messages into their chats" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM chats 
            WHERE chats.id = messages.chat_id 
            AND auth.uid() = ANY(chats.participant_ids)
        )
    );

-- 4. Asegurar que los mensajes tengan Realtime activo
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE chats REPLICA IDENTITY FULL;
