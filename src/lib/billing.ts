import { pool } from "./db";

export async function upsertSubscription(data: {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: string;
  priceId: string | null;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}) {
  const query = `
    INSERT INTO public.subscriptions (
      user_id,
      stripe_customer_id,
      stripe_subscription_id,
      status,
      price_id,
      current_period_end,
      cancel_at_period_end,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    ON CONFLICT (stripe_subscription_id)
    DO UPDATE SET
      status = EXCLUDED.status,
      price_id = EXCLUDED.price_id,
      current_period_end = EXCLUDED.current_period_end,
      cancel_at_period_end = EXCLUDED.cancel_at_period_end,
      updated_at = NOW();
  `;

  await pool.query(query, [
    data.userId,
    data.stripeCustomerId,
    data.stripeSubscriptionId,
    data.status,
    data.priceId,
    data.currentPeriodEnd,
    data.cancelAtPeriodEnd,
  ]);
}

export async function updateSubscriptionStatus(
  stripeSubscriptionId: string,
  status: string,
  currentPeriodEnd?: Date,
  cancelAtPeriodEnd?: boolean
) {
  let query = `
    UPDATE public.subscriptions 
    SET 
      status = $2, 
      updated_at = NOW()
  `;
  const params: any[] = [stripeSubscriptionId, status];

  let paramIndex = 3;
  if (currentPeriodEnd) {
    query += `, current_period_end = $${paramIndex}`;
    params.push(currentPeriodEnd);
    paramIndex++;
  }
  
  if (cancelAtPeriodEnd !== undefined) {
    query += `, cancel_at_period_end = $${paramIndex}`;
    params.push(cancelAtPeriodEnd);
    paramIndex++;
  }

  query += ` WHERE stripe_subscription_id = $1`;

  await pool.query(query, params);
}
