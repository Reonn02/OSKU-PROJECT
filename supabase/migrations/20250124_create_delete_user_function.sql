-- Function to delete a user regarding of table
-- This effectively deletes the user from auth.users, which triggers a cascade delete 
-- on public.nasabah (due to the foreign key constraint we added).

CREATE OR REPLACE FUNCTION delete_nasabah_completely(target_nasabah_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres/service_role)
AS $$
DECLARE
    target_auth_id UUID;
BEGIN
    -- 1. Find the auth_user_id associated with this nasabah
    SELECT auth_user_id INTO target_auth_id
    FROM public.nasabah
    WHERE id = target_nasabah_id;

    -- 2. If it is linked to an auth user, delete the auth user
    --    (This triggers ON DELETE CASCADE which deletes the nasabah record automatically)
    IF target_auth_id IS NOT NULL THEN
        DELETE FROM auth.users WHERE id = target_auth_id;
        RETURN TRUE;
    ELSE
        -- 3. If no auth user (legacy record?), just delete the nasabah record manually
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
