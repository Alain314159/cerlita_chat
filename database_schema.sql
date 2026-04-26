-- ============================================
-- CERLITA CHAT - DATABASE SCHEMA (STRICT 1-ON-1)
-- ============================================
-- Ejecutar este SQL en Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: USERS
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL DEFAULT 'Usuario',
    photo_url TEXT,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen_at TIMESTAMPTZ,
    is_typing BOOLEAN DEFAULT FALSE,
    push_token TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_online ON users(is_online);

-- ============================================
-- TABLA: CHATS (Strict 1-on-1)
-- ============================================
CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_ids UUID[] NOT NULL,
    last_message_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_participant_ids ON chats USING GIN (participant_ids);

-- ============================================
-- TABLA: CHAT_PARTICIPANTS
-- ============================================
CREATE TABLE IF NOT EXISTS chat_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(chat_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_id ON chat_participants(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);

-- ============================================
-- TABLA: MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'file')),
    content TEXT,
    media_url TEXT,
    thumbnail_url TEXT,
    reply_to_id UUID REFERENCES messages(id),
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'failed')),
    is_edited BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- ============================================
-- TABLA: MESSAGE_REACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);

-- ============================================
-- AGREGAR FK de chats -> messages
-- ============================================
ALTER TABLE chats ADD CONSTRAINT fk_chats_last_message
    FOREIGN KEY (last_message_id) REFERENCES messages(id);

-- ============================================
-- TABLA: NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update chat's updated_at and last_message_id on new message
CREATE OR REPLACE FUNCTION update_chat_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chats
    SET last_message_id = NEW.id, updated_at = NOW()
    WHERE id = NEW.chat_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_on_new_message_trigger
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_on_new_message();

-- Enforce 1-on-1: Max 2 participants per chat
CREATE OR REPLACE FUNCTION enforce_one_on_one_chat()
RETURNS TRIGGER AS $$
DECLARE
    participant_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO participant_count
    FROM chat_participants
    WHERE chat_id = NEW.chat_id;

    IF participant_count >= 2 THEN
        RAISE EXCEPTION 'Strict 1-on-1: Chat already has 2 participants.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_one_on_one_chat_trigger
    BEFORE INSERT ON chat_participants
    FOR EACH ROW
    EXECUTE FUNCTION enforce_one_on_one_chat();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- USERS
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- CHATS
CREATE POLICY "Users can view their chats" ON chats FOR SELECT 
    USING (auth.uid() = ANY(participant_ids));
CREATE POLICY "Users can update their chats" ON chats FOR UPDATE 
    USING (auth.uid() = ANY(participant_ids));
-- Lockdown RLS: strictly prevent spam/DDoS
CREATE POLICY "Strict 1-on-1 chat creation" ON chats FOR INSERT WITH CHECK (
    auth.uid() = ANY(participant_ids) AND 
    array_length(participant_ids, 1) = 2
);

-- CHAT_PARTICIPANTS
CREATE POLICY "Users can view participants of their chats" ON chat_participants FOR SELECT
    USING (EXISTS (SELECT 1 FROM chats WHERE id = chat_participants.chat_id AND auth.uid() = ANY(participant_ids)));
CREATE POLICY "Users cannot directly join chats" ON chat_participants FOR INSERT WITH CHECK (false);

-- MESSAGES
CREATE POLICY "Users can view messages from their chats" ON messages FOR SELECT
    USING (EXISTS (SELECT 1 FROM chats WHERE id = messages.chat_id AND auth.uid() = ANY(participant_ids)));
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND 
    EXISTS (SELECT 1 FROM chats WHERE id = messages.chat_id AND auth.uid() = ANY(participant_ids))
);
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE USING (auth.uid() = sender_id);
CREATE POLICY "Users can delete own messages" ON messages FOR DELETE USING (auth.uid() = sender_id);

-- MESSAGE_REACTIONS
CREATE POLICY "Users can view reactions in their chats" ON message_reactions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM messages m
        JOIN chats c ON c.id = m.chat_id
        WHERE m.id = message_reactions.message_id AND auth.uid() = ANY(c.participant_ids)
    ));
CREATE POLICY "Users can add reactions" ON message_reactions FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM messages m
        JOIN chats c ON c.id = m.chat_id
        WHERE m.id = message_reactions.message_id AND auth.uid() = ANY(c.participant_ids)
    )
);
CREATE POLICY "Users can remove their own reactions" ON message_reactions FOR DELETE USING (auth.uid() = user_id);

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);

-- ============================================
-- STORED PROCEDURES
-- ============================================

CREATE OR REPLACE FUNCTION get_or_create_direct_chat(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
    chat_id UUID;
    caller_id UUID := auth.uid();
BEGIN
    -- Security Check: Ensure caller is one of the participants
    IF caller_id IS NULL OR (caller_id <> user1_id AND caller_id <> user2_id) THEN
        RAISE EXCEPTION 'Unauthorized: You must be one of the participants.';
    END IF;

    -- Look for an existing direct chat between these two users
    SELECT id INTO chat_id
    FROM chats
    WHERE participant_ids @> ARRAY[user1_id, user2_id]
    AND array_length(participant_ids, 1) = 2
    LIMIT 1;

    IF chat_id IS NULL THEN
        -- Create new chat
        INSERT INTO chats (participant_ids)
        VALUES (ARRAY[user1_id, user2_id])
        RETURNING id INTO chat_id;

        -- Add participants to the join table for compatibility
        INSERT INTO chat_participants (chat_id, user_id)
        VALUES (chat_id, user1_id), (chat_id, user2_id);
    END IF;

    RETURN chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
