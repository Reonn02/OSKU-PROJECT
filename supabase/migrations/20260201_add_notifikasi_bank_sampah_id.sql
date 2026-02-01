-- Add bank_sampah_id column to notifikasi table
-- This allows filtering notifications by bank_sampah for petugas

ALTER TABLE notifikasi 
ADD COLUMN IF NOT EXISTS bank_sampah_id UUID REFERENCES bank_sampah(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_notifikasi_bank_sampah_id ON notifikasi(bank_sampah_id);
