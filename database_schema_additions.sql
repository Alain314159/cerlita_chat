-- 1. Crear columnas faltantes para E2E
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS auth_tag TEXT,
ADD COLUMN IF NOT EXISTS key_version TEXT DEFAULT 'v1',
ADD COLUMN IF NOT EXISTS encrypted_payload JSONB;

ALTER TABLE connection_requests
ADD COLUMN IF NOT EXISTS initial_message_iv TEXT,
ADD COLUMN IF NOT EXISTS initial_message_auth_tag TEXT;

-- 2. Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_messages_chat_created 
ON messages (chat_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_connection_requests_user_status 
ON connection_requests (receiver_id, status) 
WHERE status = 'pending';

-- 3. Trigger de creación de chat con verificación de duplicados
CREATE OR REPLACE FUNCTION handle_accepted_connection()
RETURNS TRIGGER AS $$
DECLARE
  existing_chat_id UUID;
  participant_array UUID[];
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Ordenar IDs para consistencia en la búsqueda
    participant_array := ARRAY[NEW.sender_id, NEW.receiver_id];
    
    -- Verificar si ya existe un chat directo para esta pareja
    SELECT id INTO existing_chat_id 
    FROM chats 
    WHERE type = 'direct'
      AND participant_ids @> participant_array
      AND array_length(participant_ids, 1) = 2
    LIMIT 1;
    
    IF existing_chat_id IS NULL THEN
      INSERT INTO chats (id, participant_ids, type, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        participant_array,
        'direct',
        now(),
        now()
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Políticas RLS (Zero-Trust)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;

-- Política para mensajes: solo participantes del chat pueden acceder
DROP POLICY IF EXISTS messages_user_access ON messages;
CREATE POLICY messages_user_access ON messages
FOR ALL
USING (
  auth.uid() = sender_id OR 
  EXISTS (
    SELECT 1 FROM chats 
    WHERE chats.id = messages.chat_id 
    AND auth.uid() = ANY(chats.participant_ids)
  )
);

-- Política para chats: solo participantes pueden ver el chat
DROP POLICY IF EXISTS chats_user_access ON chats;
CREATE POLICY chats_user_access ON chats
FOR SELECT
USING (auth.uid() = ANY(participant_ids));

-- Política para connection_requests: solo involucrados pueden acceder
DROP POLICY IF EXISTS connection_requests_user_access ON connection_requests;
CREATE POLICY connection_requests_user_access ON connection_requests
FOR ALL
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 5. Trigger de view-once mejorado (solo para mensajes NO E2E)
CREATE OR REPLACE FUNCTION trigger_burn_view_once()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo aplicar si el mensaje NO está cifrado E2E (para evitar falsa sensación de seguridad)
  IF NEW.is_view_once = true 
     AND NEW.viewed_at IS NOT NULL 
     AND OLD.viewed_at IS NULL
     AND (NEW.encrypted_payload IS NULL OR NEW.encrypted_payload = '{}'::jsonb) THEN
    -- Nullificar todos los campos sensibles
    NEW.content := NULL;
    NEW.media_url := NULL;
    NEW.thumbnail_url := NULL;
    NEW.iv := NULL;
    NEW.auth_tag := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_burn_view_once_messages ON messages;
CREATE TRIGGER trigger_burn_view_once_messages
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION trigger_burn_view_once();
