-- Updated_at trigger setup
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_charities_modtime BEFORE UPDATE ON public.charities FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_subscriptions_modtime BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_draws_modtime BEFORE UPDATE ON public.draws FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_draw_entries_modtime BEFORE UPDATE ON public.draw_entries FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_prize_pools_modtime BEFORE UPDATE ON public.prize_pools FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_winners_modtime BEFORE UPDATE ON public.winners FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_scores_modtime BEFORE UPDATE ON public.scores FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_charity_contributions_modtime BEFORE UPDATE ON public.charity_contributions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Auth user created trigger
CREATE OR REPLACE FUNCTION on_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'subscriber')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE on_auth_user_created();

-- Lock draw entries on open | completed
CREATE OR REPLACE FUNCTION lock_draw_entries()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT status FROM draws WHERE id = COALESCE(NEW.draw_id, OLD.draw_id)) 
     IN ('open', 'completed') THEN
    RAISE EXCEPTION 'Cannot modify entries for an open or completed draw';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lock_draw_entries_trigger
BEFORE INSERT OR UPDATE ON public.draw_entries
FOR EACH ROW EXECUTE PROCEDURE lock_draw_entries();

-- Rolling scores trigger
CREATE OR REPLACE FUNCTION enforce_rolling_scores()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM scores
  WHERE user_id = NEW.user_id
  AND id NOT IN (
    SELECT id FROM scores
    WHERE user_id = NEW.user_id
    ORDER BY played_at DESC
    LIMIT 5
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_rolling_scores_trigger
AFTER INSERT ON public.scores
FOR EACH ROW EXECUTE PROCEDURE enforce_rolling_scores();

-- Calculate Winners trigger
CREATE OR REPLACE FUNCTION calculate_winners()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- match draw_entries.numbers against NEW.winning_numbers
    -- insert into winners table
    -- calculate prize splits
    -- insert into charity_contributions
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_winners_trigger
AFTER UPDATE ON public.draws
FOR EACH ROW EXECUTE PROCEDURE calculate_winners();
