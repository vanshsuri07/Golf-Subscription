import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const supabase = createClient(await cookies());
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = user.id;
    const email = user.email;

    // 0. Ensure user exists in public.users (safety sync for trigger delay)
    const userCheck = await pool.query("SELECT id FROM public.users WHERE id = $1", [userId]);
    if (userCheck.rows.length === 0) {
      console.log(`User ${userId} not found in public.users, syncing now...`);
      await pool.query(
        `INSERT INTO public.users (id, email, full_name, role) 
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [userId, email, user.user_metadata?.full_name || "", "subscriber"]
      );
    }

    // Parse request body for plan selection
    const body = await req.json().catch(() => ({}));
    const plan = body.plan || "monthly"; // "monthly" or "yearly"

    const priceId = plan === "yearly"
      ? process.env.STRIPE_YEARLY_PRICE_ID
      : process.env.STRIPE_PRO_PRICE_ID;

    if (!priceId) {
      return new NextResponse("Price ID not configured", { status: 500 });
    }

    // 1. Fetch user to see if they have a stripe customer id
    let customerId: string | undefined;
    const subResult = await pool.query(
      "SELECT stripe_customer_id, id FROM public.subscriptions WHERE user_id = $1 LIMIT 1",
      [userId]
    );

    if (subResult.rows.length > 0 && subResult.rows[0].stripe_customer_id) {
      customerId = subResult.rows[0].stripe_customer_id;
    } else {
      // 2. Create Stripe customer if missing
      const customer = await stripe.customers.create({
        email: email || undefined,
        metadata: {
          user_id: userId,
        },
      });
      customerId = customer.id;

      // 3. Store stripe_customer_id
      if (subResult.rows.length > 0) {
        await pool.query(
          "UPDATE public.subscriptions SET stripe_customer_id = $1 WHERE user_id = $2",
          [customerId, userId]
        );
      } else {
        await pool.query(
          `INSERT INTO public.subscriptions (user_id, stripe_customer_id, status)
           VALUES ($1, $2, 'incomplete')`,
          [userId, customerId]
        );
      }
    }

    // 4. Create checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?canceled=true`,
      metadata: {
        user_id: userId,
      },
    });

    if (!stripeSession.url) {
      return new NextResponse("Could not create checkout session", { status: 500 });
    }

    return NextResponse.json({ url: stripeSession.url });
  } catch (error: any) {
    console.error("Checkout POST Error:", error);
    return new NextResponse(error.message, { status: 500 });
  }
}
