import { stripe } from "@/lib/stripe";
import { requireAuth } from "@/lib/permissions";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const userId = session.user?.id;
    const email = session.user?.email;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
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
        // We create a skeleton subscription row with unpaid/incomplete status
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
          price: process.env.STRIPE_PRO_PRICE_ID, // Could also be passed in body
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
