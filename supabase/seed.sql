INSERT INTO public.charities (id, name, description) VALUES 
('10000000-0000-0000-0000-000000000001', 'Red Cross', 'Medical relief'),
('10000000-0000-0000-0000-000000000002', 'WWF', 'Nature conservation'),
('10000000-0000-0000-0000-000000000003', 'UNICEF', 'Childrens fund'),
('10000000-0000-0000-0000-000000000004', 'Doctors Without Borders', 'Medical care'),
('10000000-0000-0000-0000-000000000005', 'Oxfam', 'Poverty relief'),
('10000000-0000-0000-0000-000000000006', 'Save the Children', 'Child support'),
('10000000-0000-0000-0000-000000000007', 'Amnesty International', 'Human rights'),
('10000000-0000-0000-0000-000000000008', 'Greenpeace', 'Environmental protection'),
('10000000-0000-0000-0000-000000000009', 'Habitat for Humanity', 'Housing'),
('10000000-0000-0000-0000-000000000010', 'Water.org', 'Safe water initiatives');

-- Create mock users in auth.users (this dynamically populates public.users via the trigger)
INSERT INTO auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES
('20000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'user1@example.com', 'hashed', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Jane Doe", "role":"subscriber"}', now(), now()),
('20000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'user2@example.com', 'hashed', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"John Smith", "role":"admin"}', now(), now());

-- Subscriptions
INSERT INTO public.subscriptions (id, user_id, status, charity_id, charity_pct) VALUES
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'active', '10000000-0000-0000-0000-000000000001', 50),
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'active', '10000000-0000-0000-0000-000000000002', 100);

-- Draws (Initialize as pending to allow draw entries insertion)
INSERT INTO public.draws (id, status, draw_date, winning_numbers) VALUES
('40000000-0000-0000-0000-000000000001', 'pending', '2026-03-01 10:00:00+00', ARRAY[1, 2, 3, 4, 5]),
('40000000-0000-0000-0000-000000000002', 'pending', '2026-04-15 10:00:00+00', NULL),
('40000000-0000-0000-0000-000000000003', 'pending', '2026-05-15 10:00:00+00', NULL);

-- Prize Pools
INSERT INTO public.prize_pools (id, draw_id, match_count, prize_amount) VALUES
(uuid_generate_v4(), '40000000-0000-0000-0000-000000000001', 3, 50.00),
(uuid_generate_v4(), '40000000-0000-0000-0000-000000000001', 4, 500.00),
(uuid_generate_v4(), '40000000-0000-0000-0000-000000000001', 5, 10000.00),
(uuid_generate_v4(), '40000000-0000-0000-0000-000000000002', 3, 50.00),
(uuid_generate_v4(), '40000000-0000-0000-0000-000000000002', 4, 500.00),
(uuid_generate_v4(), '40000000-0000-0000-0000-000000000002', 5, 10000.00);

-- Draw Entries (Safe to insert while draws are 'pending')
INSERT INTO public.draw_entries (id, draw_id, user_id, subscription_id, numbers) VALUES
('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', ARRAY[1, 2, 3, 8, 9]),
('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', ARRAY[7, 12, 13, 14, 15]),
('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', ARRAY[4, 5, 6, 10, 11]);

-- Set status to open/completed (triggers calculate_winners logic appropriately)
UPDATE public.draws SET status = 'completed' WHERE id = '40000000-0000-0000-0000-000000000001';
UPDATE public.draws SET status = 'open' WHERE id = '40000000-0000-0000-0000-000000000002';

-- Winners
INSERT INTO public.winners (id, draw_id, user_id, draw_entry_id, match_count, prize_amount) VALUES
(uuid_generate_v4(), '40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 3, 50.00);

-- Charity Contributions
INSERT INTO public.charity_contributions (id, charity_id, draw_id, amount) VALUES
(uuid_generate_v4(), '10000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 250.00),
(uuid_generate_v4(), '10000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 500.00);

-- Scores (Tests the rolling 5-score trigger: 6 items inserted, oldest should be trimmed)
INSERT INTO public.scores (user_id, score, played_at) VALUES
('20000000-0000-0000-0000-000000000001', 85, now() - interval '6 days'),
('20000000-0000-0000-0000-000000000001', 82, now() - interval '5 days'),
('20000000-0000-0000-0000-000000000001', 90, now() - interval '4 days'),
('20000000-0000-0000-0000-000000000001', 88, now() - interval '3 days'),
('20000000-0000-0000-0000-000000000001', 79, now() - interval '2 days'),
('20000000-0000-0000-0000-000000000001', 81, now() - interval '1 days');
