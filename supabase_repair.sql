-- ========================================================
-- 1. ESTRUCTURA DE TABLAS + CONSTRAINTS + RLS ACTIVADO
-- ========================================================

-- TABLA: chats
CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_ids UUID[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- TABLA: chat_participants (Fuente de verdad relacional)
CREATE TABLE IF NOT EXISTS chat_participants (
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (chat_id, user_id)
);
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;

-- TABLA: messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL CHECK (char_length(trim(content)) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;


-- ========================================================
-- 2. ÍNDICES OBLIGATORIOS (Rendimiento + RLS eficiente)
-- ========================================================

-- Índice GIN para consultas de array (evita scans completos)
CREATE INDEX IF NOT EXISTS idx_chats_participant_ids_gin 
    ON chats USING gin(participant_ids uuid_array_ops);

-- Índices para joins frecuentes y ordenamiento
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);

-- Trigger para mantener updated_at sincronizado (evita staleness en Realtime)
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


-- ========================================================
-- 3. POLÍTICAS RLS (Corregidas y optimizadas)
-- ========================================================

-- CHATS: Solo ver chats donde participas
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

-- PARTICIPANTES: Solo ver/listar participantes de tus chats
DROP POLICY IF EXISTS "Users can view chat participants" ON chat_participants;
CREATE POLICY "Users can view chat participants" ON chat_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chats
            WHERE chats.id = chat_participants.chat_id
            AND auth.uid() = ANY(chats.participant_ids)
        )
    );

-- USUARIOS: Búsqueda pública (ajustar si manejas datos sensibles)
DROP POLICY IF EXISTS "Users can view all users" ON users;
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);


-- ========================================================
-- 4. FUNCIÓN RPC (Alineada con el esquema)
-- ========================================================
CREATE OR REPLACE FUNCTION get_or_create_direct_chat(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
    chat_id UUID;
BEGIN
    -- Buscar chat existente (usa índice GIN)
    SELECT id INTO chat_id
    FROM chats
    WHERE participant_ids @> ARRAY[user1_id, user2_id]
      AND array_length(participant_ids, 1) = 2
    LIMIT 1;

    IF chat_id IS NULL THEN
        INSERT INTO chats (participant_ids)
        VALUES (ARRAY[user1_id, user2_id])
        RETURNING id INTO chat_id;

        -- Insertar en tabla relacional (fuente de verdad para joins futuros)
        INSERT INTO chat_participants (chat_id, user_id)
        VALUES (chat_id, user1_id), (chat_id, user2_id)
        ON CONFLICT DO NOTHING; -- Previene errores si se llama concurrentemente
    END IF;

    RETURN chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ========================================================
-- 5. REALTIME + REPLICACIÓN
-- ========================================================
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE chats REPLICA IDENTITY FULL;

BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE chats, messages, chat_participants, users;
COMMIT;
