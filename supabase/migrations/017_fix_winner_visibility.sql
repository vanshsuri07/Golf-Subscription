-- 017_fix_winner_visibility.sql
-- Fixes RLS policies for winners and entries to ensure visibility for admins and users.

-- 1. Ensure Admins can see all draw winners
DROP POLICY IF EXISTS "Admins can view all winners" ON public.draw_winners;
CREATE POLICY "Admins can view all winners"
ON public.draw_winners
FOR ALL
USING ((auth.jwt() ->> 'role') = 'admin');

-- 2. Ensure users can see all winners (public results are usually fine, but if preferred, restrict)
-- We'll keep it permissive for SELECT since results are public anyways.
DROP POLICY IF EXISTS "Winners are viewable by everyone" ON public.draw_winners;
CREATE POLICY "Winners are viewable by everyone" 
ON public.draw_winners 
FOR SELECT 
USING (true);

-- 3. Ensure admins can see all draw entries
DROP POLICY IF EXISTS "Admins can view all entries" ON public.draw_entries;
CREATE POLICY "Admins can view all entries"
ON public.draw_entries
FOR ALL
USING ((auth.jwt() ->> 'role') = 'admin');

-- 4. Ensure everyone can see prize pools (needed for joins in dashboard)
DROP POLICY IF EXISTS "Prize pools are viewable by everyone" ON public.prize_pools;
CREATE POLICY "Prize pools are viewable by everyone"
ON public.prize_pools
FOR SELECT
USING (true);

-- 5. Ensure admins can manage prize pools
DROP POLICY IF EXISTS "Admins can manage prize pools" ON public.prize_pools;
CREATE POLICY "Admins can manage prize pools"
ON public.prize_pools
FOR ALL
USING ((auth.jwt() ->> 'role') = 'admin');
