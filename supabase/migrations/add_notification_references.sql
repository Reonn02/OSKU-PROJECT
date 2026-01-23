-- Add reference_id and reference_type columns to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS reference_id TEXT,
ADD COLUMN IF NOT EXISTS reference_type TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notifications_reference 
ON notifications(reference_id, reference_type);
