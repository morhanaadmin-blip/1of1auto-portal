import PDFDocument from "pdfkit";
import * as fs from "fs";
import * as path from "path";
import type { ApplicationData, PersonData, BusinessData } from "./types";

// ─── Colors ───────────────────────────────────────────────────────────────────
const GOLD  = "#C9A84C";
const DARK  = "#111111";
const GRAY  = "#666666";
const LGRAY = "#CCCCCC";

// ─── Page & Grid Constants ────────────────────────────────────────────────────
const PW     = 612;                          // letter width (pt)
const MARGIN = 40;
const CW     = PW - MARGIN * 2;             // 532 pt content width
const ROW_H  = 30;                          // height per field row
const GAP    = 10;                          // gap between columns

// 2-column layout
const C2 = Math.floor((CW - GAP) / 2);     // 261
const X2 = [MARGIN, MARGIN + C2 + GAP] as const;  // [40, 311]

// 4-column layout (equal)
const C4 = Math.floor((CW - 3 * GAP) / 4); // 125
const X4 = [
  MARGIN,
  MARGIN + C4 + GAP,
  MARGIN + 2 * (C4 + GAP),
  MARGIN + 3 * (C4 + GAP),
] as const; // [40, 175, 310, 445]
// Last col picks up any rounding remainder
const C4_LAST = CW - 3 * (C4 + GAP);       // 127

// 3-column layout (equal)
const C3 = Math.floor((CW - 2 * GAP) / 3); // 170
const X3 = [
  MARGIN,
  MARGIN + C3 + GAP,
  MARGIN + 2 * (C3 + GAP),
] as const; // [40, 220, 400]
const C3_LAST = CW - 2 * (C3 + GAP);       // 172

// Asymmetric columns — Name / DOB / SSN row
const NAME_W = 238;
const DOB_W  = 138;
const SSN_W  = CW - NAME_W - DOB_W - 2 * GAP;  // 136

// Employer Tel / Address row
const TEL_W  = 140;
const ADDR_W = CW - TEL_W - GAP;               // 382

// ─── Format Helpers ───────────────────────────────────────────────────────────
function fPhone(v: string): string {
  const c = v?.replace(/\D/g, "") ?? "";
  return c.length === 10 ? `${c.slice(0,3)}-${c.slice(3,6)}-${c.slice(6)}` : (v || "—");
}
function fSSN(v: string): string {
  const c = v?.replace(/\D/g, "") ?? "";
  return c.length === 9 ? `${c.slice(0,3)}-${c.slice(3,5)}-${c.slice(5)}` : (v || "—");
}
function fEIN(v: string): string {
  const c = v?.replace(/\D/g, "") ?? "";
  return c.length === 9 ? `${c.slice(0,2)}-${c.slice(2)}` : (v || "—");
}
function fDate(v: string): string {
  if (!v) return "—";
  const p = v.split("-");
  if (p.length >= 3) return `${p[1]}/${p[2]}/${p[0]}`;
  return v;
}
function fMoney(v: string): string {
  if (!v) return "—";
  const n = parseInt(v.replace(/[^0-9]/g, ""), 10);
  return isNaN(n) ? v : `$${n.toLocaleString()}`;
}
function fHousing(s: string): string {
  const map: Record<string, string> = {
    own: "Own", mortgage: "Mortgage", rent: "Rent",
    family: "Family / Other", other: "Other",
  };
  return map[s] || s || "—";
}
function val(v: string | undefined | null): string {
  return v && v.trim() ? v.trim() : "—";
}

// ─── Drawing Primitives ───────────────────────────────────────────────────────
type Doc = InstanceType<typeof PDFDocument>;

/**
 * Draw a single form field at absolute (x, y) with given width.
 * Renders: small gray LABEL → VALUE → underline.
 * Does NOT advance doc.y — caller manages y with ROW_H.
 */
function formField(doc: Doc, label: string, value: string, x: number, y: number, w: number): void {
  // Label
  doc.font("Helvetica").fontSize(6.5).fillColor(GRAY)
    .text(label, x + 1, y, { width: w - 1, lineBreak: false });
  // Value
  doc.font("Helvetica").fontSize(9.5).fillColor(DARK)
    .text(value || "—", x + 1, y + 9, { width: w - 1, lineBreak: false });
  // Underline beneath value
  doc.moveTo(x, y + 22)
    .lineTo(x + w, y + 22)
    .strokeColor(LGRAY).lineWidth(0.4).stroke();
}

