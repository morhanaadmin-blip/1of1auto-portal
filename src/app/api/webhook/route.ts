import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY?.trim() || "", {
  apiVersion: "2026-03-25.dahlia",
});

export async function POST(req: NextRequest) {
  // Read raw body as text — required for Stripe signature verification.
  // Do NOT use req.json() here; it consumes the stream and the raw bytes
  // will no longer match what Stripe signed.
  const rawBody = await req.text();

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    if (body.action === "create-checkout") {
      const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();

      if (!stripeKey) {
        return NextResponse.json({ url: null, message: "Stripe not configured — dev mode" });
      }

      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://1of1auto-portal.vercel.app").trim();

      // Call Stripe REST API directly — no SDK, no connection issues
      const params = new URLSearchParams({
        "payment_method_types[0]": "card",
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][product_data][name]": "1 OF 1 AUTO — Service Commitment Fee",
        "line_items[0][price_data][product_data][description]": "Broker engagement deposit",
        "line_items[0][price_data][unit_amount]": "9900",
        "line_items[0][quantity]": "1",
        mode: "payment",
        success_url: `${appUrl}/apply?payment=success`,
        cancel_url: `${appUrl}/apply?payment=cancel`,
      });

      const email = body.email as string | undefined;
      const name = body.name as string | undefined;
      if (email) params.set("customer_email", email);
      if (name) params.set("metadata[customerName]", name);
      if (email) params.set("metadata[customerEmail]", email);

      const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const session = await stripeRes.json();

      if (!stripeRes.ok) {
        console.error("Stripe API error:", session.error);
        return NextResponse.json({ error: session.error?.message || "Stripe error" }, { status: 500 });
      }

      return NextResponse.json({ url: session.url });
    }

    // Stripe webhook events — verify signature before processing
    if (body.type && body.id && body.object === "event") {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error("STRIPE_WEBHOOK_SECRET is not set");
        return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
      }

      const signature = req.headers.get("stripe-signature");
      if (!signature) {
        return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
      }

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("Stripe webhook signature verification failed:", msg);
        return NextResponse.json({ error: `Webhook signature verification failed: ${msg}` }, { status: 400 });
      }

      // Signature verified — safe to process the event
      console.log("Verified Stripe webhook event:", event.type, event.id);
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Webhook error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
