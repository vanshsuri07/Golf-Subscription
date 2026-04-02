-- 012_fix_trigger_role_cast.sql
-- Fix: The on_auth_user_created trigger inserts 'subscriber' as TEXT
-- but the role column is user_role_enum. Must cast explicitly.

CREATE OR REPLACE FUNCTION on_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'subscriber')::user_role_enum
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
