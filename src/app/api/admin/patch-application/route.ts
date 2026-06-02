import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// PATCH /api/admin/patch-application
// Body: { id, primary?: Record<string,string>, coApplicant?: Record<string,string> }
// Directly updates application_json in DB without regenerating PDF.
// Useful for fixing typos before a regenerate call.
export async function POST(req: NextRequest) {
  const password = req.headers.get("x-admin-password");
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, primary, coApplicant } = body as {
    id: string;
    primary?: Record<string, string>;
    coApplicant?: Record<string, string>;
  };

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { data: row, error: fetchError } = await supabase
    .from("applications")
    .select("application_json")
    .eq("id", id)
    .single();

  if (fetchError || !row) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const app = typeof row.application_json === "string"
    ? JSON.parse(row.application_json)
    : row.application_json;

  if (primary && Object.keys(primary).length > 0) {
    app.primary = { ...app.primary, ...primary };
  }
  if (coApplicant && Object.keys(coApplicant).length > 0 && app.coApplicant) {
    app.coApplicant = { ...app.coApplicant, ...coApplicant };
  }

  const { error: updateError } = await supabase
    .from("applications")
    .update({ application_json: app })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
