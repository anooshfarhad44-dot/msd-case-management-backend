const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, SpacingType, UnderlineType,
} = require("docx");
const fs   = require("fs");
const path = require("path");

const UPLOAD_DIR = path.join(__dirname, "../../uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const FIRM_NAME    = "Masaud Solicitors";
const FIRM_ADDRESS = "1 Legal Street, London EC1A 1BB | Tel: +44 20 0000 0000";
const FIRM_EMAIL   = "office@msdsolicitors.co.uk | SRA Regulated";
const BLUE         = "1E40AF";
const GREY         = "64748B";

function now() {
  return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

// ─── Shared components ────────────────────────────────────────────────────────

function firmHeader() {
  return [
    new Paragraph({
      children: [new TextRun({ text: FIRM_NAME, bold: true, size: 36, color: BLUE })],
    }),
    new Paragraph({
      children: [new TextRun({ text: FIRM_ADDRESS, size: 18, color: GREY })],
    }),
    new Paragraph({
      children: [new TextRun({ text: FIRM_EMAIL, size: 18, color: GREY })],
    }),
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "E2E8F0" } },
      spacing: { after: 200 },
    }),
  ];
}

function sectionHeading(title) {
  return new Paragraph({
    children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 20, color: BLUE })],
    spacing: { before: 300, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: "E2E8F0" } },
  });
}

function rowParagraph(label, value) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 18 }),
      new TextRun({ text: value || "—", size: 18 }),
    ],
    spacing: { after: 80 },
  });
}

function bodyText(text) {
  return new Paragraph({
    children: [new TextRun({ text: text || "", size: 18 })],
    spacing: { after: 120 },
  });
}

function signatureLine(label, x = 0) {
  return [
    new Paragraph({
      children: [new TextRun({ text: `${label}:`, bold: true, size: 18 })],
      spacing: { before: 400, after: 40 },
    }),
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: "374151" } },
      spacing: { after: 60 },
    }),
  ];
}

// ─── Templates ────────────────────────────────────────────────────────────────

function clientCareLetter(d) {
  return [
    ...firmHeader(),
    new Paragraph({ children: [new TextRun({ text: now(), size: 18 })], spacing: { after: 160 } }),
    new Paragraph({ children: [new TextRun({ text: `Dear ${d.clientName || "Client"},`, size: 18 })], spacing: { after: 160 } }),
    new Paragraph({
      children: [
        new TextRun({ text: `RE: ${d.matterType || "Your Legal Matter"} — File Ref: ${d.caseRef || "TBC"}`, bold: true, size: 20, color: BLUE }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "CLIENT CARE LETTER", bold: true, size: 24, underline: { type: UnderlineType.SINGLE } })],
      spacing: { after: 200 },
    }),
    sectionHeading("Your Case Handler"),
    bodyText(`${d.caseworkerName || "Your Case Handler"} will be responsible for your matter day to day. Should you have any queries please do not hesitate to contact them directly.`),
    sectionHeading("Our Charges"),
    bodyText(`Our agreed fixed fee for this matter is ${d.fee ? `£${d.fee}` : "as discussed"}. This is inclusive of all correspondence, preparation of documents, and routine disbursements unless otherwise stated.`),
    sectionHeading("Scope of Work"),
    bodyText(d.scopeOfWork || "Full representation including preparation of application, supporting documents, correspondence with UKVI/Court and updates throughout the process."),
    sectionHeading("Next Steps"),
    bodyText(d.nextSteps || "We will be in touch shortly to confirm next steps and required documents."),
    sectionHeading("Complaints Policy"),
    bodyText("If you have any concerns about our service, please contact our complaints officer at complaints@msdsolicitors.co.uk. We aim to resolve all complaints within 8 weeks."),
    new Paragraph({ children: [new TextRun({ text: "Yours sincerely,", size: 18 })], spacing: { before: 400, after: 400 } }),
    new Paragraph({ children: [new TextRun({ text: d.caseworkerName || "Case Handler", bold: true, size: 18 })], spacing: { after: 60 } }),
    new Paragraph({ children: [new TextRun({ text: FIRM_NAME, size: 18 })], spacing: { after: 80 } }),
    new Paragraph({ children: [new TextRun({ text: "This letter is confidential and intended solely for the addressee.", size: 16, color: GREY })], spacing: { after: 0 } }),
  ];
}

function engagementLetter(d) {
  return [
    ...firmHeader(),
    new Paragraph({ children: [new TextRun({ text: now(), size: 18 })], spacing: { after: 160 } }),
    new Paragraph({ children: [new TextRun({ text: "ENGAGEMENT LETTER", bold: true, size: 24, underline: { type: UnderlineType.SINGLE } })], spacing: { after: 200 } }),
    sectionHeading("Client Details"),
    rowParagraph("Client Name",        d.clientName),
    rowParagraph("Matter Type",        d.matterType),
    rowParagraph("File Reference",     d.caseRef),
    rowParagraph("Date of Engagement", now()),
    sectionHeading("Scope of Work"),
    bodyText(d.scopeOfWork || "Full legal representation for the matter described above."),
    sectionHeading("Fees"),
    rowParagraph("Fixed Fee",   d.fee ? `£${d.fee}` : "As agreed"),
    rowParagraph("VAT",         "Applicable at standard rate where applicable"),
    rowParagraph("Disbursements","Payable in addition to the fixed fee"),
    sectionHeading("Terms & Conditions"),
    bodyText("By proceeding with instructions you confirm you have read and accepted our standard terms and conditions available at msdsolicitors.co.uk/terms."),
    ...signatureLine("Signed for and on behalf of Masaud Solicitors"),
    new Paragraph({ children: [new TextRun({ text: "Authorised Signatory", size: 16, color: GREY })], spacing: { after: 0 } }),
  ];
}

