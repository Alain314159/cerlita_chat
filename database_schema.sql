-- ============================================
-- CERLITA CHAT - DATABASE SCHEMA
-- ============================================
-- Ejecutar este SQL en Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: USERS
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL DEFAULT 'Usuario',
    photo_url TEXT,
    
    -- Presencia
    is_online BOOLEAN DEFAULT FALSE,
    last_seen BIGINT,
    is_typing BOOLEAN DEFAULT FALSE,
    
    -- Notificaciones
    push_token TEXT,
    
    -- Timestamps
    created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT,
    updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_online ON users(is_online);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = EXTRACT(EPOCH FROM NOW())::BIGINT;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLA: CHATS
-- ============================================
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct')),
    participant_ids UUID[] NOT NULL,
    
    -- Último mensaje
    last_message TEXT,
    last_message_at BIGINT,
    
    -- Timestamps
    created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT,
    updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
);

-- Indexes
CREATE INDEX idx_chats_participants ON chats USING GIN(participant_ids);
CREATE INDEX idx_chats_last_message_at ON chats(last_message_at DESC NULLS LAST);
CREATE INDEX idx_chats_type ON chats(type);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_chats_updated_at
    BEFORE UPDATE ON chats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLA: MESSAGES
-- ============================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Contenido
    type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'audio', 'file')),
    text TEXT, -- Texto cifrado (E2E)
    media_url TEXT,
    thumbnail_url TEXT,
    
    -- Estado del mensaje
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed')),
    delivered_at BIGINT,
    read_at BIGINT,
    
    -- Timestamps
    created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT,
    edited_at BIGINT
);

-- Indexes
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_status ON messages(status);

-- Trigger para actualizar chat.last_message cuando se inserta un mensaje
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chats
    SET 
        last_message = CASE 
            WHEN NEW.type = 'text' THEN NEW.text
            WHEN NEW.type = 'image' THEN '📷 Photo'
            WHEN NEW.type = 'video' THEN '🎥 Video'
            WHEN NEW.type = 'audio' THEN '🎵 Audio'
            WHEN NEW.type = 'file' THEN '📎 File'
            ELSE 'New message'
        END,
        last_message_at = NEW.created_at,
        updated_at = NEW.created_at
    WHERE id = NEW.chat_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_last_message_trigger
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_last_message();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: USERS
-- ============================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- Users can insert their own profile (during signup)
CREATE POLICY "Users can insert own profile"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================
-- RLS POLICIES: CHATS
-- ============================================

-- Users can view chats where they are participants
CREATE POLICY "Users can view their chats"
    ON chats FOR SELECT
    USING (auth.uid() = ANY(participant_ids));

-- Users can create chats
CREATE POLICY "Users can create chats"
    ON chats FOR INSERT
    WITH CHECK (auth.uid() = ANY(participant_ids));

-- Users can update their chats
CREATE POLICY "Users can update their chats"
    ON chats FOR UPDATE
    USING (auth.uid() = ANY(participant_ids));

-- ============================================
-- RLS POLICIES: MESSAGES
-- ============================================

-- Users can view messages from their chats
CREATE POLICY "Users can view messages from their chats"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM chats
            WHERE chats.id = messages.chat_id
            AND auth.uid() = ANY(chats.participant_ids)
        )
    );

-- Users can send messages to their chats
CREATE POLICY "Users can send messages"
    ON messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM chats
            WHERE chats.id = messages.chat_id
            AND auth.uid() = ANY(chats.participant_ids)
        )
    );

-- Users can update their own messages
CREATE POLICY "Users can update own messages"
    ON messages FOR UPDATE
    USING (auth.uid() = sender_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
    ON messages FOR DELETE
    USING (auth.uid() = sender_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get or create direct chat
CREATE OR REPLACE FUNCTION get_or_create_direct_chat(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
    chat_id UUID;
BEGIN
    -- Try to find existing chat
    SELECT id INTO chat_id
    FROM chats
    WHERE type = 'direct'
    AND participant_ids @> ARRAY[user1_id, user2_id]
    AND participant_ids <@ ARRAY[user1_id, user2_id]
    LIMIT 1;
    
    -- If not found, create new chat
    IF chat_id IS NULL THEN
        INSERT INTO chats (type, participant_ids)
        VALUES ('direct', ARRAY[user1_id, user2_id])
        RETURNING id INTO chat_id;
    END IF;
    
    RETURN chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STORAGE BUCKETS (opcional, ejecutar por separado)
-- ============================================
-- Los buckets se crean desde Supabase Dashboard:
-- 1. Ve a Storage
-- 2. Crea buckets: "images", "videos", "files"
-- 3. Configura políticas RLS para cada bucket

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Después de ejecutar, verifica que existen:
-- ✅ Tabla: users
-- ✅ Tabla: chats
-- ✅ Tabla: messages
-- ✅ RLS activado en todas las tablas
-- ✅ Función: get_or_create_direct_chat
-- ============================================
