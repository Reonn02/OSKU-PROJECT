-- Function to get admin by email securely (bypassing RLS)
-- This allows the login page to fetch admin details even if public SELECT is disabled on the table
CREATE OR REPLACE FUNCTION get_admin_by_email(p_email TEXT)
RETURNS SETOF admins
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY SELECT * FROM admins WHERE email = p_email;
END;
$$;