/** Gold section header with top rule. Returns y after header. */
function sectionHeader(doc: Doc, y: number, title: string): number {
  doc.moveTo(MARGIN, y + 1).lineTo(PW - MARGIN, y + 1)
    .strokeColor(GOLD).lineWidth(1.2).stroke();
  doc.font("Helvetica-Bold").fontSize(8).fillColor(GOLD)
    .text(title, MARGIN, y + 5, { width: CW, lineBreak: false });
  return y + 20;
}

/** Light gray sub-section divider. Returns y after header. */
function subHeader(doc: Doc, y: number, title: string): number {
  doc.moveTo(MARGIN, y).lineTo(PW - MARGIN, y)
    .strokeColor(LGRAY).lineWidth(0.5).stroke();
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(GRAY)
    .text(title, MARGIN, y + 3, { width: CW, lineBreak: false });
  return y + 17;
}

/** Check if we need a page break; inserts one if so. Returns current y. */
function checkY(doc: Doc, y: number, needed = 40): number {
  if (y + needed > 748) {
    drawFooter(doc);
    doc.addPage();
    return 48;
  }
  return y;
}

/** Gold horizontal rule. */
function goldRule(doc: Doc, y: number) {
  doc.moveTo(MARGIN, y).lineTo(PW - MARGIN, y)
    .strokeColor(GOLD).lineWidth(0.75).stroke();
}

/** Light horizontal rule. */
function lightRule(doc: Doc, y: number) {
  doc.moveTo(MARGIN, y).lineTo(PW - MARGIN, y)
    .strokeColor(LGRAY).lineWidth(0.4).stroke();
}

// ─── Agreement Text (verbatim from PageAgreement.tsx) ─────────────────────────
const AGREEMENT_CLAUSES = [
  {
    title: "Your broker",
    body: "1 OF 1 AUTO INC. is helping you find, negotiate, and finalize your vehicle. We're not a dealer; we work directly with dealers on your behalf to get you better terms than you'd find on your own.",
  },
  {
    title: "The deposit",
    body: "A $99 Service Commitment Fee is due when you sign. This is applied toward what you'd pay for the service. It's refundable if we can't complete the deal on our side, and non-refundable if you decide to shop elsewhere after we've done the work.",
  },
  {
    title: "Working together",
    body: "While we're working on your deal, please let us handle dealer communications. Reaching out directly to dealers we've introduced can disrupt the deal structure. If something feels off, just call us first.",
  },
  {
    title: "What we don't control",
    body: "Financing approvals, manufacturer delays, dealer inventory, and DMV processing are handled by those parties. We'll advocate for you but can't guarantee their timelines.",
  },
  {
    title: "Timeframe",
    body: "This agreement is active for 30 days. Florida law governs, venue in Broward County.",
  },
];

// ─── Section Renderers ────────────────────────────────────────────────────────

