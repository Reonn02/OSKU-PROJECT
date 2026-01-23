-- Migration: Update pencairan status constraint
-- Date: 2026-01-23
-- Description: Update status constraint to support new flow (completed, cancelled)

-- Drop old constraint
ALTER TABLE pencairan DROP CONSTRAINT IF EXISTS pencairan_status_check;

-- Add new constraint with updated statuses
ALTER TABLE pencairan ADD CONSTRAINT pencairan_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled'));
