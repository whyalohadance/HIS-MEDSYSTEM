-- ============================================
-- HIS-MedSystem — Database Initialization
-- Runs once on first container start
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Timezone
SET timezone = 'Europe/Chisinau';

-- Confirmation message
SELECT 'HIS-MedSystem DB initialized at ' || NOW() AS init_message;
