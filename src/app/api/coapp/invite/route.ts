import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  generateInviteToken,
  buildInviteLink,
  sendCoAppInviteSms,
} from "@/lib/coapp-invite";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const VALID_RELATIONSHIPS = new Set(["spouse", "relative", "partner", "other"]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const primaryFirstName = String(body.primaryFirstName || "").trim();
    const primaryLastName = String(body.primaryLastName || "").trim();
    const primaryEmail = String(body.primaryEmail || "").trim() || null;
    const relationship = String(body.relationship || "").trim();
    const coApplicantPhone = String(body.coApplicantPhone || "").replace(/\D/g, "");

    if (!primaryFirstName || !primaryLastName) {
      return NextResponse.json({ error: "Missing primary name" }, { status: 400 });
    }
    if (!VALID_RELATIONSHIPS.has(relationship)) {
      return NextResponse.json({ error: "Invalid relationship" }, { status: 400 });
    }
    if (coApplicantPhone.length !== 10) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    const token = generateInviteToken();
    const link = buildInviteLink(token, req);

    const { error: insertError } = await supabase.from("coapp_invites").insert([
      {
        token,
        primary_first_name: primaryFirstName,
        primary_last_name: primaryLastName,
        primary_email: primaryEmail,
        relationship,
        co_applicant_phone: coApplicantPhone,
      },
    ]);

    if (insertError) {
      console.error("Failed to insert coapp invite:", insertError);
      return NextResponse.json(
        { error: `Could not create invite: ${insertError.message}` },
        { status: 500 }
      );
    }

    const sms = await sendCoAppInviteSms({
      toPhone: coApplicantPhone,
      primaryName: `${primaryFirstName} ${primaryLastName}`.trim(),
      link,
    });

    return NextResponse.json({ token, link, smsSent: sms.sent, smsReason: sms.reason });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Invite error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
