-- ============================================
-- CONNECTION REQUESTS SYSTEM (2026 UPDATE)
-- ============================================

CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'rejected');

CREATE TABLE IF NOT EXISTS connection_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    initial_message_encrypted TEXT, -- Opcional: primer mensaje cifrado
    status connection_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Unicidad: No permitir múltiples solicitudes pendientes entre los mismos dos usuarios
    UNIQUE(sender_id, receiver_id)
);

-- Habilitar RLS
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS RLS
CREATE POLICY "Users can view their own sent/received requests" ON connection_requests
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send requests" ON connection_requests
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receivers can update request status" ON connection_requests
    FOR UPDATE USING (auth.uid() = receiver_id)
    WITH CHECK (auth.uid() = receiver_id);

-- TRIGGER PARA ACTUALIZACIÓN DE TIMESTAMP
CREATE TRIGGER update_connection_requests_updated_at
    BEFORE UPDATE ON connection_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- AUTOMATIC CHAT CREATION ON ACCEPTANCE
CREATE OR REPLACE FUNCTION handle_accepted_connection()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        -- Crear el chat 1-on-1 automáticamente
        INSERT INTO chats (participant_ids, created_at, updated_at)
        VALUES (
            ARRAY[NEW.sender_id, NEW.receiver_id],
            now(),
            now()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plv68; -- Usando V8 (JS) si está disponible, o PLPGSQL

-- Si no hay v68, fallback a PLPGSQL
CREATE OR REPLACE FUNCTION handle_accepted_connection()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        INSERT INTO chats (participant_ids, created_at, updated_at)
        VALUES (
            ARRAY[NEW.sender_id, NEW.receiver_id],
            now(),
            now()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_connection_accepted
    AFTER UPDATE ON connection_requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_accepted_connection();

-- EPHEMERAL MESSAGES SUPPORT
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_ephemeral BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- INDEX FOR EPHEMERAL CLEANUP
CREATE INDEX IF NOT EXISTS idx_messages_expires_at ON messages(expires_at) WHERE is_ephemeral = true;

-- VIEW ONCE MESSAGES SUPPORT
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_view_once BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMP WITH TIME ZONE;
