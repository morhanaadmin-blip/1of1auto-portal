import PDFDocument from "pdfkit";
import * as fs from "fs";
import * as path from "path";
import type { ApplicationData, PersonData, BusinessData } from "./types";

// ─── Colors & Layout ────────────────────────────────────────────────────────
const GOLD   = "#C9A84C";
const DARK   = "#111111";
const GRAY   = "#666666";
const LGRAY  = "#CCCCCC";
const PW     = 612;                     // letter width (pt)
const MARGIN = 40;
const CW     = PW - MARGIN * 2;        // content width: 532
const COL_W  = (CW - 14) / 2;         // ~259 per column
const COL2_X = MARGIN + COL_W + 14;   // right column x

// ─── Format Helpers ──────────────────────────────────────────────────────────
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

// ─── Drawing Primitives ──────────────────────────────────────────────────────
type Doc = InstanceType<typeof PDFDocument>;

/** Draws a field (label above value). Returns y-position after field. */
function field(doc: Doc, label: string, value: string, x: number, y: number, w: number): number {
  doc.font("Helvetica").fontSize(7).fillColor(GRAY)
    .text(label, x, y, { width: w, lineBreak: false });
  const vy = doc.y + 1;
  doc.font("Helvetica").fontSize(10).fillColor(DARK)
    .text(value || "—", x, vy, { width: w });
  return doc.y + 4;
}

/** Two-column field row. Returns new y. */
function row(
  doc: Doc, y: number,
  lLabel: string, lVal: string,
  rLabel = "", rVal = ""
): number {
  const leftEnd = field(doc, lLabel, lVal, MARGIN, y, COL_W);
  const rightEnd = rLabel ? field(doc, rLabel, rVal, COL2_X, y, COL_W) : leftEnd;
  const bottom = Math.max(leftEnd, rightEnd);
  doc.y = bottom;
  return bottom;
}

