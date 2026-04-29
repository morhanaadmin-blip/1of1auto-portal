import PDFDocument from "pdfkit";
import type { ApplicationData } from "./types";

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
