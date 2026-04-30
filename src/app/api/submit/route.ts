import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  generateApplicationPDF,
  generateAgreementPDF,
  generateChargeConfirmationPDF,
} from "@/lib/pdf-generator";
import type { ApplicationData } from "@/lib/types";

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const appJson = formData.get("application") as string;
    if (!appJson) {
      return NextResponse.json({ error: "Missing application data" }, { status: 400 });
    }

    let application: ApplicationData = JSON.parse(appJson);

    // Sanitize input: remove formatting from phone, EIN, etc.
    const sanitizePhoneNumber = (phone: string) => phone.replace(/\D/g, "");
    const sanitizeEIN = (ein: string) => ein.replace(/\D/g, "");

    // Apply sanitization to primary applicant
    application.primary = {
      ...application.primary,
      phone: sanitizePhoneNumber(application.primary.phone),
    };

    // Apply sanitization to co-applicant if present
    if (application.coApplicant) {
      application.coApplicant = {
        ...application.coApplicant,
        phone: sanitizePhoneNumber(application.coApplicant.phone),
      };
    }

    // Apply sanitization to business if present
    if (application.business) {
      application.business = {
        ...application.business,
        ein: sanitizeEIN(application.business.ein),
      };
    }

    // Basic validation & extract primary applicant
    const p = application.primary;
    if (!p.firstName || !p.lastName || !p.email || !p.phone) {
      return NextResponse.json(
        { error: "Missing required primary applicant fields" },
        { status: 400 }
      );
    }

    // Generate PDFs
    let applicationPdfBuffer: Buffer | null = null;
    let agreementPdfBuffer: Buffer | null = null;
    let chargePdfBuffer: Buffer | null = null;

    try {
      applicationPdfBuffer = await generateApplicationPDF(application);
      console.log(`Generated application PDF: ${applicationPdfBuffer.length} bytes`);
    } catch (err) {
      console.error("Error generating application PDF:", err);
    }

    try {
      if (application.agreement.signatureData) {
        agreementPdfBuffer = await generateAgreementPDF(
          `${p.firstName} ${p.lastName}`,
          application.agreement.signatureData
        );
        console.log(`Generated agreement PDF: ${agreementPdfBuffer.length} bytes`);
      }
    } catch (err) {
      console.error("Error generating agreement PDF:", err);
    }

    try {
      if (application.depositPaid) {
        chargePdfBuffer = await generateChargeConfirmationPDF(
          `${p.firstName} ${p.lastName}`,
          p.email,
          99, // $99 deposit
          application.stripeSessionId || "unknown",
          "****" // Card last 4 not available in this context
        );
        console.log(`Generated charge confirmation PDF: ${chargePdfBuffer.length} bytes`);
      }
    } catch (err) {
      console.error("Error generating charge confirmation PDF:", err);
    }

    // Collect file metadata
    const files: { field: string; name: string; size: number; type: string }[] = [];
    const fileMap: { [key: string]: File } = {};

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        files.push({ field: key, name: value.name, size: value.size, type: value.type });
        fileMap[key] = value;
        console.log(`File attached: ${key} - ${value.name} (${value.size} bytes)`);
      }
    }

    // Add PDFs to files if generated
    if (applicationPdfBuffer) {
      files.push({ field: "application_pdf", name: "application.pdf", size: applicationPdfBuffer.byteLength, type: "application/pdf" });
    }
    if (agreementPdfBuffer) {
      files.push({ field: "agreement_pdf", name: "agreement-signed.pdf", size: agreementPdfBuffer.byteLength, type: "application/pdf" });
    }
    if (chargePdfBuffer) {
      files.push({ field: "charge_pdf", name: "payment-confirmation.pdf", size: chargePdfBuffer.byteLength, type: "application/pdf" });
    }

    console.log(`Total files collected: ${files.length}`);

    console.log("Application received:", {
      applicant: `${p.firstName} ${p.lastName}`,
      email: p.email,
      phone: p.phone,
      mode: application.mode,
      files: files.length,
      deposit: application.depositPaid,
    });

    // Create storage folder for this customer (sanitize for Supabase Storage)
    const sanitizePath = (str: string) =>
      str.toLowerCase().replace(/[^a-z0-9.-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    const customerName = sanitizePath(`${p.firstName} ${p.lastName}`);
    const folderPath = `${customerName}/${Date.now()}`;

    // Upload files to Supabase Storage
    const uploadedFiles: { [key: string]: string } = {};
    const uploadErrors: { [key: string]: string } = {};
    for (const [key, file] of Object.entries(fileMap)) {
      try {
        const sanitizedFileName = sanitizePath(file.name);
        const fileName = `${key}-${sanitizedFileName}`;
        const filePath = `${folderPath}/${fileName}`;

        const { error } = await supabase.storage
          .from("Applications")
          .upload(filePath, file);

        if (error) {
          const errorMsg = `Failed to upload ${key}: ${error.message}`;
          console.error(errorMsg);
          uploadErrors[key] = error.message;
        } else {
          uploadedFiles[key] = filePath;
          console.log(`Uploaded ${key} to ${filePath}`);
        }
      } catch (err) {
        const errorMsg = `Error uploading ${key}: ${err instanceof Error ? err.message : String(err)}`;
        console.error(errorMsg);
        uploadErrors[key] = errorMsg;
      }
    }

    // Upload generated PDFs
    if (applicationPdfBuffer) {
      try {
        const pdfPath = `${folderPath}/application.pdf`;
        const { error } = await supabase.storage
          .from("Applications")
          .upload(pdfPath, new Uint8Array(applicationPdfBuffer), { contentType: "application/pdf" });

        if (error) {
          console.error("Failed to upload application PDF:", error.message);
        } else {
          uploadedFiles["application_pdf"] = pdfPath;
          console.log(`Uploaded application PDF to ${pdfPath}`);
        }
      } catch (err) {
        console.error("Error uploading application PDF:", err);
      }
    }

    if (agreementPdfBuffer) {
      try {
        const pdfPath = `${folderPath}/agreement-signed.pdf`;
        const { error } = await supabase.storage
          .from("Applications")
          .upload(pdfPath, new Uint8Array(agreementPdfBuffer), { contentType: "application/pdf" });

        if (error) {
          console.error("Failed to upload agreement PDF:", error.message);
        } else {
          uploadedFiles["agreement_pdf"] = pdfPath;
          console.log(`Uploaded agreement PDF to ${pdfPath}`);
        }
      } catch (err) {
        console.error("Error uploading agreement PDF:", err);
      }
    }

    if (chargePdfBuffer) {
      try {
        const pdfPath = `${folderPath}/payment-confirmation.pdf`;
        const { error } = await supabase.storage
          .from("Applications")
          .upload(pdfPath, new Uint8Array(chargePdfBuffer), { contentType: "application/pdf" });

        if (error) {
          console.error("Failed to upload charge confirmation PDF:", error.message);
        } else {
          uploadedFiles["charge_pdf"] = pdfPath;
          console.log(`Uploaded charge confirmation PDF to ${pdfPath}`);
        }
      } catch (err) {
        console.error("Error uploading charge confirmation PDF:", err);
      }
    }

    if (Object.keys(uploadErrors).length > 0) {
      console.error("Upload errors:", uploadErrors);
    }

    // Save application record to database
    try {
      const { data, error } = await supabase
        .from("applications")
        .insert([
          {
            stripe_session_id: application.stripeSessionId,
            customer_name: customerName,
            customer_email: p.email,
            customer_phone: p.phone,
            application_mode: application.mode,
            status: "submitted",
            storage_folder_path: folderPath,
            application_json: application,
            primary_license_file_name: uploadedFiles["primary_license"] || null,
            co_applicant_license_file_name: uploadedFiles["coapp_license"] || null,
            insurance_file_name: uploadedFiles["insurance"] || null,
            registration_file_name: uploadedFiles["registration"] || null,
            utility_bill_file_name: uploadedFiles["utility_bill"] || null,
            driver_license_photo_file_name: uploadedFiles["driver_license_photo"] || null,
            business_license_file_name: uploadedFiles["business_license"] || null,
            application_pdf_file_name: uploadedFiles["application_pdf"] || null,
            agreement_pdf_file_name: uploadedFiles["agreement_pdf"] || null,
            charge_confirmation_pdf_file_name: uploadedFiles["charge_pdf"] || null,
            submitted_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) {
        const errorMsg = `Database error: ${error.message || JSON.stringify(error)}`;
        console.error("Failed to save application to database:", errorMsg);
        throw new Error(errorMsg);
      } else {
        console.log("Application saved to database:", data);
      }
    } catch (err) {
      const errorMsg = `Error saving to database: ${err instanceof Error ? err.message : String(err)}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Send Telegram notification to Mor
    await sendTelegramNotification(application, files, folderPath);

    return NextResponse.json({
      success: true,
      id: Date.now().toString(),
      storagePath: folderPath,
      uploadErrors: Object.keys(uploadErrors).length > 0 ? uploadErrors : null,
      filesUploaded: Object.keys(uploadedFiles).length,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Submit error:", errorMsg);
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}

async function sendTelegramNotification(
  app: ApplicationData,
  files: { field: string; name: string }[],
  storagePath: string
) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return;

  const p = app.primary;
  const lines = [
    `🚗 *New 1OF1 Application*`,
    ``,
    `*${p.firstName} ${p.middleName} ${p.lastName}*`,
    `📧 ${p.email}`,
    `📱 ${p.phone}`,
    `🎂 ${p.dob}`,
    ``,
    `📍 License: ${p.licenseAddress || "—"}`,
    p.registeringAddressSame === false
      ? `📍 Registering: ${p.registeringAddress || "—"} ⚠️ UTILITY BILL REQUIRED`
      : `📍 Registering: Same as license`,
    ``,
    `🏠 ${p.housingStatus} · ${p.yearsAtAddress || 0}y ${p.monthsAtAddress || 0}m · $${p.monthlyHousingPayment}/mo`,
    `💼 ${p.occupation} at ${p.employerName} (${p.yearsWorked || 0}y ${p.monthsWorked || 0}m)`,
    `💰 $${p.annualIncome}/yr ($${p.monthlyIncome}/mo)`,
    ``,
    `📋 Mode: ${app.mode.toUpperCase()}`,
  ];

  if (app.mode === "co-applicant" && app.coApplicant) {
    const c = app.coApplicant;
    lines.push(``, `*Co-Applicant: ${c.firstName} ${c.lastName}*`);
    lines.push(`💼 ${c.occupation} at ${c.employerName}`);
    lines.push(`💰 $${c.annualIncome}/yr`);
  }

  if (app.mode === "business" && app.business) {
    const b = app.business;
    lines.push(``, `*Business: ${b.legalName}*`);
    lines.push(`🏢 ${b.title} · ${b.ownershipPercent}% ownership`);
    lines.push(`📋 EIN: ${b.ein} · ${b.yearsInBusiness}yrs in business`);
    lines.push(`🏦 Bank: ${b.bankName}`);
  }

  lines.push(``, `📎 Docs: ${files.length} files uploaded`);
  lines.push(`✍️ Agreement: ${app.agreement.agreed ? "Signed" : "Not signed"}`);
  lines.push(`💳 Deposit: ${app.depositPaid ? "$99 paid" : "Pending"}`);
  lines.push(`📁 Storage: \`${storagePath}\``);
  lines.push(``, `📞 Contact: 1 OF 1 AUTO Representative · 954-770-1177`);

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: lines.join("\n"),
        parse_mode: "Markdown",
      }),
    });
  } catch {
    console.error("Telegram notification failed");
  }
}
