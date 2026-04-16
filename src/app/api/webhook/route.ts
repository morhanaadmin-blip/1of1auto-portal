import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "create-checkout") {
      const stripeKey = process.env.STRIPE_SECRET_KEY;

      if (!stripeKey) {
        // Development mode: return success without Stripe
        return NextResponse.json({
          url: null, // null signals dev mode to the frontend
          message: "Stripe not configured — payment marked as dev/test",
        });
      }

      // Production: create Stripe Checkout Session
      const stripe = await import("stripe");
      const stripeClient = new stripe.default(stripeKey);

      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "1 OF 1 AUTO — Service Commitment Fee",
                description: "Broker engagement deposit — applied toward broker compensation",
              },
              unit_amount: 50000, // $500 in cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        customer_email: body.email,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/apply?payment=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/apply?payment=cancel`,
        metadata: {
          customerName: body.name,
          customerEmail: body.email,
        },
      });

      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
