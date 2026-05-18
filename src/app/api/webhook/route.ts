import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

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

      if (body.email) params.set("customer_email", body.email);
      if (body.name) params.set("metadata[customerName]", body.name);
      if (body.email) params.set("metadata[customerEmail]", body.email);

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

    // Stripe webhook events (checkout.session.completed, etc.) — acknowledge receipt
    if (body.type && body.id && body.object === "event") {
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Webhook error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
