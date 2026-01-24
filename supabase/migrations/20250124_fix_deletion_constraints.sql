-- Fix User Deletion Issues
-- problem: Deleting a user in Auth fails because the 'nasabah' table references it without ON DELETE CASCADE (or strict restriction).
-- solution: Re-create the foreign key with ON DELETE CASCADE.

-- 1. Drop existing constraint (try common names)
ALTER TABLE nasabah
DROP CONSTRAINT IF EXISTS nasabah_auth_user_id_fkey;

-- 2. Add the correct constraint
ALTER TABLE nasabah
ADD CONSTRAINT nasabah_auth_user_id_fkey
FOREIGN KEY (auth_user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Also ensure dependent tables cascade their deletions from nasabah
ALTER TABLE penyetoran
DROP CONSTRAINT IF EXISTS penyetoran_nasabah_id_fkey;

ALTER TABLE penyetoran
ADD CONSTRAINT penyetoran_nasabah_id_fkey
FOREIGN KEY (nasabah_id)
REFERENCES nasabah(id)
ON DELETE CASCADE;

ALTER TABLE pencairan
DROP CONSTRAINT IF EXISTS pencairan_nasabah_id_fkey;

ALTER TABLE pencairan
ADD CONSTRAINT pencairan_nasabah_id_fkey
FOREIGN KEY (nasabah_id)
REFERENCES nasabah(id)
ON DELETE CASCADE;
