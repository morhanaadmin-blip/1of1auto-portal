import PDFDocument from "pdfkit";
import type { ApplicationData } from "./types";

export async function generateAgreementPDF(
  applicantName: string,
  signatureDataUrl: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "letter" });
    const buffers: Buffer[] = [];

    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // Header
    doc.fontSize(16).font("Helvetica-Bold").text("1 OF 1 AUTO", { align: "center" });
    doc.fontSize(11).font("Helvetica").text("Credit Application Agreement", { align: "center" });
    doc.moveDown(0.5);

    // Agreement Text
    doc.fontSize(9).font("Helvetica");
    const agreementText = `This Credit Application Agreement ("Agreement") is entered into by and between 1 OF 1 AUTO, Inc. ("Company") and the undersigned applicant(s) ("Applicant").

1. APPLICATION ACKNOWLEDGMENT
The Applicant acknowledges that they have completed and submitted a credit application to Company. The Applicant certifies that all information provided in the application is true, accurate, and complete to the best of their knowledge.

2. AUTHORIZATION
The Applicant authorizes Company to:
• Verify employment, income, and residency information
• Request and review credit reports from credit bureaus
• Contact references and employers as needed
• Conduct any additional investigations necessary

3. PAYMENT OF ENGAGEMENT FEE
The Applicant acknowledges receipt of a $99 Service Commitment Fee, which is:
• Applied toward broker services
• Refundable if Company cannot close the deal
• Non-refundable if the Applicant withdraws or is declined

4. AGREEMENT TO TERMS
The Applicant agrees to all terms and conditions outlined by Company. The Applicant understands that approval is not guaranteed and is subject to credit review and verification of information.

5. SIGNATURE ACKNOWLEDGMENT
By signing below, the Applicant confirms they have read and understand all terms of this Agreement and authorize Company to proceed with their application.`;

    doc.text(agreementText, { width: 480, align: "left" });
    doc.moveDown(1);

    // Signature Section
    doc.fontSize(10).font("Helvetica-Bold").text("APPLICANT SIGNATURE", { underline: true });
    doc.moveDown(0.5);

    // Add signature image
    if (signatureDataUrl) {
      try {
        const buffer = Buffer.from(
          signatureDataUrl.replace(/^data:image\/\w+;base64,/, ""),
          "base64"
        );
        doc.image(buffer, { width: 200, height: 80 });
      } catch {
        doc.text("[Signature not available]");
      }
    }

    doc.moveDown(0.5);
    doc.fontSize(9).text(`Applicant: ${applicantName}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);

    // Footer
    doc.moveDown(1);
    doc.fontSize(7).text("1 OF 1 AUTO • 954-770-1177 • www.1of1auto.com", { align: "center" });

    doc.end();
  });
}

export async function generateChargeConfirmationPDF(
  applicantName: string,
  email: string,
  chargeAmount: number,
  transactionId: string,
  cardLast4: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "letter" });
    const buffers: Buffer[] = [];

    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // Header
    doc.fontSize(16).font("Helvetica-Bold").text("Payment Confirmation", { align: "center" });
    doc.fontSize(10).font("Helvetica").text("1 OF 1 AUTO Service Commitment Fee", { align: "center" });
    doc.moveDown(1);

    // Confirmation Details
    doc.fontSize(11).font("Helvetica-Bold").text("PAYMENT CONFIRMED");
    doc.fontSize(10).font("Helvetica");
    doc.moveDown(0.3);

    doc.text(`Applicant: ${applicantName}`);
    doc.text(`Email: ${email}`);
    doc.moveDown(0.5);

    doc.text(`Amount Charged: $${chargeAmount.toFixed(2)}`, { underline: true });
    doc.text(`Description: 1 OF 1 AUTO Service Commitment Fee`);
    doc.moveDown(0.5);

    doc.text(`Transaction ID: ${transactionId}`);
    doc.text(`Payment Method: Credit Card ending in ${cardLast4}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.text(`Time: ${new Date().toLocaleTimeString()}`);
    doc.moveDown(0.5);

    // Terms
    doc.fontSize(9).font("Helvetica");
    doc.text("TERMS:");
    doc.fontSize(8).font("Helvetica");
    doc.text("• This fee is applied toward your broker service engagement", { indent: 10 });
    doc.text("• Refundable if Company cannot close your deal", { indent: 10 });
    doc.text("• Non-refundable if you withdraw or are declined", { indent: 10 });
    doc.moveDown(1);

    // Footer
    doc.fontSize(7).text("1 OF 1 AUTO • 954-770-1177 • www.1of1auto.com", { align: "center" });
    doc.text("This is an automatic confirmation. No action is required.", { align: "center" });

    doc.end();
  });
}

