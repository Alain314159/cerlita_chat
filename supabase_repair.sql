-- ========================================================
-- REPARACIÓN MAESTRA CERLITA CHAT (EDICIÓN INDUSTRIAL)
-- REALTIME + RLS + ÍNDICES GIN + RPC OPTIMIZADA
-- ========================================================

-- 1. ESTRUCTURA DE TABLAS + CONSTRAINTS + RLS ACTIVADO
ALTER TABLE IF EXISTS chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;

-- 2. ÍNDICES OBLIGATORIOS (Rendimiento + RLS eficiente)
-- Índice GIN para consultas de array (evita scans completos de la tabla chats)
CREATE INDEX IF NOT EXISTS idx_chats_participant_ids_gin 
    ON chats USING gin(participant_ids);

-- Índices para joins frecuentes y ordenamiento
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);

-- Trigger para mantener updated_at sincronizado
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON chats;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. POLÍTICAS RLS (Corregidas y optimizadas)

-- CHATS
DROP POLICY IF EXISTS "Users can view their chats" ON chats;
CREATE POLICY "Users can view their chats" ON chats
    FOR SELECT USING (auth.uid() = ANY(participant_ids));

-- MENSAJES: Lectura
DROP POLICY IF EXISTS "Users can view messages from their chats" ON messages;
CREATE POLICY "Users can view messages from their chats" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chats
            WHERE chats.id = messages.chat_id
            AND auth.uid() = ANY(chats.participant_ids)
        )
    );

-- MENSAJES: Escritura
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

-- PARTICIPANTES
DROP POLICY IF EXISTS "Users can view chat participants" ON chat_participants;
CREATE POLICY "Users can view chat participants" ON chat_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chats
            WHERE chats.id = chat_participants.chat_id
            AND auth.uid() = ANY(chats.participant_ids)
        )
    );

-- 4. FUNCIÓN RPC (Alineada con el esquema y concurrencia)
CREATE OR REPLACE FUNCTION get_or_create_direct_chat(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
    chat_id UUID;
BEGIN
    -- Buscar chat existente (usa el nuevo índice GIN)
    SELECT id INTO chat_id
    FROM chats
    WHERE participant_ids @> ARRAY[user1_id, user2_id]
      AND array_length(participant_ids, 1) = 2
    LIMIT 1;

    IF chat_id IS NULL THEN
        INSERT INTO chats (participant_ids)
        VALUES (ARRAY[user1_id, user2_id])
        RETURNING id INTO chat_id;

        -- Insertar en tabla relacional con manejo de conflictos
        INSERT INTO chat_participants (chat_id, user_id)
        VALUES (chat_id, user1_id), (chat_id, user2_id)
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. REALTIME + REPLICACIÓN
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE chats REPLICA IDENTITY FULL;

BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE chats, messages, chat_participants, users;
COMMIT;