function drawPersonSection(doc: Doc, p: PersonData, title: string): number {
  let y = doc.y;

  // Personal Info header
  y = checkY(doc, y, 160);
  y = sectionHeader(doc, y, title);

  // Row 1: Full Name | Date of Birth | Social Security No.
  y = checkY(doc, y, ROW_H);
  const name = [p.firstName, p.middleName, p.lastName].filter(Boolean).join(" ");
  formField(doc, "Full Name", val(name),                          MARGIN, y, NAME_W);
  formField(doc, "Date of Birth", fDate(p.dob),                  MARGIN + NAME_W + GAP, y, DOB_W);
  formField(doc, "Social Security No.", p.ssn ? fSSN(p.ssn) : "—",  MARGIN + NAME_W + DOB_W + 2 * GAP, y, SSN_W);
  y += ROW_H;

  // Row 2: Cell Phone | Email Address
  y = checkY(doc, y, ROW_H);
  formField(doc, "Cell Phone", p.phone ? fPhone(p.phone) : "—",  X2[0], y, C2);
  formField(doc, "Email Address", val(p.email),                  X2[1], y, C2);
  y += ROW_H;

  // Row 3: Home Address (full width)
  y = checkY(doc, y, ROW_H);
  formField(doc, "Home Address — as on Driver's License", val(p.licenseAddress), MARGIN, y, CW);
  y += ROW_H;

  // Row 4 (conditional): Registering Address
  if (p.registeringAddressSame === false && p.registeringAddress) {
    y = checkY(doc, y, ROW_H);
    formField(doc, "Registering Address (different from above)", val(p.registeringAddress), MARGIN, y, CW);
    y += ROW_H;
  }

  // Row 4/5: Time at Address | Housing Status | Monthly Housing Payment | Annual Income
  y = checkY(doc, y, ROW_H);
  const timeAt = [
    p.yearsAtAddress  && `${p.yearsAtAddress} yr`,
    p.monthsAtAddress && `${p.monthsAtAddress} mo`,
  ].filter(Boolean).join(" ") || "—";
  formField(doc, "Time at Address",        timeAt,                                      X4[0], y, C4);
  formField(doc, "Housing Status",         fHousing(p.housingStatus),                   X4[1], y, C4);
  formField(doc, "Mo. Housing Payment",    p.monthlyHousingPayment ? fMoney(p.monthlyHousingPayment) : "—", X4[2], y, C4);
  formField(doc, "Annual Income",          p.annualIncome ? fMoney(p.annualIncome) : "—", X4[3], y, C4_LAST);
  y += ROW_H;

  // Row 5: Monthly Income
  y = checkY(doc, y, ROW_H + 10);
  formField(doc, "Monthly Income", p.monthlyIncome ? fMoney(p.monthlyIncome) : "—", X2[0], y, C2);
  y += ROW_H + 6;

  // Employment sub-section — check for enough space to keep it together
  y = checkY(doc, y, 130);
  y = subHeader(doc, y, "EMPLOYMENT");

  // Row E1: Occupation | Employer Name
  y = checkY(doc, y, ROW_H);
  formField(doc, "Occupation",    val(p.occupation),    X2[0], y, C2);
  formField(doc, "Employer Name", val(p.employerName),  X2[1], y, C2);
  y += ROW_H;

  // Row E2: Employer Tel. | Employer Address
  y = checkY(doc, y, ROW_H);
  const empPhone = p.employerPhone ? fPhone(p.employerPhone) : "—";
  const empAddr  = [p.employerStreet, p.employerCity, p.employerState, p.employerZip]
    .filter(Boolean).join(", ") || "—";
  formField(doc, "Employer Tel.",     empPhone, MARGIN,            y, TEL_W);
  formField(doc, "Employer Address",  empAddr,  MARGIN + TEL_W + GAP, y, ADDR_W);
  y += ROW_H;

  // Row E3: Time with Employer
  y = checkY(doc, y, ROW_H);
  const timeWorked = [
    p.yearsWorked  && `${p.yearsWorked} yr`,
    p.monthsWorked && `${p.monthsWorked} mo`,
  ].filter(Boolean).join(" ") || "—";
  formField(doc, "Time with Employer", timeWorked, X2[0], y, C2);
  y += ROW_H + 4;

  doc.y = y;
  return y;
}

