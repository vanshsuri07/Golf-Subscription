import { stripe } from "@/lib/stripe";
import { upsertSubscription, updateSubscriptionStatus } from "@/lib/billing";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("Stripe-Signature");
  
  if (!signature) {
    return new NextResponse("Missing Stripe Signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error("Webhook signature verification failed:", error);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  // Helper to safely convert Stripe Unix timestamp (seconds) to JS Date
  const safeToDate = (timestamp: number | null | undefined): Date => {
    if (typeof timestamp !== "number" || isNaN(timestamp)) return new Date();
    const date = new Date(timestamp * 1000);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription") {
          const subscriptionId = session.subscription as string;
          const customerId = session.customer as string;
          const userId = session.metadata?.user_id;

          if (userId && subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
            await upsertSubscription({
              userId,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              status: subscription.status,
              priceId: subscription.items.data[0]?.price.id || null,
              currentPeriodEnd: safeToDate(subscription.current_period_end),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            });
          }
        }
        break;
      }
      
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as any; // Using any due to Dahlia API restructuring
        
        let userId = subscription.metadata.user_id;
        
        if (!userId) {
          // fallback to fetching from our DB by customer ID
          const userLookup = await pool.query(
            "SELECT user_id FROM public.subscriptions WHERE stripe_customer_id = $1 LIMIT 1", 
            [subscription.customer as string]
          );
          if (userLookup.rows.length) {
            userId = userLookup.rows[0].user_id;
          }
        }

        if (userId) {
          await upsertSubscription({
            userId,
            stripeCustomerId: subscription.customer as string,
            stripeSubscriptionId: subscription.id,
            status: subscription.status,
            priceId: subscription.items.data[0]?.price.id || null,
            currentPeriodEnd: safeToDate(subscription.current_period_end),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any; // Using any due to Dahlia API restructuring
        await updateSubscriptionStatus(
          subscription.id,
          'canceled',
          safeToDate(subscription.current_period_end),
          subscription.cancel_at_period_end
        );
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any; // Using any due to Dahlia API property restructuring
        const subscriptionId = invoice.subscription || invoice.parent?.subscription_details?.subscription;
        
        if (subscriptionId) {
          // Subscriptions might become active after a payment failure when the new payment succeeds
          await updateSubscriptionStatus(subscriptionId as string, 'active');
        }

        // Allocate revenue to pool
        const customerId = invoice.customer as string;
        let userId: string | undefined;

        if (!userId) {
          const userLookup = await pool.query(
            "SELECT user_id FROM public.subscriptions WHERE stripe_customer_id = $1 LIMIT 1", 
            [customerId]
          );
          if (userLookup.rows.length) {
            userId = userLookup.rows[0].user_id;
          }
        }

        if (userId && invoice.id && invoice.amount_paid) {
            const amountInDollars = invoice.amount_paid / 100;
            await pool.query(
               `select allocate_revenue_to_pool($1, $2, $3)`,
               [userId, invoice.id, amountInDollars]
            );
        }

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription || invoice.parent?.subscription_details?.subscription;

        if (subscriptionId) {
          // Mark as past due
          await updateSubscriptionStatus(subscriptionId as string, 'past_due');
        }
        break;
      }
    }

    return new NextResponse("Webhook Processed", { status: 200 });
  } catch (error: any) {
    console.error(`Error processing webhook ${event.type}:`, error);
    return new NextResponse("Webhook Processing Error", { status: 500 });
  }
}