/** Full-width single field row. Returns new y. */
function rowFull(doc: Doc, y: number, label: string, value: string): number {
  const end = field(doc, label, value, MARGIN, y, CW);
  doc.y = end;
  return end;
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

/** Bold section header with gold underline. Returns new y. */
function sectionHeader(doc: Doc, y: number, title: string): number {
  const yy = y + 6;
  doc.font("Helvetica-Bold").fontSize(9).fillColor(GOLD)
    .text(title, MARGIN, yy, { width: CW });
  const lineY = doc.y + 1;
  doc.moveTo(MARGIN, lineY).lineTo(PW - MARGIN, lineY)
    .strokeColor(GOLD).lineWidth(0.5).stroke();
  doc.y = lineY + 8;
  return doc.y;
}

/** Check if near page bottom; add page if so. Returns current y. */
function checkPage(doc: Doc): number {
  if (doc.y > 700) {
    drawFooter(doc);
    doc.addPage();
    // pdfkit resets cursor to top of new page automatically
  }
  return doc.y;
}

// ─── Agreement Text (verbatim from PageAgreement.tsx) ─────────────────────
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

// ─── Section Renderers ───────────────────────────────────────────────────────

function drawPersonSection(doc: Doc, p: PersonData, title: string): number {
  let y = checkPage(doc);
  y = sectionHeader(doc, y, title);

  const name = [p.firstName, p.middleName, p.lastName].filter(Boolean).join(" ");
  y = row(doc, y, "Full Name", val(name), "Date of Birth", fDate(p.dob));
  y = row(doc, y, "Social Security Number", p.ssn ? fSSN(p.ssn) : "—", "Cell Phone", p.phone ? fPhone(p.phone) : "—");
  y = rowFull(doc, y, "Email Address", val(p.email));
  y = rowFull(doc, y, "Home Address (as on Driver's License)", val(p.licenseAddress));

  if (p.registeringAddressSame === false && p.registeringAddress) {
    y = rowFull(doc, y, "Registering Address (different from DL)", val(p.registeringAddress));
  }

  const timeAt = [p.yearsAtAddress && `${p.yearsAtAddress} yr`, p.monthsAtAddress && `${p.monthsAtAddress} mo`]
    .filter(Boolean).join(" ") || "—";
  y = row(doc, y, "Time at Address", timeAt, "Housing Status", fHousing(p.housingStatus));
  y = row(doc, y, "Monthly Housing Payment", p.monthlyHousingPayment ? fMoney(p.monthlyHousingPayment) : "—",
    "Annual Income", p.annualIncome ? fMoney(p.annualIncome) : "—");

  y = row(doc, y, "Occupation", val(p.occupation), "Employer Name", val(p.employerName));

  const empPhone = p.employerPhone ? fPhone(p.employerPhone) : "—";
  const empAddr = [p.employerStreet, p.employerCity, p.employerState, p.employerZip]
    .filter(Boolean).join(", ") || "—";
  y = row(doc, y, "Employer Tel.", empPhone, "Employer Address", empAddr);

  const timeWorked = [p.yearsWorked && `${p.yearsWorked} yr`, p.monthsWorked && `${p.monthsWorked} mo`]
    .filter(Boolean).join(" ") || "—";
  y = row(doc, y, "Time with Employer", timeWorked, "", "");

  doc.y = y;
  return y;
}

function drawBusinessSection(doc: Doc, b: BusinessData): number {
  let y = checkPage(doc);
  y = sectionHeader(doc, y, "BUSINESS INFORMATION");

  y = row(doc, y, "Legal Business Name", val(b.legalName), "Tax ID (EIN)", b.ein ? fEIN(b.ein) : "—");
  y = row(doc, y, "Title / Role", val(b.title), "% Ownership", b.ownershipPercent ? `${b.ownershipPercent}%` : "—");
  y = row(doc, y, "Business Phone", b.phone ? fPhone(b.phone) : "—", "Date Business Established", fDate(b.establishedDate));
  y = row(doc, y, "State of Incorporation", val(b.stateOfIncorporation), "Years in Business", val(b.yearsInBusiness));
  y = row(doc, y, "Number of Employees", val(b.numEmployees), "", "");

  const bizAddr = [b.address, b.suite && `Suite ${b.suite}`, b.city, b.state, b.zip]
    .filter(Boolean).join(", ") || "—";
  y = rowFull(doc, y, "Business Address", bizAddr);
  if (b.poBox) y = rowFull(doc, y, "P.O. Box", b.poBox);

  // Banking sub-section
  y = checkPage(doc);
  y = sectionHeader(doc, y + 4, "BANKING INFORMATION");
  y = row(doc, y, "Bank Name", val(b.bankName), "Checking Account #", val(b.bankAccountNumber));
  y = row(doc, y, "Contact at Bank", val(b.bankContactName), "Contact Phone",
    b.bankContactPhone ? fPhone(b.bankContactPhone) : "—");

  doc.y = y;
  return y;
}

function drawAgreementSection(doc: Doc, application: ApplicationData): number {
  let y = checkPage(doc);
  y = sectionHeader(doc, y, "AGREEMENT");

  for (const clause of AGREEMENT_CLAUSES) {
    y = checkPage(doc);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(DARK)
      .text(`${clause.title} — `, MARGIN, y, { continued: true, width: CW });
    doc.font("Helvetica").fontSize(8).fillColor(GRAY)
      .text(clause.body, { continued: false });
    y = doc.y + 4;
  }

  // Signatures
  y = checkPage(doc);
  y += 10;

  const SIG_W = 220;
  const SIG_H = 65;
  const sigData = application.agreement.signatureData;

  // Draw applicant signature
  if (sigData) {
    try {
      const buf = Buffer.from(sigData.replace(/^data:image\/\w+;base64,/, ""), "base64");
      doc.image(buf, MARGIN, y, { width: SIG_W, height: SIG_H, fit: [SIG_W, SIG_H] });
    } catch { /* signature not renderable */ }
  }

  const sigLineY = y + SIG_H + 2;
  lightRule(doc, sigLineY);
  const sigLabel = application.mode === "business"
    ? `Guarantor: ${application.primary.firstName} ${application.primary.lastName}`
    : `Applicant: ${application.primary.firstName} ${application.primary.lastName}`;
  doc.font("Helvetica").fontSize(7).fillColor(GRAY)
    .text(`${sigLabel}     Date: ${new Date().toLocaleDateString()}`, MARGIN, sigLineY + 3, { width: SIG_W });

  // Co-applicant signature line (same signature data, or blank)
  if (application.mode === "co-applicant" && application.coApplicant) {
    if (sigData) {
      try {
        const buf = Buffer.from(sigData.replace(/^data:image\/\w+;base64,/, ""), "base64");
        doc.image(buf, COL2_X, y, { width: SIG_W, height: SIG_H, fit: [SIG_W, SIG_H] });
      } catch { /* skip */ }
    }
    doc.moveTo(COL2_X, sigLineY).lineTo(COL2_X + SIG_W, sigLineY)
      .strokeColor(LGRAY).lineWidth(0.4).stroke();
    const coName = `${application.coApplicant.firstName} ${application.coApplicant.lastName}`;
    doc.font("Helvetica").fontSize(7).fillColor(GRAY)
      .text(`Co-Applicant: ${coName}     Date: ${new Date().toLocaleDateString()}`,
        COL2_X, sigLineY + 3, { width: SIG_W });
  }

  y = sigLineY + 22;
  doc.y = y;
  return y;
}

function drawHeader(doc: Doc): number {
  // Logo
  const logoCandidates = ["logo-dark.png", "logo-1of1.png", "logo-hero.png"];
  let logoDrawn = false;
  for (const name of logoCandidates) {
    try {
      const logoPath = path.join(process.cwd(), "public", name);
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, PW / 2 - 75, 28, { fit: [150, 55] });
        logoDrawn = true;
        break;
      }
    } catch { /* try next */ }
  }

  const titleY = logoDrawn ? 90 : 28;

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
  // lineBreak: false prevents text overflow from triggering a new page (avoids pageAdded loop)
  doc.font("Helvetica").fontSize(7).fillColor(GRAY)
    .text(
      "1 OF 1 AUTO INC.   \u2022   3113 Stirling Rd. (Suite 203), Fort Lauderdale, FL 33312   \u2022   Oneofoneauto@gmail.com   \u2022   954-770-1177",
      MARGIN, y + 1, { align: "center", width: CW, lineBreak: false }
    );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export async function generateApplicationPDF(application: ApplicationData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "letter",
      autoFirstPage: true,
      // bottom: 0 so we can draw the footer at y=756 without pdfkit auto-creating a new page
      margins: { top: MARGIN, left: MARGIN, right: MARGIN, bottom: 0 },
    });
    const buffers: Buffer[] = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // Header
    drawHeader(doc);

    const mode = application.mode;

    if (mode === "business" && application.business) {
      // Business application + guarantor (primary = guarantor)
      drawBusinessSection(doc, application.business);
      doc.y += 6;
      lightRule(doc, doc.y);
      drawPersonSection(doc, application.primary, "GUARANTOR INFORMATION");
    } else if (mode === "co-applicant" && application.coApplicant) {
      // Individual + co-applicant
      drawPersonSection(doc, application.primary, "APPLICANT INFORMATION");
      doc.y += 6;
      lightRule(doc, doc.y);
      drawPersonSection(doc, application.coApplicant, "CO-APPLICANT INFORMATION");
    } else {
      // Individual only
      drawPersonSection(doc, application.primary, "APPLICANT INFORMATION");
    }

    // Agreement + signatures
    doc.y += 6;
    lightRule(doc, doc.y);
    drawAgreementSection(doc, application);

    // Footer on first page (pageAdded fires for additional pages only)
    drawFooter(doc);

    doc.end();
  });
}

// ─── Agreement PDF (standalone) ──────────────────────────────────────────────

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

    // Header
    doc.font("Helvetica-Bold").fontSize(16).fillColor(DARK)
      .text("1 OF 1 AUTO INC.", MARGIN, 36, { align: "center", width: CW });
    doc.font("Helvetica").fontSize(11).fillColor(GRAY)
      .text("Service Agreement", MARGIN, doc.y + 2, { align: "center", width: CW });
    goldRule(doc, doc.y + 8);
    doc.y = doc.y + 20;

    // Agreement clauses
    for (const clause of AGREEMENT_CLAUSES) {
      doc.font("Helvetica-Bold").fontSize(9).fillColor(DARK)
        .text(`${clause.title} — `, MARGIN, doc.y, { continued: true, width: CW });
      doc.font("Helvetica").fontSize(9).fillColor(GRAY)
        .text(clause.body, { continued: false });
      doc.moveDown(0.6);
    }

    doc.moveDown(1);

    // Signature
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

    // Footer
    drawFooter(doc);
    doc.end();
  });
}

// ─── Charge Confirmation PDF ──────────────────────────────────────────────────

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