function drawBusinessSection(doc: Doc, b: BusinessData): number {
  let y = doc.y;
  y = checkY(doc, y, 200);
  y = sectionHeader(doc, y, "BUSINESS INFORMATION");

  // Row 1: Legal Business Name | Tax ID (EIN)
  y = checkY(doc, y, ROW_H);
  const bizNameW = Math.round(CW * 0.62);   // 330
  const einW     = CW - bizNameW - GAP;     // 192
  formField(doc, "Legal Business Name", val(b.legalName), MARGIN, y, bizNameW);
  formField(doc, "Tax ID (EIN)", b.ein ? fEIN(b.ein) : "—", MARGIN + bizNameW + GAP, y, einW);
  y += ROW_H;

  // Row 2: Business Address | Business Phone
  y = checkY(doc, y, ROW_H);
  const addrW2 = Math.round(CW * 0.62);
  const phoneW = CW - addrW2 - GAP;
  const bizAddrStreet = [b.address, b.suite && `Suite ${b.suite}`].filter(Boolean).join(", ");
  formField(doc, "Business Address",  val(bizAddrStreet),            MARGIN, y, addrW2);
  formField(doc, "Business Phone",    b.phone ? fPhone(b.phone) : "—", MARGIN + addrW2 + GAP, y, phoneW);
  y += ROW_H;

  // Row 3: City | State | ZIP | Date Established
  y = checkY(doc, y, ROW_H);
  const cityW  = 180;
  const stateW = 80;
  const zipW   = 80;
  const estW   = CW - cityW - stateW - zipW - 3 * GAP;  // 162
  formField(doc, "City",               val(b.city),             MARGIN, y, cityW);
  formField(doc, "State",              val(b.state),            MARGIN + cityW + GAP, y, stateW);
  formField(doc, "ZIP",                val(b.zip),              MARGIN + cityW + stateW + 2*GAP, y, zipW);
  formField(doc, "Date Established",   fDate(b.establishedDate), MARGIN + cityW + stateW + zipW + 3*GAP, y, estW);
  y += ROW_H;

  // Row 4: Title / Role | % Ownership | State of Incorporation
  y = checkY(doc, y, ROW_H);
  formField(doc, "Title / Role",            val(b.title),           X3[0], y, C3);
  formField(doc, "% Ownership",             b.ownershipPercent ? `${b.ownershipPercent}%` : "—", X3[1], y, C3);
  formField(doc, "State of Incorporation",  val(b.stateOfIncorporation), X3[2], y, C3_LAST);
  y += ROW_H;

  // Row 5: Years in Business | No. of Employees | P.O. Box
  y = checkY(doc, y, ROW_H);
  formField(doc, "Years in Business", val(b.yearsInBusiness), X3[0], y, C3);
  formField(doc, "No. of Employees",  val(b.numEmployees),    X3[1], y, C3);
  if (b.poBox) formField(doc, "P.O. Box", val(b.poBox),       X3[2], y, C3_LAST);
  y += ROW_H + 4;

  // Banking sub-section
  y = checkY(doc, y, 100);
  y = subHeader(doc, y, "BANKING INFORMATION");

  // Row B1: Bank Name | Checking Account #
  y = checkY(doc, y, ROW_H);
  formField(doc, "Bank Name",         val(b.bankName),          MARGIN, y, Math.round(CW * 0.62));
  formField(doc, "Checking Account #", val(b.bankAccountNumber), MARGIN + Math.round(CW * 0.62) + GAP, y, CW - Math.round(CW * 0.62) - GAP);
  y += ROW_H;

  // Row B2: Contact Name | Contact Phone
  y = checkY(doc, y, ROW_H);
  formField(doc, "Contact at Bank",   val(b.bankContactName),  X2[0], y, C2);
  formField(doc, "Contact Phone",     b.bankContactPhone ? fPhone(b.bankContactPhone) : "—", X2[1], y, C2);
  y += ROW_H + 4;

  doc.y = y;
  return y;
}

function drawAgreementSection(doc: Doc, application: ApplicationData): number {
  let y = doc.y;
  y = checkY(doc, y, 100);
  y = sectionHeader(doc, y, "AGREEMENT");

  for (const clause of AGREEMENT_CLAUSES) {
    y = checkY(doc, y, 30);
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(DARK)
      .text(`${clause.title} \u2014 `, MARGIN, y, { continued: true, width: CW });
    doc.font("Helvetica").fontSize(7.5).fillColor(GRAY)
      .text(clause.body, { continued: false, width: CW });
    y = doc.y + 4;
  }

  y += 12;

  const SIG_W  = 210;
  const SIG_H  = 60;
  const sigData = application.agreement.signatureData;
  const dateStr = new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });

  function drawSigBlock(sigX: number, label: string, date: string, useSig: boolean): void {
    if (useSig && sigData) {
      try {
        const buf = Buffer.from(sigData.replace(/^data:image\/\w+;base64,/, ""), "base64");
        doc.image(buf, sigX, y, { fit: [SIG_W, SIG_H] });
      } catch { /* not renderable */ }
    }
    const lineY = y + SIG_H + 3;
    doc.moveTo(sigX, lineY).lineTo(sigX + SIG_W, lineY)
      .strokeColor(LGRAY).lineWidth(0.4).stroke();
    doc.font("Helvetica").fontSize(7).fillColor(GRAY)
      .text(`${label}     Date: ${date}`, sigX, lineY + 3, { width: SIG_W, lineBreak: false });
  }

  if (application.mode === "co-applicant" && application.coApplicant) {
    // Two side-by-side signature blocks
    y = checkY(doc, y, SIG_H + 30);
    const coName = `${application.coApplicant.firstName} ${application.coApplicant.lastName}`;
    drawSigBlock(X2[0], `Applicant: ${application.primary.firstName} ${application.primary.lastName}`, dateStr, true);
    drawSigBlock(X2[1], `Co-Applicant: ${coName}`, dateStr, true);
    y = y + SIG_H + 22;

  } else if (application.mode === "business") {
    // Guarantor personal signature
    y = checkY(doc, y, SIG_H + 30);
    drawSigBlock(MARGIN, `Guarantor: ${application.primary.firstName} ${application.primary.lastName}`, dateStr, true);
    y = y + SIG_H + 22;

    // Corporate authorized signatory block (blank — for dealer/lender use)
    y = checkY(doc, y, 55);
    doc.font("Helvetica-Bold").fontSize(7).fillColor(GRAY)
      .text("AUTHORIZED BUSINESS SIGNATORY", MARGIN, y, { lineBreak: false });
    y += 12;
    const authSigW = 240;
    const authTitleW = CW - authSigW - GAP;
    doc.moveTo(MARGIN, y + 14).lineTo(MARGIN + authSigW, y + 14).strokeColor(LGRAY).lineWidth(0.4).stroke();
    doc.moveTo(MARGIN + authSigW + GAP, y + 14).lineTo(MARGIN + authSigW + GAP + authTitleW, y + 14).strokeColor(LGRAY).lineWidth(0.4).stroke();
    doc.font("Helvetica").fontSize(6.5).fillColor(GRAY)
      .text("Authorized Signature", MARGIN, y + 16, { lineBreak: false });
    doc.font("Helvetica").fontSize(6.5).fillColor(GRAY)
      .text("Title", MARGIN + authSigW + GAP, y + 16, { lineBreak: false });
    y += 32;
    doc.moveTo(MARGIN, y + 14).lineTo(MARGIN + 180, y + 14).strokeColor(LGRAY).lineWidth(0.4).stroke();
    doc.font("Helvetica").fontSize(6.5).fillColor(GRAY)
      .text("Date", MARGIN, y + 16, { lineBreak: false });
    y += 22;

  } else {
    // Individual: single signature block
    y = checkY(doc, y, SIG_H + 30);
    drawSigBlock(MARGIN, `Applicant: ${application.primary.firstName} ${application.primary.lastName}`, dateStr, true);
    y = y + SIG_H + 22;
  }

  doc.y = y;
  return y;
}

