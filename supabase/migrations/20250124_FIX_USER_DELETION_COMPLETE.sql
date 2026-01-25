-- COMBINED FIX FOR USER DELETION
-- Run this ENTIRE script in the Supabase SQL Editor.

-- PART 1: ADD "ON DELETE CASCADE" CONSTRAINTS
-- This allows deleting an Auth User to automatically delete their profile data without error.

-- 1.1 Fix Nasabah Table
ALTER TABLE public.nasabah
DROP CONSTRAINT IF EXISTS nasabah_auth_user_id_fkey;

ALTER TABLE public.nasabah
ADD CONSTRAINT nasabah_auth_user_id_fkey
FOREIGN KEY (auth_user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 1.2 Fix Penyetoran Table (Must delete penyetoran if nasabah is deleted)
ALTER TABLE public.penyetoran
DROP CONSTRAINT IF EXISTS penyetoran_nasabah_id_fkey;

ALTER TABLE public.penyetoran
ADD CONSTRAINT penyetoran_nasabah_id_fkey
FOREIGN KEY (nasabah_id)
REFERENCES public.nasabah(id)
ON DELETE CASCADE;

-- 1.3 Fix Pencairan Table (Must delete pencairan if nasabah is deleted)
ALTER TABLE public.pencairan
DROP CONSTRAINT IF EXISTS pencairan_nasabah_id_fkey;

ALTER TABLE public.pencairan
ADD CONSTRAINT pencairan_nasabah_id_fkey
FOREIGN KEY (nasabah_id)
REFERENCES public.nasabah(id)
ON DELETE CASCADE;


-- PART 2: CREATE THE DELETE FUNCTION (RPC)
-- This function deletes the Auth User (Parent), which triggers the CASCADE above to delete the Nasabah (Child).

CREATE OR REPLACE FUNCTION delete_nasabah_completely(target_nasabah_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_auth_id UUID;
BEGIN
    -- Find the auth_user_id associated with this nasabah
    SELECT auth_user_id INTO target_auth_id
    FROM public.nasabah
    WHERE id = target_nasabah_id;

    -- If linked to an auth user, delete the auth user (Cascades to nasabah table)
    IF target_auth_id IS NOT NULL THEN
        DELETE FROM auth.users WHERE id = target_auth_id;
        RETURN TRUE;
    ELSE
        -- If no auth user found (orphan), just delete the nasabah record
        DELETE FROM public.nasabah WHERE id = target_nasabah_id;
        RETURN TRUE;
    END IF;

    RETURN FALSE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting user: %', SQLERRM;
        RETURN FALSE;
END;
$$;
