import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const STORAGE_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Applications`;

function fileUrl(path: string | null): string | null {
  if (!path) return null;
  return `${STORAGE_BASE}/${path}`;
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

  const applications = (data || []).map((row) => {
    const app = typeof row.application_json === "string"
      ? JSON.parse(row.application_json)
      : row.application_json || {};
    const primary = app?.primary || {};
    const isPaid = row.stripe_session_id && row.stripe_session_id !== "test_mode";

    return {
      id: row.id,
      createdAt: row.created_at,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      customerPhone: row.customer_phone,
      status: row.status,
      isPaid,
      stripeSession: row.stripe_session_id,
      // Applicant details from JSON
      firstName: primary.firstName || "",
      lastName: primary.lastName || "",
      ssn: primary.ssn ? `***-**-${primary.ssn.slice(-4)}` : null,
      dob: primary.dob || null,
      address: primary.address || null,
      city: primary.city || null,
      state: primary.state || null,
      zip: primary.zip || null,
      // File links
      files: {
        applicationPdf: fileUrl(row.application_pdf_file_name),
        agreement: fileUrl(row.agreement_pdf_file_name),
        chargeConfirmation: fileUrl(row.charge_confirmation_pdf_file_name),
        primaryLicense: fileUrl(row.primary_license_file_name),
        coApplicantLicense: fileUrl(row.co_applicant_license_file_name),
        insurance: fileUrl(row.insurance_file_name),
        registration: fileUrl(row.registration_file_name),
        driverLicensePhoto: fileUrl(row.driver_license_photo_file_name),
        utilityBill: fileUrl(row.utility_bill_file_name),
        businessLicense: fileUrl(row.business_license_file_name),
      },
    };
  });

  return NextResponse.json({ applications });
}