function drawHeader(doc: Doc): number {
  // Logo
  const logoCandidates = ["logo-new.png", "logo-dark.png", "logo-1of1.png", "logo-hero.png"];
  let logoDrawn = false;
  for (const name of logoCandidates) {
    try {
      const logoPath = path.join(process.cwd(), "public", name);
      if (fs.existsSync(logoPath)) {
        // Logo is a square PNG — use `width` (not `fit`) so rendered size
        // matches the centered x position exactly.
        const logoSize = 105;
        doc.image(logoPath, PW / 2 - logoSize / 2, 14, { width: logoSize });
        logoDrawn = true;
        break;
      }
    } catch { /* try next */ }
  }

  const titleY = logoDrawn ? 126 : 28;

  if (!logoDrawn) {
    doc.font("Helvetica-Bold").fontSize(20).fillColor(GOLD)
      .text("1 OF 1 AUTO", MARGIN, titleY - 28, { align: "center", width: CW });
  }

  doc.font("Helvetica-Bold").fontSize(13).fillColor(DARK)
    .text("CREDIT APPLICATION", MARGIN, titleY, { align: "center", width: CW });

  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  doc.font("Helvetica").fontSize(8).fillColor(GRAY)
    .text(dateStr, MARGIN, doc.y + 2, { align: "right", width: CW });

  const ruleY = doc.y + 4;
  goldRule(doc, ruleY);
  doc.y = ruleY + 12;
  return doc.y;
}

function drawFooter(doc: Doc) {
  const y = 756;
  goldRule(doc, y - 5);
  doc.font("Helvetica").fontSize(7).fillColor(GRAY)
    .text(
      "1 OF 1 AUTO INC.   \u2022   3113 Stirling Rd. (Suite 203), Fort Lauderdale, FL 33312   \u2022   Oneofoneauto@gmail.com   \u2022   954-770-1177",
      MARGIN, y + 1, { align: "center", width: CW, lineBreak: false }
    );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export async function generateApplicationPDF(application: ApplicationData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "letter",
      autoFirstPage: true,
      margins: { top: MARGIN, left: MARGIN, right: MARGIN, bottom: 0 },
    });
    const buffers: Buffer[] = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    drawHeader(doc);

    const mode = application.mode;

    if (mode === "business" && application.business) {
      drawBusinessSection(doc, application.business);
      doc.y += 6;
      lightRule(doc, doc.y);
      doc.y += 8;
      drawPersonSection(doc, application.primary, "GUARANTOR INFORMATION");
    } else if (mode === "co-applicant" && application.coApplicant) {
      drawPersonSection(doc, application.primary, "APPLICANT INFORMATION");
      doc.y += 6;
      lightRule(doc, doc.y);
      doc.y += 8;
      drawPersonSection(doc, application.coApplicant, "CO-APPLICANT INFORMATION");
    } else {
      drawPersonSection(doc, application.primary, "APPLICANT INFORMATION");
    }

    doc.y += 6;
    lightRule(doc, doc.y);
    doc.y += 8;
    drawAgreementSection(doc, application);

    drawFooter(doc);
    doc.end();
  });
}

