
-- 1. Política de Seguridad para Mensajes
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only read messages from their chats" 
ON messages FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM chat_participants WHERE chat_id = messages.chat_id
  )
);

-- 2. Sugerencia de Particionamiento (Concepto)
-- Nota: El particionamiento real requiere recrear la tabla como 'PARTITION BY RANGE (created_at)'.
