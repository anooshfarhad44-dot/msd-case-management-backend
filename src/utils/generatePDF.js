const PDFDocument = require("pdfkit");
const fs          = require("fs");
const path        = require("path");

const FIRM_NAME    = "Masaud Solicitors";
const FIRM_ADDRESS = "1 Legal Street, London EC1A 1BB";
const FIRM_TEL     = "+44 20 0000 0000";
const FIRM_EMAIL   = "office@msdsolicitors.co.uk";
const FIRM_SRA     = "SRA Regulated";

const UPLOAD_DIR = path.join(__dirname, "../../uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function drawHeader(doc) {
  // Firm name
  doc.fontSize(18).font("Helvetica-Bold").fillColor("#1e40af").text(FIRM_NAME, 50, 50);
  doc.fontSize(9).font("Helvetica").fillColor("#64748b")
    .text(`${FIRM_ADDRESS} | Tel: ${FIRM_TEL}`, 50, 72)
    .text(`${FIRM_EMAIL} | ${FIRM_SRA}`, 50, 84);

  // Divider line
  doc.moveTo(50, 100).lineTo(550, 100).lineWidth(1).strokeColor("#e2e8f0").stroke();
  doc.moveDown(2);
}

function drawSection(doc, title) {
  doc.moveDown(0.5);
  doc.fontSize(10).font("Helvetica-Bold").fillColor("#1e40af").text(title.toUpperCase());
  doc.moveTo(50, doc.y + 2).lineTo(550, doc.y + 2).lineWidth(0.5).strokeColor("#e2e8f0").stroke();
  doc.moveDown(0.5);
}

function drawRow(doc, label, value) {
  const y = doc.y;
  doc.fontSize(9).font("Helvetica-Bold").fillColor("#374151").text(label, 50, y, { width: 150, continued: false });
  doc.fontSize(9).font("Helvetica").fillColor("#111827").text(value || "—", 210, y, { width: 330 });
  doc.moveDown(0.3);
}

function drawFooter(doc, pageNum) {
  const bottom = doc.page.height - 40;
  doc.fontSize(8).font("Helvetica").fillColor("#94a3b8")
    .text(`${FIRM_NAME} · Confidential`, 50, bottom, { align: "left" })
    .text(`Page ${pageNum}`, 0, bottom, { align: "right" });
}

