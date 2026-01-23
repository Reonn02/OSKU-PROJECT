-- Change recipient_id to TEXT to support non-UUID legacy IDs
ALTER TABLE public.notifications ALTER COLUMN recipient_id TYPE TEXT;

-- Drop old strict UUID policies
DROP POLICY IF EXISTS "Nasabah can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Nasabah can update own notifications" ON public.notifications;

-- Recreate policies with casting
CREATE POLICY "Nasabah can view own notifications" 
ON public.notifications FOR SELECT 
USING (
    (auth.uid()::text = recipient_id AND recipient_role = 'nasabah')
);

CREATE POLICY "Nasabah can update own notifications" 
ON public.notifications FOR UPDATE 
USING (
    (auth.uid()::text = recipient_id AND recipient_role = 'nasabah')
);
