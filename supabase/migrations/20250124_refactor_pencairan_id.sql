-- Migration to refactor pencairan ID
-- Goal: Use 'id' column as the text-based PK (ex-id_pengajuan) and drop id_pengajuan

-- 1. Disable RLS temporarily
ALTER TABLE pencairan DISABLE ROW LEVEL SECURITY;

-- 2. Update 'id' column with values from 'id_pengajuan'
--    Generate new ID if null (fallback logic)
UPDATE pencairan 
SET id = COALESCE(id_pengajuan, 'O' || lpad(cast(floor(random() * 10000000)::int as text), 7, '0'));

-- 3. Drop the id_pengajuan column
DROP INDEX IF EXISTS idx_pencairan_id_pengajuan;
ALTER TABLE pencairan DROP COLUMN IF EXISTS id_pengajuan;

-- 4. Remove the default uuid_generate_v4() from id
ALTER TABLE pencairan ALTER COLUMN id DROP DEFAULT;

-- 5. Re-enable RLS
ALTER TABLE pencairan ENABLE ROW LEVEL SECURITY;