function now() {
  return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

// ─── Templates ────────────────────────────────────────────────────────────────

function clientCareLetter(doc, d) {
  drawHeader(doc);

  doc.fontSize(9).font("Helvetica").fillColor("#111827").text(now(), 50);
  doc.moveDown(0.5);
  doc.fontSize(9).text(`Dear ${d.clientName || "Client"},`);
  doc.moveDown(0.5);

  doc.fontSize(11).font("Helvetica-Bold").fillColor("#1e40af")
    .text(`RE: ${d.matterType || "Your Legal Matter"} — File Ref: ${d.caseRef || "TBC"}`);
  doc.moveDown(0.3);

  // Underline title
  doc.moveTo(50, doc.y).lineTo(400, doc.y).lineWidth(1).strokeColor("#1e40af").stroke();
  doc.moveDown(0.8);

  doc.fontSize(12).font("Helvetica-Bold").fillColor("#111827").text("CLIENT CARE LETTER");
  doc.moveDown(0.5);

  drawSection(doc, "Your Case Handler");
  doc.fontSize(9).font("Helvetica").fillColor("#111827")
    .text(`${d.caseworkerName || "Your Case Handler"} will be responsible for your matter day to day. Should you have any queries please do not hesitate to contact them directly.`);

  drawSection(doc, "Our Charges");
  doc.fontSize(9).font("Helvetica").fillColor("#111827")
    .text(`Our agreed fixed fee for this matter is ${d.fee ? `£${d.fee}` : "as discussed"}. This is inclusive of all correspondence, preparation of documents, and routine disbursements unless otherwise stated.`);
  if (d.paymentMilestones) {
    doc.moveDown(0.3);
    doc.text(`Payment milestones: ${d.paymentMilestones}`);
  }

  drawSection(doc, "Scope of Work");
  doc.fontSize(9).font("Helvetica").fillColor("#111827")
    .text(d.scopeOfWork || "Full representation including preparation of application, supporting documents, correspondence with UKVI/Court and updates throughout the process.");

  drawSection(doc, "Next Steps");
  doc.fontSize(9).font("Helvetica").fillColor("#111827")
    .text(d.nextSteps || "We will be in touch shortly to confirm next steps and required documents.");

  drawSection(doc, "Complaints Policy");
  doc.fontSize(9).font("Helvetica").fillColor("#111827")
    .text("If you have any concerns about our service, please contact our complaints officer at complaints@msdsolicitors.co.uk. We aim to resolve all complaints within 8 weeks.");

  doc.moveDown(1);
  doc.fontSize(9).font("Helvetica").fillColor("#111827")
    .text("Yours sincerely,");
  doc.moveDown(1.5);
  doc.fontSize(9).font("Helvetica-Bold").text(d.caseworkerName || "Case Handler");
  doc.fontSize(9).font("Helvetica").text(FIRM_NAME);
  doc.moveDown(0.5);
  doc.fontSize(8).fillColor("#94a3b8")
    .text("This letter is confidential and intended solely for the addressee.");
}

function engagementLetter(doc, d) {
  drawHeader(doc);

  doc.fontSize(9).font("Helvetica").fillColor("#111827").text(now());
  doc.moveDown(0.5);

  doc.fontSize(12).font("Helvetica-Bold").fillColor("#111827").text("ENGAGEMENT LETTER");
  doc.moveDown(0.5);

  drawSection(doc, "Client Details");
  drawRow(doc, "Client Name", d.clientName);
  drawRow(doc, "Matter Type", d.matterType);
  drawRow(doc, "File Reference", d.caseRef);
  drawRow(doc, "Date of Engagement", now());

  drawSection(doc, "Scope of Work");
  doc.fontSize(9).font("Helvetica").fillColor("#111827")
    .text(d.scopeOfWork || "Full legal representation for the matter described above.");

  drawSection(doc, "Fees");
  drawRow(doc, "Fixed Fee", d.fee ? `£${d.fee}` : "As agreed");
  drawRow(doc, "VAT", "Applicable at standard rate where applicable");
  drawRow(doc, "Disbursements", "Payable in addition to the fixed fee");

  drawSection(doc, "Terms & Conditions");
  doc.fontSize(9).font("Helvetica").fillColor("#111827")
    .text("By proceeding with instructions you confirm you have read and accepted our standard terms and conditions available at msdsolicitors.co.uk/terms.");

  doc.moveDown(2);
  doc.fontSize(9).font("Helvetica-Bold").text("Signed for and on behalf of Masaud Solicitors:");
  doc.moveDown(1.5);
  doc.moveTo(50, doc.y).lineTo(250, doc.y).lineWidth(0.5).strokeColor("#374151").stroke();
  doc.moveDown(0.2);
  doc.fontSize(8).font("Helvetica").fillColor("#94a3b8").text("Authorised Signatory");
}

function gdprConsent(doc, d) {
  drawHeader(doc);

  doc.fontSize(12).font("Helvetica-Bold").fillColor("#111827").text("DATA PROTECTION & GDPR CONSENT FORM");
  doc.moveDown(0.5);

  doc.fontSize(9).font("Helvetica").fillColor("#111827").text(`Date: ${now()}`);
  doc.moveDown(0.3);
  drawRow(doc, "Client Name", d.clientName);
  drawRow(doc, "Matter", d.matterType);
  doc.moveDown(0.5);

  drawSection(doc, "Data Controller");
  doc.fontSize(9).font("Helvetica").fillColor("#111827")
    .text(`${FIRM_NAME}, ${FIRM_ADDRESS}`);

  drawSection(doc, "Data We Collect");
  doc.fontSize(9).font("Helvetica").fillColor("#111827")
    .text("Name, address, date of birth, contact details, financial information, immigration history, and other information relevant to your legal matter.");

  drawSection(doc, "How We Use Your Data");
  doc.fontSize(9).font("Helvetica").fillColor("#111827")
    .text("To provide legal services, comply with our regulatory obligations (including AML/CDD checks), communicate with UKVI and courts, and manage billing.");

  drawSection(doc, "Your Rights (UK GDPR)");
  doc.fontSize(9).font("Helvetica").fillColor("#111827")
    .text("Right of access · Right to rectification · Right to erasure · Right to portability · Right to object. Contact dpo@msdsolicitors.co.uk to exercise your rights.");

  drawSection(doc, "Marketing Consent");
  doc.fontSize(9).font("Helvetica").fillColor("#111827")
    .text(`Marketing communications: ${d.marketingConsent ? "✓ Client has consented to receive relevant updates." : "✗ Client has not consented to marketing communications."}`);

  doc.moveDown(1.5);
  const sigY = doc.y;
  doc.fontSize(9).font("Helvetica-Bold").text("Client Signature:", 50, sigY);
  doc.moveTo(170, sigY + 10).lineTo(350, sigY + 10).lineWidth(0.5).strokeColor("#374151").stroke();
  doc.fontSize(9).font("Helvetica-Bold").text("Date:", 370, sigY);
  doc.moveTo(400, sigY + 10).lineTo(550, sigY + 10).lineWidth(0.5).strokeColor("#374151").stroke();
}

function amlChecklist(doc, d) {
  drawHeader(doc);

  doc.fontSize(12).font("Helvetica-Bold").fillColor("#111827").text("AML / CDD COMPLIANCE CHECKLIST");
  doc.moveDown(0.5);

  drawSection(doc, "Matter Information");
  drawRow(doc, "Client",      d.clientName);
  drawRow(doc, "Matter Type", d.matterType);
  drawRow(doc, "File Ref",    d.caseRef);
  drawRow(doc, "Caseworker",  d.caseworkerName);
  drawRow(doc, "Date",        now());

  drawSection(doc, "Identity Verification");
  const idVerified = d.identityVerified;
  doc.fontSize(9).font("Helvetica").fillColor("#111827")
    .text(`${idVerified ? "☑" : "☐"}  Identity document viewed and certified copy taken`);
  drawRow(doc, "Document Type",   d.identityDocType || "—");
  drawRow(doc, "Document Expiry", d.identityDocExpiry || "—");
  drawRow(doc, "Certified by",    d.caseworkerName || "—");

  drawSection(doc, "Source of Funds");
  doc.fontSize(9).font("Helvetica").fillColor("#111827")
    .text(`☑  Source of funds established and recorded`);
  drawRow(doc, "Details", d.sourceOfFunds || "Not recorded");

  drawSection(doc, "PEP & Sanctions Screening");
  const riskColour = d.amlStatus === "high" ? "#dc2626" : d.amlStatus === "medium" ? "#d97706" : "#16a34a";
  doc.fontSize(9).font("Helvetica").fillColor("#111827")
    .text(`☑  Screening completed`);
  drawRow(doc, "Result",         d.amlStatus?.toUpperCase() || "CLEAR");
  drawRow(doc, "Screening Ref",  d.screeningRef || "—");
  drawRow(doc, "Screening Date", now());
  doc.fontSize(9).font("Helvetica-Bold").fillColor(riskColour)
    .text(`Overall Risk Rating: ${(d.risk || "low").toUpperCase()}`);
  doc.fillColor("#111827");

  drawSection(doc, "Supervision Cadence");
  drawRow(doc, "Cadence", d.supervisionCadence || "Monthly");

  doc.moveDown(1.5);
  const sigY = doc.y;
  doc.fontSize(9).font("Helvetica-Bold").text("Completed by:", 50, sigY);
  doc.moveTo(150, sigY + 10).lineTo(300, sigY + 10).lineWidth(0.5).strokeColor("#374151").stroke();
  doc.fontSize(9).font("Helvetica-Bold").text("Supervised by:", 320, sigY);
  doc.moveTo(420, sigY + 10).lineTo(550, sigY + 10).lineWidth(0.5).strokeColor("#374151").stroke();
}

function instructionSummary(doc, d) {
  drawHeader(doc);

  doc.fontSize(12).font("Helvetica-Bold").fillColor("#111827").text("MATTER SUMMARY SHEET");
  doc.moveDown(0.5);

  drawSection(doc, "Case Details");
  drawRow(doc, "File Reference", d.caseRef);
  drawRow(doc, "Matter Type",    d.matterType);
  drawRow(doc, "Stage",          d.stage || "Initial Assessment");
  drawRow(doc, "Priority",       d.priority || "Normal");
  drawRow(doc, "Risk Level",     d.risk || "Low");
  drawRow(doc, "Date Opened",    now());

  drawSection(doc, "Client Details");
  drawRow(doc, "Name",        d.clientName);
  drawRow(doc, "Email",       d.clientEmail);
  drawRow(doc, "Phone",       d.clientPhone);
  drawRow(doc, "Nationality", d.nationality);

  drawSection(doc, "Financial Summary");
  drawRow(doc, "Fixed Fee",    d.fee ? `£${d.fee}` : "TBC");
  drawRow(doc, "Paid to Date", d.paid ? `£${d.paid}` : "£0");
  drawRow(doc, "Outstanding",  d.outstanding ? `£${d.outstanding}` : "TBC");

  drawSection(doc, "Key Dates");
  drawRow(doc, "Key Date",     d.keyDate || "TBC");
  drawRow(doc, "Hearing Date", d.hearingDate || "N/A");

  drawSection(doc, "Assigned Team");
  drawRow(doc, "Caseworker", d.caseworkerName);
  drawRow(doc, "Supervisor", d.supervisorName);
}

// ─── Main export ──────────────────────────────────────────────────────────────

async function generatePDF(template, data) {
  return new Promise((resolve, reject) => {
    const doc      = new PDFDocument({ margin: 50, size: "A4" });
    const fileName = `${template}_${Date.now()}.pdf`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    const stream   = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Render template
    switch (template) {
      case "client_care_letter":  clientCareLetter(doc, data);    break;
      case "engagement_letter":   engagementLetter(doc, data);    break;
      case "gdpr_consent":        gdprConsent(doc, data);         break;
      case "aml_checklist":       amlChecklist(doc, data);        break;
      case "instruction_summary": instructionSummary(doc, data);  break;
      default:
        doc.fontSize(12).text(`Template "${template}" not found.`);
    }

    drawFooter(doc, 1);
    doc.end();

    stream.on("finish", () => resolve({ filePath, fileName, mimeType: "application/pdf" }));
    stream.on("error",  reject);
  });
}

module.exports = { generatePDF };
