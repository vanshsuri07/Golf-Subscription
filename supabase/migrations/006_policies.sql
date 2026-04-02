-- Public Read Policies
CREATE POLICY "Charities are viewable by everyone." ON public.charities FOR SELECT USING (true);
CREATE POLICY "Draws are viewable by everyone." ON public.draws FOR SELECT USING (true);
CREATE POLICY "Prize pools are viewable by everyone." ON public.prize_pools FOR SELECT USING (true);
CREATE POLICY "Winners are viewable by everyone." ON public.winners FOR SELECT USING (true);
CREATE POLICY "Charity contributions are viewable by everyone." ON public.charity_contributions FOR SELECT USING (true);

-- User Policies
CREATE POLICY "Users can view their own profile." ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their own subscriptions." ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subscriptions." ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscriptions." ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own draw entries." ON public.draw_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own draw entries." ON public.draw_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own draw entries." ON public.draw_entries FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own scores." ON public.scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own scores." ON public.scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own scores." ON public.scores FOR UPDATE USING (auth.uid() = user_id);

-- Admin Overrides (Bypass restrictions if role in JWT is 'admin')
CREATE POLICY "Admins can do everything on charities." ON public.charities FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');
CREATE POLICY "Admins can do everything on draws." ON public.draws FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');
CREATE POLICY "Admins can do everything on prize_pools." ON public.prize_pools FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');
CREATE POLICY "Admins can do everything on winners." ON public.winners FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');
CREATE POLICY "Admins can do everything on charity_contributions." ON public.charity_contributions FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Admins can view all users." ON public.users FOR SELECT USING ((auth.jwt() ->> 'role') = 'admin');
CREATE POLICY "Admins can update all users." ON public.users FOR UPDATE USING ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Admins can view all subscriptions." ON public.subscriptions FOR SELECT USING ((auth.jwt() ->> 'role') = 'admin');
CREATE POLICY "Admins can view all draw_entries." ON public.draw_entries FOR SELECT USING ((auth.jwt() ->> 'role') = 'admin');
CREATE POLICY "Admins can view all scores." ON public.scores FOR SELECT USING ((auth.jwt() ->> 'role') = 'admin');
