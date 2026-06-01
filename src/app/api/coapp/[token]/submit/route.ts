import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateApplicationPDF } from "@/lib/pdf-generator";
import type { ApplicationData, PersonData } from "@/lib/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const sanitizePhone = (p: string) => p.replace(/\D/g, "");
const sanitizePath = (str: string) =>
  str.toLowerCase().replace(/[^a-z0-9.-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    // Look up the invite
    const { data: invite, error: lookupError } = await supabase
      .from("coapp_invites")
      .select("id, token, primary_first_name, primary_last_name, co_applicant_submitted_at")
      .eq("token", token)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json({ error: lookupError.message }, { status: 500 });
    }
    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }
    if (invite.co_applicant_submitted_at) {
      return NextResponse.json({ error: "This invite has already been used" }, { status: 409 });
    }

    const formData = await req.formData();
    const coappJson = formData.get("coapp");
    if (typeof coappJson !== "string") {
      return NextResponse.json({ error: "Missing co-applicant data" }, { status: 400 });
    }

    let coApplicant: PersonData;
    try {
      coApplicant = JSON.parse(coappJson) as PersonData;
    } catch {
      return NextResponse.json({ error: "Malformed co-applicant data" }, { status: 400 });
    }

    // Strip File-shaped slots that won't survive JSON, sanitize phone.
    coApplicant = {
      ...coApplicant,
      licenseFile: null,
      licenseImage: null,
      dlPhotoTracking: coApplicant.dlPhotoTracking ?? null,
      phone: sanitizePhone(coApplicant.phone || ""),
    };

    // Upload license file (if provided) into a coapp-token-scoped folder.
    let coAppLicensePath: string | null = null;
    const licenseFile = formData.get("license");
    if (licenseFile instanceof File && licenseFile.size > 0) {
      const fileName = `${Date.now()}-${sanitizePath(licenseFile.name)}`;
      const filePath = `coapp/${token}/coapp_license-${fileName}`;
      const { error: upErr } = await supabase.storage
        .from("Applications")
        .upload(filePath, licenseFile);
      if (upErr) {
        console.error("Co-applicant license upload failed:", upErr);
      } else {
        coAppLicensePath = filePath;
      }
    }

    // Persist co-app data on the invite row.
    const submittedAt = new Date().toISOString();
    const { error: updateInviteErr } = await supabase
      .from("coapp_invites")
      .update({
        co_applicant_data: coApplicant,
        co_applicant_license_file_name: coAppLicensePath,
        co_applicant_submitted_at: submittedAt,
      })
      .eq("id", invite.id);

    if (updateInviteErr) {
      console.error("Failed to save co-app data:", updateInviteErr);
      return NextResponse.json({ error: updateInviteErr.message }, { status: 500 });
    }

    // If the primary already submitted, merge the co-app data into that application now.
    const { data: appRow, error: appLookupErr } = await supabase
      .from("applications")
      .select(
        `id, application_json, storage_folder_path, status,
         primary_license_file_name, co_applicant_license_file_name,
         insurance_file_name, registration_file_name,
         driver_license_photo_file_name, utility_bill_file_name,
         business_license_file_name, application_pdf_file_name`
      )
      .eq("coapp_invite_token", token)
      .maybeSingle();

    if (appLookupErr) {
      console.error("Application lookup failed (continuing):", appLookupErr);
    }

    if (appRow) {
      try {
        await mergeCoAppIntoApplication(appRow, coApplicant, coAppLicensePath, invite.id);
      } catch (mergeErr) {
        console.error("Merge failed:", mergeErr);
        // Co-app data is still persisted on the invite row; admin can recover.
      }
    }

    return NextResponse.json({
      success: true,
      mergedIntoApplication: !!appRow,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Co-app submit error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

type AppRow = {
  id: string;
  application_json: ApplicationData | string;
  storage_folder_path: string;
  status: string;
  primary_license_file_name: string | null;
  co_applicant_license_file_name: string | null;
  insurance_file_name: string | null;
  registration_file_name: string | null;
  driver_license_photo_file_name: string | null;
  utility_bill_file_name: string | null;
  business_license_file_name: string | null;
  application_pdf_file_name: string | null;
};

async function mergeCoAppIntoApplication(
  row: AppRow,
  coApplicant: PersonData,
  coAppLicensePath: string | null,
  inviteId: string
) {
  const app: ApplicationData =
    typeof row.application_json === "string"
      ? JSON.parse(row.application_json)
      : row.application_json;

  app.coApplicant = coApplicant;

  // Rebuild _staged for the PDF generator so all doc statuses render correctly.
  (app as Record<string, unknown>)._staged = {
    primaryLicense: row.primary_license_file_name || null,
    coAppLicense: coAppLicensePath || row.co_applicant_license_file_name || null,
    insurance: row.insurance_file_name || null,
    registration: row.registration_file_name || null,
    driverLicensePhoto: row.driver_license_photo_file_name || null,
    utilityBill: row.utility_bill_file_name || null,
    businessLicense: row.business_license_file_name || null,
  };

  // Regenerate the application PDF with merged data.
  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await generateApplicationPDF(app);
  } catch (err) {
    console.error("PDF regenerate after co-app merge failed:", err);
  }

  const pdfPath =
    row.application_pdf_file_name || `${row.storage_folder_path}/application.pdf`;
  if (pdfBuffer) {
    const { error: pdfUpErr } = await supabase.storage
      .from("Applications")
      .upload(pdfPath, pdfBuffer, { contentType: "application/pdf", upsert: true });
    if (pdfUpErr) console.error("PDF upload after merge failed:", pdfUpErr);
  }

  const nextStatus = row.status === "awaiting_coapplicant" ? "submitted" : row.status;

  await supabase
    .from("applications")
    .update({
      application_json: app,
      co_applicant_license_file_name:
        coAppLicensePath || row.co_applicant_license_file_name,
      application_pdf_file_name: pdfPath,
      status: nextStatus,
    })
    .eq("id", row.id);

  await supabase
    .from("coapp_invites")
    .update({ merged_into_application_id: row.id })
    .eq("id", inviteId);
}
