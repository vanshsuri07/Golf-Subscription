-- Seed file for GolfSub platform
-- Compatible with current schema (post-migration 010)

-- 1. Seed charities (uses is_active column from migration 006)
INSERT INTO public.charities (id, name, description, is_active) VALUES
('10000000-0000-0000-0000-000000000001', 'Red Cross', 'Providing medical relief and disaster response worldwide.', true),
('10000000-0000-0000-0000-000000000002', 'WWF', 'Protecting the world''s wildlife and natural habitats.', true),
('10000000-0000-0000-0000-000000000003', 'UNICEF', 'Supporting children''s rights and well-being globally.', true),
('10000000-0000-0000-0000-000000000004', 'Doctors Without Borders', 'Delivering medical care where it''s needed most.', true),
('10000000-0000-0000-0000-000000000005', 'Oxfam', 'Fighting poverty and inequality around the world.', true)
ON CONFLICT (id) DO NOTHING;

-- Note: Users should be created through Supabase Auth signup flow.
-- The on_auth_user_created trigger will automatically create public.users rows.
-- Do NOT insert directly into auth.users or public.users for production.

-- If you need a test admin user, use the Supabase dashboard to:
-- 1. Create a user via Authentication > Users > Add User
-- 2. Then run: UPDATE public.users SET role = 'admin' WHERE email = 'your-admin@email.com';