// ─── Agreement PDF (standalone) ───────────────────────────────────────────────

export async function generateAgreementPDF(
  applicantName: string,
  signatureDataUrl: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "letter", margins: { top: MARGIN, left: MARGIN, right: MARGIN, bottom: 0 } });
    const buffers: Buffer[] = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    doc.font("Helvetica-Bold").fontSize(16).fillColor(DARK)
      .text("1 OF 1 AUTO INC.", MARGIN, 36, { align: "center", width: CW });
    doc.font("Helvetica").fontSize(11).fillColor(GRAY)
      .text("Service Agreement", MARGIN, doc.y + 2, { align: "center", width: CW });
    goldRule(doc, doc.y + 8);
    doc.y = doc.y + 20;

    for (const clause of AGREEMENT_CLAUSES) {
      doc.font("Helvetica-Bold").fontSize(9).fillColor(DARK)
        .text(`${clause.title} — `, MARGIN, doc.y, { continued: true, width: CW });
      doc.font("Helvetica").fontSize(9).fillColor(GRAY)
        .text(clause.body, { continued: false });
      doc.moveDown(0.6);
    }

    doc.moveDown(1);

    if (signatureDataUrl) {
      try {
        const buf = Buffer.from(signatureDataUrl.replace(/^data:image\/\w+;base64,/, ""), "base64");
        doc.image(buf, MARGIN, doc.y, { width: 220, height: 70 });
      } catch { /* skip */ }
    }
    const sigLineY = doc.y + 75;
    lightRule(doc, sigLineY);
    doc.font("Helvetica").fontSize(8).fillColor(GRAY)
      .text(`Applicant: ${applicantName}     Date: ${new Date().toLocaleDateString()}`,
        MARGIN, sigLineY + 4, { width: 300 });

    drawFooter(doc);
    doc.end();
  });
}

// ─── Charge Confirmation PDF ───────────────────────────────────────────────────

export async function generateChargeConfirmationPDF(
  applicantName: string,
  email: string,
  chargeAmount: number,
  transactionId: string,
  cardLast4: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "letter", margins: { top: MARGIN, left: MARGIN, right: MARGIN, bottom: 0 } });
    const buffers: Buffer[] = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    doc.font("Helvetica-Bold").fontSize(16).fillColor(DARK)
      .text("Payment Confirmation", MARGIN, 36, { align: "center", width: CW });
    doc.font("Helvetica").fontSize(10).fillColor(GRAY)
      .text("1 OF 1 AUTO INC. — Service Commitment Fee", MARGIN, doc.y + 2, { align: "center", width: CW });
    goldRule(doc, doc.y + 8);
    doc.y = doc.y + 20;

    doc.font("Helvetica-Bold").fontSize(12).fillColor(DARK).text("PAYMENT CONFIRMED");
    doc.moveDown(0.4);
    doc.font("Helvetica").fontSize(10).fillColor(DARK);
    doc.text(`Applicant: ${applicantName}`);
    doc.text(`Email: ${email}`);
    doc.moveDown(0.4);
    doc.font("Helvetica-Bold").fontSize(11).fillColor(DARK)
      .text(`Amount Charged: $${chargeAmount.toFixed(2)}`);
    doc.font("Helvetica").fontSize(10).fillColor(DARK);
    doc.text("Description: 1 OF 1 AUTO INC. Service Commitment Fee");
    doc.moveDown(0.4);
    doc.text(`Transaction ID: ${transactionId}`);
    doc.text(`Payment Method: Card ending in ${cardLast4}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.text(`Time: ${new Date().toLocaleTimeString()}`);
    doc.moveDown(0.8);

    doc.font("Helvetica-Bold").fontSize(8).fillColor(GRAY).text("TERMS:");
    doc.font("Helvetica").fontSize(8).fillColor(GRAY);
    doc.text("• This fee is applied toward your broker service engagement", { indent: 10 });
    doc.text("• Refundable if 1 OF 1 AUTO INC. cannot close your deal", { indent: 10 });
    doc.text("• Non-refundable if you withdraw or are declined after work has begun", { indent: 10 });

    drawFooter(doc);
    doc.end();
  });
}
