import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { decrypt } from "@/lib/crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function fileUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from("Applications")
    .createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function GET(req: NextRequest) {
  const password = req.headers.get("x-admin-password");
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("applications")
    .select(
      `id, created_at, customer_name, customer_email, customer_phone,
       status, stripe_session_id, storage_folder_path,
       primary_license_file_name, co_applicant_license_file_name,
       insurance_file_name, registration_file_name,
       driver_license_photo_file_name, utility_bill_file_name,
       business_license_file_name, agreement_pdf_file_name,
       charge_confirmation_pdf_file_name, application_pdf_file_name,
       application_json`
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const applications = await Promise.all(
    (data || []).map(async (row) => {
      const app = typeof row.application_json === "string"
        ? JSON.parse(row.application_json)
        : row.application_json || {};
      const primary = app?.primary || {};

      // Decrypt sensitive fields — gracefully fall back to raw value if not encrypted
      // (handles legacy plaintext rows that predate encryption).
      const safeDecrypt = (value: string | undefined | null): string | undefined | null => {
        if (!value) return value;
        if (!value.includes(':')) return value; // not encrypted — old plaintext record
        try { return decrypt(value); } catch { return value; }
      };

      primary.ssn = safeDecrypt(primary.ssn);
      primary.dob = safeDecrypt(primary.dob);
      if (app?.coApplicant) {
        app.coApplicant.ssn = safeDecrypt(app.coApplicant.ssn);
        app.coApplicant.dob = safeDecrypt(app.coApplicant.dob);
      }
      if (app?.business) {
        app.business.ein = safeDecrypt(app.business.ein);
      }
      const isPaid = row.stripe_session_id && row.stripe_session_id !== "test_mode";

      // Compute missing fields required by lenders
      const missingFields: string[] = [];
      if (!primary.ssn) missingFields.push("Primary SSN");
      if (primary.employerName && !primary.employerStreet) missingFields.push("Primary employer address");
      if (!primary.employerName && !primary.occupation) missingFields.push("Primary occupation / employer");
      if (app?.mode === "co-applicant" && app?.coApplicant) {
        const c = app.coApplicant;
        if (!c.ssn) missingFields.push("Co-applicant SSN");
        if (c.employerName && !c.employerStreet) missingFields.push("Co-applicant employer address");
      }

      return {
        id: row.id,
        createdAt: row.created_at,
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        customerPhone: row.customer_phone,
        status: row.status,
        isPaid,
        stripeSession: row.stripe_session_id,
        missingFields,
        // Applicant details from JSON
        firstName: primary.firstName || "",
        lastName: primary.lastName || "",
        ssn: primary.ssn ? `***-**-${primary.ssn.slice(-4)}` : null,
        dob: primary.dob || null,
        address: primary.address || null,
        city: primary.city || null,
        state: primary.state || null,
        zip: primary.zip || null,
        // File links (signed URLs, 1-hour expiry)
        files: {
          applicationPdf: await fileUrl(row.application_pdf_file_name),
          agreement: await fileUrl(row.agreement_pdf_file_name),
          chargeConfirmation: await fileUrl(row.charge_confirmation_pdf_file_name),
          primaryLicense: await fileUrl(row.primary_license_file_name),
          coApplicantLicense: await fileUrl(row.co_applicant_license_file_name),
          insurance: await fileUrl(row.insurance_file_name),
          registration: await fileUrl(row.registration_file_name),
          driverLicensePhoto: await fileUrl(row.driver_license_photo_file_name),
          utilityBill: await fileUrl(row.utility_bill_file_name),
          businessLicense: await fileUrl(row.business_license_file_name),
        },
      };
    })
  );

  return NextResponse.json({ applications });
}
