-- 015_automate_draw_entries.sql
-- Automated entry logic for the golf draw system.

-- 1. Function to enter a specific user into a specific draw if eligible
CREATE OR REPLACE FUNCTION enter_user_into_draw(p_user_id uuid, p_draw_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert into draw_entries if:
  -- 1. User has an active subscription
  -- 2. User has 5 scores (exists in user_score_summary)
  -- 3. User not already in this draw
  INSERT INTO public.draw_entries (draw_id, user_id, weight)
  SELECT 
    p_draw_id, 
    p_user_id, 
    1 -- default weight
  FROM public.subscriptions s
  JOIN public.user_score_summary uss ON s.user_id = uss.user_id
  WHERE s.user_id = p_user_id 
    AND s.status = 'active'
    AND array_length(uss.last_5_scores, 1) = 5
  ON CONFLICT (draw_id, user_id) DO NOTHING;
END;
$$;

-- 2. Function to sync all eligible users into a draw
CREATE OR REPLACE FUNCTION sync_draw_entries(p_draw_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.draw_entries (draw_id, user_id, weight)
  SELECT 
    p_draw_id, 
    uss.user_id, 
    1
  FROM public.user_score_summary uss
  JOIN public.subscriptions s ON uss.user_id = s.user_id
  WHERE s.status = 'active'
    AND array_length(uss.last_5_scores, 1) = 5
    AND NOT EXISTS (
      SELECT 1 FROM public.draw_entries de 
      WHERE de.draw_id = p_draw_id AND de.user_id = uss.user_id
    )
  ON CONFLICT (draw_id, user_id) DO NOTHING;
END;
$$;

-- 3. Trigger on user_score_summary: Enter into active draws when 5 scores reached
CREATE OR REPLACE FUNCTION on_score_summary_update_enter_draw()
RETURNS TRIGGER AS $$
DECLARE
  v_active_draw_id uuid;
BEGIN
  -- If user now has 5 scores
  IF array_length(NEW.last_5_scores, 1) = 5 THEN
    -- Find active draws
    FOR v_active_draw_id IN 
      SELECT id FROM public.draw_events WHERE is_active = true
    LOOP
      PERFORM public.enter_user_into_draw(NEW.user_id, v_active_draw_id);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_enter_draw_on_score ON public.user_score_summary;
CREATE TRIGGER tr_enter_draw_on_score
  AFTER INSERT OR UPDATE ON public.user_score_summary
  FOR EACH ROW EXECUTE PROCEDURE on_score_summary_update_enter_draw();

-- 4. Trigger on draw_events: Sync eligible users when a draw is marked active
CREATE OR REPLACE FUNCTION on_draw_active_sync_entries()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true AND (OLD.is_active = false OR OLD.is_active IS NULL) THEN
    PERFORM public.sync_draw_entries(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_entries_on_draw_active ON public.draw_events;
CREATE TRIGGER tr_sync_entries_on_draw_active
  AFTER INSERT OR UPDATE ON public.draw_events
  FOR EACH ROW EXECUTE PROCEDURE on_draw_active_sync_entries();