export async function generateApplicationPDF(
  application: ApplicationData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "letter" });
    const buffers: Buffer[] = [];

    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    const p = application.primary;

    // Header
    doc.fontSize(20).font("Helvetica-Bold").text("1 OF 1 AUTO", { align: "center" });
    doc.fontSize(12).font("Helvetica").text("Credit Application", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(9).text(`Date: ${new Date().toLocaleDateString()}`, { align: "right" });
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(1);

    // Primary Applicant
    doc.fontSize(12).font("Helvetica-Bold").text("PRIMARY APPLICANT");
    doc.fontSize(10).font("Helvetica");
    doc.text(`Name: ${p.firstName} ${p.middleName} ${p.lastName}`);
    doc.text(`Date of Birth: ${p.dob}`);
    doc.text(`Email: ${p.email}`);
    doc.text(`Phone: ${p.phone}`);
    doc.moveDown(0.5);

    // Address Information
    doc.fontSize(12).font("Helvetica-Bold").text("ADDRESS INFORMATION");
    doc.fontSize(10).font("Helvetica");
    doc.text(`License Address: ${p.licenseAddress}`);
    doc.text(
      `Registering Address: ${
        p.registeringAddressSame === false ? p.registeringAddress : "Same as license"
      }`
    );
    doc.moveDown(0.5);

    // Housing
    doc.fontSize(12).font("Helvetica-Bold").text("HOUSING");
    doc.fontSize(10).font("Helvetica");
    doc.text(`Status: ${p.housingStatus}`);
    doc.text(
      `Years at Address: ${p.yearsAtAddress}y ${p.monthsAtAddress}m`
    );
    doc.text(`Monthly Payment: $${p.monthlyHousingPayment}/mo`);
    doc.moveDown(0.5);

    // Employment
    doc.fontSize(12).font("Helvetica-Bold").text("EMPLOYMENT");
    doc.fontSize(10).font("Helvetica");
    doc.text(`Occupation: ${p.occupation}`);
    doc.text(`Employer: ${p.employerName}`);
    doc.text(`Years Employed: ${p.yearsWorked}y ${p.monthsWorked}m`);
    doc.moveDown(0.5);

    // Income
    doc.fontSize(12).font("Helvetica-Bold").text("INCOME");
    doc.fontSize(10).font("Helvetica");
    doc.text(`Annual Income: $${p.annualIncome}/yr`);
    doc.text(`Monthly Income: $${p.monthlyIncome}/mo`);
    doc.moveDown(0.5);

    // Co-Applicant (if applicable)
    if (application.mode === "co-applicant" && application.coApplicant) {
      const c = application.coApplicant;
      doc.fontSize(12).font("Helvetica-Bold").text("CO-APPLICANT");
      doc.fontSize(10).font("Helvetica");
      doc.text(`Name: ${c.firstName} ${c.lastName}`);
      doc.text(`Occupation: ${c.occupation}`);
      doc.text(`Employer: ${c.employerName}`);
      doc.text(`Annual Income: $${c.annualIncome}/yr`);
      doc.moveDown(0.5);
    }

    // Business (if applicable)
    if (application.mode === "business" && application.business) {
      const b = application.business;
      doc.fontSize(12).font("Helvetica-Bold").text("BUSINESS INFORMATION");
      doc.fontSize(10).font("Helvetica");
      doc.text(`Legal Name: ${b.legalName}`);
      doc.text(`Title: ${b.title}`);
      doc.text(`Ownership: ${b.ownershipPercent}%`);
      doc.text(`EIN: ${b.ein}`);
      doc.text(`Years in Business: ${b.yearsInBusiness}`);
      doc.text(`Bank: ${b.bankName}`);
      doc.moveDown(0.5);
    }

    // Documents
    doc.fontSize(12).font("Helvetica-Bold").text("DOCUMENTS");
    doc.fontSize(10).font("Helvetica");
    const docs = application.documents;
    doc.text(`Insurance: ${docs.insurance ? "Uploaded" : docs.insuranceOptional ? "Waived" : "Not provided"}`);
    doc.text(`Registration: ${docs.registration ? "Uploaded" : docs.registrationOptional ? "Waived" : "Not provided"}`);
    doc.text(`Driver License Photo: ${docs.driverLicensePhoto ? "Uploaded" : "Not provided"}`);
    doc.moveDown(0.5);

    // Agreement & Deposit
    doc.fontSize(12).font("Helvetica-Bold").text("APPLICATION STATUS");
    doc.fontSize(10).font("Helvetica");
    doc.text(`Agreement Signed: ${application.agreement.agreed ? "Yes" : "No"}`);
    doc.text(`Deposit Paid: ${application.depositPaid ? "Yes ($99)" : "No"}`);
    doc.moveDown(1);

    // Footer
    doc.fontSize(8).text("1 OF 1 AUTO • 954-770-1177 • www.1of1auto.com", { align: "center" });

    doc.end();
  });
}
