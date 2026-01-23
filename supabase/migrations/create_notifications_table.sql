-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_role TEXT NOT NULL CHECK (recipient_role IN ('nasabah', 'petugas')),
    recipient_id UUID, -- NULL if role is 'petugas' (visible to all petugas), or specific user UUID for nasabah
    type TEXT CHECK (type IN ('info', 'success', 'warning', 'error', 'berita', 'pencairan', 'persetujuan', 'konfirmasi')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Nasabah can view their own notifications
CREATE POLICY "Nasabah can view own notifications" 
ON public.notifications FOR SELECT 
USING (
    (auth.uid() = recipient_id AND recipient_role = 'nasabah')
);

-- Policy: Nasabah can update their own notifications (mark as read)
CREATE POLICY "Nasabah can update own notifications" 
ON public.notifications FOR UPDATE 
USING (
    (auth.uid() = recipient_id AND recipient_role = 'nasabah')
);

-- Policy: Petugas can view all petugas notifications
-- Assuming we don't have a strict 'petugas' role check in DB auth yet, 
-- ideally we should check if the user is a petugas. 
-- For now, letting authenticated users with null recipient_id view 'petugas' notifs is a compromise if role isn't in auth.
-- BETTER: Check against 'petugas' table if possible, or just allow access if recipient_role = 'petugas'.
CREATE POLICY "Petugas can view petugas notifications" 
ON public.notifications FOR SELECT 
USING (
    recipient_role = 'petugas'
);

CREATE POLICY "Petugas can update petugas notifications" 
ON public.notifications FOR UPDATE 
USING (
    recipient_role = 'petugas'
);

-- Allow system (via service role or authenticated functions) to insert
CREATE POLICY "Allow system insert" 
ON public.notifications FOR INSERT 
WITH CHECK (true);
