-- 014_sync_orphaned_users.sql
-- Force-sync any auth.users that don't have matching public.users rows

-- First, temporarily allow NULL email on public.users so we can insert even edge cases
-- Then sync, then re-enforce

INSERT INTO public.users (id, email, full_name, role)
SELECT 
  au.id,
  COALESCE(au.email, 'unknown@placeholder.com'),
  COALESCE(au.raw_user_meta_data->>'full_name', ''),
  'subscriber'::user_role_enum
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Also handle email conflicts (same email, different id)
-- Update public.users email to match auth.users email
UPDATE public.users pu
SET email = au.email
FROM auth.users au
WHERE pu.id = au.id AND pu.email IS DISTINCT FROM au.email;
