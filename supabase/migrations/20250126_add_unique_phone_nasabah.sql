-- Add unique constraint to phone number in nasabah table
-- This ensures that no two nasabahs can share the same phone number
ALTER TABLE nasabah
ADD CONSTRAINT nasabah_phone_key UNIQUE (phone);
