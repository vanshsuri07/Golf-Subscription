CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_charity_id ON public.subscriptions(charity_id);
CREATE INDEX idx_draw_entries_user_id ON public.draw_entries(user_id);
CREATE INDEX idx_draw_entries_draw_id ON public.draw_entries(draw_id);
CREATE INDEX idx_draw_entries_subscription_id ON public.draw_entries(subscription_id);
CREATE INDEX idx_prize_pools_draw_id ON public.prize_pools(draw_id);
CREATE INDEX idx_winners_draw_id ON public.winners(draw_id);
CREATE INDEX idx_winners_user_id ON public.winners(user_id);
CREATE INDEX idx_winners_draw_entry_id ON public.winners(draw_entry_id);
CREATE INDEX idx_scores_user_id ON public.scores(user_id);
CREATE INDEX idx_charity_contributions_charity_id ON public.charity_contributions(charity_id);
CREATE INDEX idx_charity_contributions_draw_id ON public.charity_contributions(draw_id);

CREATE INDEX idx_draw_entries_user_draw ON public.draw_entries(user_id, draw_id);

CREATE INDEX idx_draws_status ON public.draws(status);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
