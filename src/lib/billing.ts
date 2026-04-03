import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function upsertSubscription(data: {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: string;
  priceId: string | null;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}) {
  const { error } = await supabaseAdmin
    .from("subscriptions")
    .upsert({
      user_id: data.userId,
      stripe_customer_id: data.stripeCustomerId,
      stripe_subscription_id: data.stripeSubscriptionId,
      status: data.status,
      price_id: data.priceId,
      current_period_end: data.currentPeriodEnd.toISOString(),
      cancel_at_period_end: data.cancelAtPeriodEnd,
      updated_at: new Date().toISOString()
    }, {
      onConflict: "stripe_subscription_id"
    });

  if (error) {
    console.error("upsertSubscription Error:", error);
    throw error;
  }
}

export async function updateSubscriptionStatus(
  stripeSubscriptionId: string,
  status: string,
  currentPeriodEnd?: Date,
  cancelAtPeriodEnd?: boolean
) {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  };

  if (currentPeriodEnd) {
    updateData.current_period_end = currentPeriodEnd.toISOString();
  }
  
  if (cancelAtPeriodEnd !== undefined) {
    updateData.cancel_at_period_end = cancelAtPeriodEnd;
  }

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update(updateData)
    .eq("stripe_subscription_id", stripeSubscriptionId);

  if (error) {
    console.error("updateSubscriptionStatus Error:", error);
    throw error;
  }
}
