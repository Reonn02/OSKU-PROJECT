-- FIX NASABAH DELETION LOGIC (V2)
-- Run this script in the Supabase SQL Editor to resolve the "Nasabah deletion failed" issue.

-- 1. Ensure the Delete Function is Robust and Handles UUIDs
-- We verify the input and handle both linked Auth users and orphan records.
CREATE OR REPLACE FUNCTION delete_nasabah_completely(target_nasabah_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_uuid UUID;
    target_auth_id UUID;
BEGIN
    -- Cast input to UUID safely to avoid casting errors
    BEGIN
        target_uuid := target_nasabah_id::UUID;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Invalid UUID provided: %', target_nasabah_id;
        RETURN FALSE;
    END;

    -- 1. Find the auth_user_id associated with this nasabah
    SELECT auth_user_id INTO target_auth_id
    FROM public.nasabah
    WHERE id = target_uuid;

    -- 2. If linked to an auth user, delete the auth user
    --    This relies on the CASCADE constraints (defined below) to remove the nasabah record
    IF target_auth_id IS NOT NULL THEN
        -- Delete from auth.users. This should CASCADE to public.nasabah
        DELETE FROM auth.users WHERE id = target_auth_id;
        
        -- Double check if nasabah is gone (safety check)
        IF EXISTS (SELECT 1 FROM public.nasabah WHERE id = target_uuid) THEN
            -- If it persists (e.g. if cascade failed or wasn't triggered), force delete
            DELETE FROM public.nasabah WHERE id = target_uuid;
        END IF;
        
        RETURN TRUE;
    ELSE
        -- 3. If no auth user (orphan), delete the nasabah record directly
        DELETE FROM public.nasabah WHERE id = target_uuid;
        RETURN TRUE;
    END IF;

    RETURN FALSE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in delete_nasabah_completely: %', SQLERRM;
        RETURN FALSE;
END;
$$;


-- 2. REINFORCE FOREIGN KEY CONSTRAINTS (CASCADE)
-- Essential to prevent "foreign key violation" errors when deleting a user.

-- A) Fix Nasabah -> Auth Users
-- If Auth User is deleted, Nasabah profile must be deleted.
ALTER TABLE public.nasabah DROP CONSTRAINT IF EXISTS nasabah_auth_user_id_fkey;
ALTER TABLE public.nasabah
    ADD CONSTRAINT nasabah_auth_user_id_fkey
    FOREIGN KEY (auth_user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- B) Fix Penyetoran -> Nasabah
-- If Nasabah is deleted, their deposit history must be deleted.
ALTER TABLE public.penyetoran DROP CONSTRAINT IF EXISTS penyetoran_nasabah_id_fkey;
ALTER TABLE public.penyetoran
    ADD CONSTRAINT penyetoran_nasabah_id_fkey
    FOREIGN KEY (nasabah_id)
    REFERENCES public.nasabah(id)
    ON DELETE CASCADE;

-- C) Fix Pencairan -> Nasabah
-- If Nasabah is deleted, their withdrawal history must be deleted.
ALTER TABLE public.pencairan DROP CONSTRAINT IF EXISTS pencairan_nasabah_id_fkey;
ALTER TABLE public.pencairan
    ADD CONSTRAINT pencairan_nasabah_id_fkey
    FOREIGN KEY (nasabah_id)
    REFERENCES public.nasabah(id)
    ON DELETE CASCADE;

-- D) Notifications Cleanup (Optional but Recommended)
-- If you have a Foreign Key on notifications (which you might not, but if you do, it needs Cascade)
-- We check if the constraint exists before trying to drop/add, or just force drop common names.
DO $$
BEGIN
    -- Try to drop potential blocking constraint if user added it manually
    BEGIN
        ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_recipient_id_fkey;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    
    -- Note: We generally don't enforce FK on recipient_id because it can be multiple roles.
    -- But if deletion is blocked by notifications, you would need to delete them manually in the function above.
END $$;

-- 3. Clean up potentially blocking Notification records manually in the function?
-- Let's update the function one more time to be SUPER safe against notifications.

CREATE OR REPLACE FUNCTION delete_nasabah_completely(target_nasabah_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_uuid UUID;
    target_auth_id UUID;
BEGIN
    BEGIN
        target_uuid := target_nasabah_id::UUID;
    EXCEPTION WHEN OTHERS THEN
        RETURN FALSE;
    END;

    -- Pre-cleanup: Delete notifications explicitly to avoid any doubt
    DELETE FROM public.notifications WHERE recipient_id = target_uuid;

    SELECT auth_user_id INTO target_auth_id
    FROM public.nasabah
    WHERE id = target_uuid;

    IF target_auth_id IS NOT NULL THEN
        DELETE FROM auth.users WHERE id = target_auth_id;
        -- Fallback if cascade didn't happen for some reason
        DELETE FROM public.nasabah WHERE id = target_uuid; 
        RETURN TRUE;
    ELSE
        DELETE FROM public.nasabah WHERE id = target_uuid;
        RETURN TRUE;
    END IF;

    RETURN FALSE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting user: %', SQLERRM;
        RETURN FALSE;
END;
$$;
