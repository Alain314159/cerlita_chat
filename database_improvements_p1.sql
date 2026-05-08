-- ============================================
-- CERLITA CHAT - IMPROVEMENTS (Phase 1)
-- ============================================

-- 1. Add cerlita_id to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS cerlita_id TEXT UNIQUE;

-- 2. Function to generate a unique Cerlita ID (e.g., CER-X82F)
CREATE OR REPLACE FUNCTION generate_cerlita_id() 
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    done BOOLEAN DEFAULT FALSE;
BEGIN
    WHILE NOT done LOOP
        new_id := 'CER-' || upper(substring(md5(random()::text) from 1 for 4));
        -- Check for collision
        IF NOT EXISTS (SELECT 1 FROM users WHERE cerlita_id = new_id) THEN
            done := TRUE;
        END IF;
    END LOOP;
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger to auto-generate cerlita_id on insert
CREATE OR REPLACE FUNCTION set_cerlita_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.cerlita_id IS NULL THEN
        NEW.cerlita_id := generate_cerlita_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_cerlita_id
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION set_cerlita_id();

-- 4. Update existing users with a cerlita_id
UPDATE users SET cerlita_id = generate_cerlita_id() WHERE cerlita_id IS NULL;

-- 5. Add search index for cerlita_id
CREATE INDEX IF NOT EXISTS idx_users_cerlita_id ON users(cerlita_id);

-- 6. Add avatar fields to users table (missing in original schema but used in mapper)
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_type TEXT CHECK (avatar_type IN ('system', 'custom'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_uri TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_system_id INTEGER;
