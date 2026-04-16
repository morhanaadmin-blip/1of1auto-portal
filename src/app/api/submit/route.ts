import { NextRequest, NextResponse } from "next/server";
import type { ApplicationData } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const appJson = formData.get("application") as string;
    if (!appJson) {
      return NextResponse.json({ error: "Missing application data" }, { status: 400 });
    }

    const application: ApplicationData = JSON.parse(appJson);

    // Collect file metadata
    const files: { field: string; name: string; size: number; type: string }[] = [];
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        files.push({ field: key, name: value.name, size: value.size, type: value.type });
        // TODO: Upload to Supabase Storage when configured
      }
    }

    // Basic validation
    const p = application.primary;
    if (!p.firstName || !p.lastName || !p.email || !p.phone) {
      return NextResponse.json(
        { error: "Missing required primary applicant fields" },
        { status: 400 }
      );
    }

    console.log("Application received:", {
      applicant: `${p.firstName} ${p.lastName}`,
      email: p.email,
      phone: p.phone,
      mode: application.mode,
      files: files.length,
      deposit: application.depositPaid,
    });

    // Send Telegram notification to Mor
    await sendTelegramNotification(application, files);

    // TODO: Save to Supabase when configured
    return NextResponse.json({ success: true, id: Date.now().toString() });
  } catch (err) {
    console.error("Submit error:", err);
    return NextResponse.json(
      { error: "Failed to process application" },
      { status: 500 }
    );
  }
}

async function sendTelegramNotification(
  app: ApplicationData,
  files: { field: string; name: string }[]
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
  lines.push(`💳 Deposit: ${app.depositPaid ? "$500 paid" : "Pending"}`);

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