function gdprConsent(d) {
  return [
    ...firmHeader(),
    new Paragraph({ children: [new TextRun({ text: "DATA PROTECTION & GDPR CONSENT FORM", bold: true, size: 24, underline: { type: UnderlineType.SINGLE } })], spacing: { after: 200 } }),
    rowParagraph("Date",        now()),
    rowParagraph("Client Name", d.clientName),
    rowParagraph("Matter",      d.matterType),
    sectionHeading("Data Controller"),
    bodyText(`${FIRM_NAME}, ${FIRM_ADDRESS}`),
    sectionHeading("Data We Collect"),
    bodyText("Name, address, date of birth, contact details, financial information, immigration history, and other information relevant to your legal matter."),
    sectionHeading("How We Use Your Data"),
    bodyText("To provide legal services, comply with our regulatory obligations (including AML/CDD checks), communicate with UKVI and courts, and manage billing."),
    sectionHeading("Your Rights (UK GDPR)"),
    bodyText("Right of access · Right to rectification · Right to erasure · Right to portability · Right to object."),
    sectionHeading("Marketing Consent"),
    bodyText(`Marketing communications: ${d.marketingConsent ? "✓ Client has consented to receive relevant updates." : "✗ Client has not consented to marketing communications."}`),
    ...signatureLine("Client Signature"),
    ...signatureLine("Date"),
  ];
}

function amlChecklist(d) {
  const riskText = (d.amlStatus || "clear").toUpperCase();
  return [
    ...firmHeader(),
    new Paragraph({ children: [new TextRun({ text: "AML / CDD COMPLIANCE CHECKLIST", bold: true, size: 24, underline: { type: UnderlineType.SINGLE } })], spacing: { after: 200 } }),
    sectionHeading("Matter Information"),
    rowParagraph("Client",      d.clientName),
    rowParagraph("Matter Type", d.matterType),
    rowParagraph("File Ref",    d.caseRef),
    rowParagraph("Caseworker",  d.caseworkerName),
    rowParagraph("Date",        now()),
    sectionHeading("Identity Verification"),
    bodyText(`${d.identityVerified ? "☑" : "☐"}  Identity document viewed and certified copy taken`),
    rowParagraph("Document Type",   d.identityDocType),
    rowParagraph("Document Expiry", d.identityDocExpiry),
    sectionHeading("Source of Funds"),
    bodyText("☑  Source of funds established and recorded"),
    rowParagraph("Details", d.sourceOfFunds),
    sectionHeading("PEP & Sanctions Screening"),
    bodyText("☑  Screening completed"),
    rowParagraph("Result",        riskText),
    rowParagraph("Screening Ref", d.screeningRef),
    rowParagraph("Date",          now()),
    new Paragraph({
      children: [new TextRun({ text: `Overall Risk Rating: ${riskText}`, bold: true, size: 20, color: d.amlStatus === "high" ? "DC2626" : d.amlStatus === "medium" ? "D97706" : "16A34A" })],
      spacing: { before: 200, after: 200 },
    }),
    sectionHeading("Supervision"),
    rowParagraph("Cadence", d.supervisionCadence || "Monthly"),
    ...signatureLine("Completed by"),
    ...signatureLine("Supervised by"),
  ];
}

function instructionSummary(d) {
  return [
    ...firmHeader(),
    new Paragraph({ children: [new TextRun({ text: "MATTER SUMMARY SHEET", bold: true, size: 24, underline: { type: UnderlineType.SINGLE } })], spacing: { after: 200 } }),
    sectionHeading("Case Details"),
    rowParagraph("File Reference", d.caseRef),
    rowParagraph("Matter Type",    d.matterType),
    rowParagraph("Stage",          d.stage || "Initial Assessment"),
    rowParagraph("Priority",       d.priority || "Normal"),
    rowParagraph("Risk Level",     d.risk || "Low"),
    rowParagraph("Date Opened",    now()),
    sectionHeading("Client Details"),
    rowParagraph("Name",        d.clientName),
    rowParagraph("Email",       d.clientEmail),
    rowParagraph("Phone",       d.clientPhone),
    rowParagraph("Nationality", d.nationality),
    sectionHeading("Financial Summary"),
    rowParagraph("Fixed Fee",    d.fee ? `£${d.fee}` : "TBC"),
    rowParagraph("Paid to Date", d.paid ? `£${d.paid}` : "£0"),
    rowParagraph("Outstanding",  d.outstanding ? `£${d.outstanding}` : "TBC"),
    sectionHeading("Key Dates"),
    rowParagraph("Key Date",     d.keyDate || "TBC"),
    rowParagraph("Hearing Date", d.hearingDate || "N/A"),
    sectionHeading("Assigned Team"),
    rowParagraph("Caseworker", d.caseworkerName),
    rowParagraph("Supervisor", d.supervisorName),
  ];
}

// ─── Main export ──────────────────────────────────────────────────────────────

async function generateDOCX(template, data) {
  let children;
  switch (template) {
    case "client_care_letter":  children = clientCareLetter(data);    break;
    case "engagement_letter":   children = engagementLetter(data);    break;
    case "gdpr_consent":        children = gdprConsent(data);         break;
    case "aml_checklist":       children = amlChecklist(data);        break;
    case "instruction_summary": children = instructionSummary(data);  break;
    default:
      children = [new Paragraph({ children: [new TextRun({ text: `Template "${template}" not found.` })] })];
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children,
    }],
  });

  const fileName = `${template}_${Date.now()}.docx`;
  const filePath = path.join(UPLOAD_DIR, fileName);
  const buffer   = await Packer.toBuffer(doc);
  fs.writeFileSync(filePath, buffer);

  return { filePath, fileName, mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
}

module.exports = { generateDOCX };
