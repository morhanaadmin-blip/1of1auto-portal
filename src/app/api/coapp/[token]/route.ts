import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("coapp_invites")
    .select(
      "token, primary_first_name, primary_last_name, relationship, co_applicant_submitted_at"
    )
    .eq("token", token)
    .maybeSingle();

  if (error) {
    console.error("coapp invite lookup error:", error);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  return NextResponse.json({
    primaryFirstName: data.primary_first_name,
    primaryLastName: data.primary_last_name,
    relationship: data.relationship,
    alreadySubmitted: !!data.co_applicant_submitted_at,
  });
}
