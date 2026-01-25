-- Migration to refactor penyetoran ID
-- Goal: Use 'id' column as the text-based PK (ex-id_penyetoran) and drop id_penyetoran

-- 1. Disable RLS temporarily to avoid policy conflicts during update (optional, but safer)
ALTER TABLE penyetoran DISABLE ROW LEVEL SECURITY;

-- 2. Drop existing foreign key references to penyetoran(id) if any exist
-- (Checking schema, there are no references to penyetoran(id) yet from other tables based on my previous read)

-- 3. Update 'id' column with values from 'id_penyetoran'
--    If id_penyetoran is null (shouldn't be, but just in case), generate a new one
UPDATE penyetoran 
SET id = COALESCE(id_penyetoran, lpad(cast(floor(random() * 100000000)::int as text), 8, '0'));

-- 4. Drop the id_penyetoran column
--    First drop index if exists
DROP INDEX IF EXISTS idx_penyetoran_id_penyetoran;
ALTER TABLE penyetoran DROP COLUMN IF EXISTS id_penyetoran;

-- 5. Remove the default uuid_generate_v4() from id if it exists
ALTER TABLE penyetoran ALTER COLUMN id DROP DEFAULT;

-- 6. Re-enable RLS
ALTER TABLE penyetoran ENABLE ROW LEVEL SECURITY;
