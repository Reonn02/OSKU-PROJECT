-- FORCE CLEANUP AND FIX SCRIPT
-- Run this in Supabase SQL Editor

-- 1. CLEANUP SPECIFIC STUCK USER (nasabah@test.com)
-- We remove child records first to avoid FK violations
DELETE FROM public.penyetoran WHERE nasabah_id IN (SELECT id FROM public.nasabah WHERE email = 'nasabah@test.com');
DELETE FROM public.pencairan WHERE nasabah_id IN (SELECT id FROM public.nasabah WHERE email = 'nasabah@test.com');
DELETE FROM public.nasabah WHERE email = 'nasabah@test.com';
DELETE FROM auth.users WHERE email = 'nasabah@test.com';

-- 2. RESET CONSTRAINTS WITH CASCADE (SAFE VERSION)
-- Ensure we don't have duplicate or broken constraints

-- Fix Nasabah -> Auth
ALTER TABLE public.nasabah DROP CONSTRAINT IF EXISTS nasabah_auth_user_id_fkey;
ALTER TABLE public.nasabah ADD CONSTRAINT nasabah_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix Penyetoran -> Nasabah
ALTER TABLE public.penyetoran DROP CONSTRAINT IF EXISTS penyetoran_nasabah_id_fkey;
ALTER TABLE public.penyetoran ADD CONSTRAINT penyetoran_nasabah_id_fkey FOREIGN KEY (nasabah_id) REFERENCES public.nasabah(id) ON DELETE CASCADE;

-- Fix Pencairan -> Nasabah
ALTER TABLE public.pencairan DROP CONSTRAINT IF EXISTS pencairan_nasabah_id_fkey;
ALTER TABLE public.pencairan ADD CONSTRAINT pencairan_nasabah_id_fkey FOREIGN KEY (nasabah_id) REFERENCES public.nasabah(id) ON DELETE CASCADE;

-- 3. ENSURE RPC FUNCTION EXISTS
CREATE OR REPLACE FUNCTION delete_nasabah_completely(target_nasabah_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_auth_id UUID;
BEGIN
    SELECT auth_user_id INTO target_auth_id FROM public.nasabah WHERE id = target_nasabah_id;
    IF target_auth_id IS NOT NULL THEN
        DELETE FROM auth.users WHERE id = target_auth_id;
        RETURN TRUE;
    ELSE
        DELETE FROM public.nasabah WHERE id = target_nasabah_id;
        RETURN TRUE;
    END IF;
    RETURN FALSE;
EXCEPTION WHEN OTHERS THEN RETURN FALSE;
END;
$$;
