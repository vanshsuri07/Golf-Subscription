import Stripe from "stripe";

// Requires STRIPE_SECRET_KEY in your env variables
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-03-25.dahlia" as any, // Using requested specific API version
  appInfo: {
    name: "Platform Subscription",
    version: "0.1.0",
  },
});
