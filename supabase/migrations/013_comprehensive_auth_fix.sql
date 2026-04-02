-- 013_comprehensive_auth_fix.sql
-- One-shot fix for all auth/signup issues.

-- 1. Drop and recreate the trigger + function to guarantee clean state
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION on_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'subscriber')::user_role_enum
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log but don't crash signup
  RAISE WARNING 'on_auth_user_created trigger error: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE on_auth_user_created();

-- 2. Sync any orphaned auth.users that exist without a matching public.users row
INSERT INTO public.users (id, email, full_name, role)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', ''),
  COALESCE(au.raw_user_meta_data->>'role', 'subscriber')::user_role_enum
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 3. Also fix email conflicts: if auth.users has an email that exists
-- in public.users under a DIFFERENT id, update the public.users email
-- (edge case from manual inserts)
UPDATE public.users pu
SET email = au.email
FROM auth.users au
WHERE pu.id = au.id
AND pu.email != au.email;
