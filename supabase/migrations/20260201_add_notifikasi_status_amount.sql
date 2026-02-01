-- Add status and amount columns to notifikasi table
ALTER TABLE notifikasi 
ADD COLUMN IF NOT EXISTS status TEXT,
ADD COLUMN IF NOT EXISTS amount TEXT;

-- Enable RLS (just in case)
ALTER TABLE notifikasi ENABLE ROW LEVEL SECURITY;

-- Ensure Authenticated users (including Petugas) can insert notifications
-- This is required for Petugas to send notifications to Nasabah
DROP POLICY IF EXISTS "Allow authenticated insert notifications" ON notifikasi;

CREATE POLICY "Allow authenticated insert notifications" 
ON notifikasi FOR INSERT 
WITH CHECK (
    auth.role() = 'authenticated'
);
