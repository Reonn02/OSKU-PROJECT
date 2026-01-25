-- Add bank_sampah_id column as Foreign Key
ALTER TABLE nasabah 
ADD COLUMN IF NOT EXISTS bank_sampah_id TEXT REFERENCES bank_sampah(id) ON DELETE SET NULL;

-- Update bank_sampah_id based on exact name match
UPDATE nasabah n
SET bank_sampah_id = b.id
FROM bank_sampah b
WHERE n.bank_sampah = b.nama;

-- Update bank_sampah_id based on case-insensitive match for remaining nulls
UPDATE nasabah n
SET bank_sampah_id = b.id
FROM bank_sampah b
WHERE n.bank_sampah_id IS NULL 
AND n.bank_sampah ILIKE b.nama;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_nasabah_bank_sampah_id ON nasabah(bank_sampah_id);

-- DROP the legacy bank_sampah text column
ALTER TABLE nasabah DROP COLUMN IF EXISTS bank_sampah;
