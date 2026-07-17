import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateApplicationPDF } from "@/lib/pdf-generator";
import { decrypt } from "@/lib/crypto";
import { preparePatch } from "@/lib/admin-patch";
import type { ApplicationData } from "@/lib/types";

function decryptIfEncrypted(value: string | undefined | null): string {
  if (!value) return "";
  try {
    // Encrypted values are "ivHex:tagHex:dataHex" — three colon-separated hex segments
    const parts = value.split(":");
    if (parts.length === 3 && parts.every(p => /^[0-9a-f]+$/i.test(p))) {
      return decrypt(value);
    }
  } catch { /* not encrypted or wrong key — return as-is */ }
  return value;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: NextRequest) {
  const password = req.headers.get("x-admin-password");
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, patches, coPatches } = body as { id: string; patches?: Record<string, string>; coPatches?: Record<string, string> };
  if (!id) {
    return NextResponse.json({ error: "Missing application id" }, { status: 400 });
  }

  // Validate, normalize and encrypt the patches before touching the database, so
  // a bad SSN costs a round-trip and never reaches application_json.
  const primaryPatch = preparePatch(patches, "Primary");
  if (!primaryPatch.ok) {
    return NextResponse.json({ error: primaryPatch.error }, { status: 400 });
  }
  const coPatch = preparePatch(coPatches, "Co-applicant");
  if (!coPatch.ok) {
    return NextResponse.json({ error: coPatch.error }, { status: 400 });
  }

  // Fetch the application row
  const { data: row, error: fetchError } = await supabase
    .from("applications")
    .select(
      `id, application_json, application_pdf_file_name, storage_folder_path,
       primary_license_file_name, co_applicant_license_file_name,
       insurance_file_name, registration_file_name,
       driver_license_photo_file_name, utility_bill_file_name,
       business_license_file_name`
    )
    .eq("id", id)
    .single();

  if (fetchError || !row) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  // Parse application JSON
  const application: ApplicationData = typeof row.application_json === "string"
    ? JSON.parse(row.application_json)
    : row.application_json;

  // Apply admin patches
  if (Object.keys(coPatch.patch).length > 0 && !application.coApplicant) {
    // Better to say so than to accept the edit and drop it on the floor.
    return NextResponse.json(
      { error: "This application has no co-applicant to edit." },
      { status: 400 }
    );
  }

  if (Object.keys(primaryPatch.patch).length > 0) {
    application.primary = { ...application.primary, ...primaryPatch.patch } as typeof application.primary;
  }
  if (Object.keys(coPatch.patch).length > 0 && application.coApplicant) {
    application.coApplicant = { ...application.coApplicant, ...coPatch.patch } as typeof application.coApplicant;
  }
  if (Object.keys(primaryPatch.patch).length > 0 || Object.keys(coPatch.patch).length > 0) {
    const { error: updateError } = await supabase
      .from("applications")
      .update({ application_json: application })
      .eq("id", id);
    if (updateError) {
      return NextResponse.json(
        { error: `Saving changes failed: ${updateError.message}` },
        { status: 500 }
      );
    }
  }

  // Reconstruct _staged from stored DB file paths so document status shows correctly
  (application as Record<string, unknown>)._staged = {
    primaryLicense: row.primary_license_file_name || null,
    coAppLicense: row.co_applicant_license_file_name || null,
    insurance: row.insurance_file_name || null,
    registration: row.registration_file_name || null,
    driverLicensePhoto: row.driver_license_photo_file_name || null,
    utilityBill: row.utility_bill_file_name || null,
    businessLicense: row.business_license_file_name || null,
  };

  // Decrypt sensitive fields before PDF generation (DB stores them encrypted)
  application.primary = {
    ...application.primary,
    ssn: decryptIfEncrypted(application.primary.ssn),
    dob: decryptIfEncrypted(application.primary.dob),
  };
  if (application.coApplicant) {
    application.coApplicant = {
      ...application.coApplicant,
      ssn: decryptIfEncrypted(application.coApplicant.ssn),
      dob: decryptIfEncrypted(application.coApplicant.dob),
    };
  }
  if (application.business) {
    application.business = {
      ...application.business,
      ein: decryptIfEncrypted(application.business.ein),
    };
  }

  // Regenerate PDF with fixed generator
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generateApplicationPDF(application);
  } catch (err) {
    return NextResponse.json(
      { error: `PDF generation failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }

  // Determine storage path — reuse existing path if present, otherwise create new one
  const pdfPath = row.application_pdf_file_name || `${row.storage_folder_path}/application.pdf`;

  // Upsert (overwrite) in Supabase storage
  const { error: uploadError } = await supabase.storage
    .from("Applications")
    .upload(pdfPath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: `Storage upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  // Update DB record if path changed
  if (!row.application_pdf_file_name) {
    await supabase
      .from("applications")
      .update({ application_pdf_file_name: pdfPath })
      .eq("id", id);
  }

  return NextResponse.json({ success: true, path: pdfPath });
}
