import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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
    await supabase.from("users").upsert(
      { id: userId, email: email ?? "", full_name: user.user_metadata?.full_name || "", role: "subscriber" },
      { onConflict: "id", ignoreDuplicates: true }
    );

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
    const { data: subRow } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id, status, id")
      .eq("user_id", userId)
      .limit(1)
      .single();

    if (subRow?.status === "active") {
      return NextResponse.json({ url: "/dashboard" });
    }

    if (subRow?.stripe_customer_id) {
      customerId = subRow.stripe_customer_id as string;
    } else {
      // 2. Create Stripe customer if missing
      const customer = await stripe.customers.create({
        email: email || undefined,
        metadata: { user_id: userId },
      });
      customerId = customer.id;

      // 3. Store stripe_customer_id
      if (subRow) {
        await supabase
          .from("subscriptions")
          .update({ stripe_customer_id: customerId })
          .eq("user_id", userId);
      } else {
        await supabase
          .from("subscriptions")
          .insert({ user_id: userId, stripe_customer_id: customerId, status: "incomplete" });
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
