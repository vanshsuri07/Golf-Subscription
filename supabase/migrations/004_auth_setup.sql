-- Migration: 004_auth_setup

-- 1. Create Role Enum
CREATE TYPE user_role_enum AS ENUM ('subscriber', 'admin');

-- 2. Modify public.users Table
-- Detach id from auth.users (Drop foreign key constraint)
ALTER TABLE public.users DROP CONSTRAINT users_id_fkey;

-- Change id to generate automatically
ALTER TABLE public.users ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Add new columns for credentials auth
ALTER TABLE public.users ADD COLUMN email TEXT;
ALTER TABLE public.users ADD COLUMN password TEXT;

-- We update the existing role column to use the new ENUM
-- We alter the column type using a USING clause
ALTER TABLE public.users 
  ALTER COLUMN role DROP DEFAULT,
  ALTER COLUMN role TYPE user_role_enum USING role::user_role_enum,
  ALTER COLUMN role SET DEFAULT 'subscriber';

-- Enforce email to be unique and not null
ALTER TABLE public.users ADD CONSTRAINT users_email_unique UNIQUE (email);
-- Only add NOT NULL if the table doesn't have existing rows without emails or update them securely.
-- Assuming empty or we handle it. (If existing users lack email, this might fail, but for a fresh platform: )
ALTER TABLE public.users ALTER COLUMN email SET NOT NULL;

-- 3. NextAuth Companion Tables (Required by @auth/pg-adapter)

CREATE TABLE public.accounts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  provider text NOT NULL,
  provider_account_id text NOT NULL,
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT accounts_pkey PRIMARY KEY (id),
  CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE
);

CREATE TABLE public.sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  session_token text NOT NULL,
  user_id uuid NOT NULL,
  expires timestamp with time zone NOT NULL,
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE
);

CREATE TABLE public.verification_token (
  identifier text NOT NULL,
  token text NOT NULL,
  expires timestamp with time zone NOT NULL,
  CONSTRAINT verification_token_pkey PRIMARY KEY (identifier, token)
);
