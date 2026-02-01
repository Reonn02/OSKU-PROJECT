-- Add operating hours columns to admins table
-- Run this in Supabase SQL Editor

ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS operating_days TEXT DEFAULT 'Senin s.d Jumat',
ADD COLUMN IF NOT EXISTS operating_hours TEXT DEFAULT '08.00 - 16:30';
