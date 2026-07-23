// require("dotenv").config();
// const mongoose = require("mongoose");
// const User     = require("../models/User");
// const Client   = require("../models/Client");
// const Case     = require("../models/Case");
// const Task     = require("../models/Task");
// const Invoice  = require("../models/Invoice");
// const Lead     = require("../models/Lead");
// const Matter   = require("../models/Matter");
// const Document = require("../models/Document");
// const Note     = require("../models/Note");

// const SEED_PASSWORD = "MsdCms2026!";

// // ─── All 10 role users ────────────────────────────────────────────────────────
// const usersData = [
//   {
//     name: "Mohsin Masaud",
//     email: "director@msdsolicitors.co.uk",
//     role: "director",
//     department: "Management",
//     phone: "+44 7000 000001",
//     description: "Managing Partner / Director — full access",
//   },
//   {
//     name: "Naveed Compliance",
//     email: "compliance@msdsolicitors.co.uk",
//     role: "compliance",
//     department: "Compliance",
//     phone: "+44 7000 000002",
//     description: "COLP / Compliance Officer",
//   },
//   {
//     name: "Sarah Supervisor",
//     email: "supervisor@msdsolicitors.co.uk",
//     role: "supervisor",
//     department: "Legal",
//     phone: "+44 7000 000003",
//     description: "Department Head / Supervisor",
//   },
//   {
//     name: "Hassan Ali",
//     email: "solicitor@msdsolicitors.co.uk",
//     role: "fee_earner",
//     department: "Immigration",
//     phone: "+44 7000 000004",
//     description: "Solicitor / Caseworker",
//   },
//   {
//     name: "Amal Paralegal",
//     email: "paralegal@msdsolicitors.co.uk",
//     role: "paralegal",
//     department: "Legal Support",
//     phone: "+44 7000 000005",
//     description: "Paralegal / Legal Assistant",
//   },
//   {
//     name: "Zaheer Khan",
//     email: "sales@msdsolicitors.co.uk",
//     role: "sales",
//     department: "Sales",
//     phone: "+44 7000 000006",
//     description: "Sales / Intake",
//   },
//   {
//     name: "Izzah Finance",
//     email: "finance@msdsolicitors.co.uk",
//     role: "finance",
//     department: "Finance",
//     phone: "+44 7000 000007",
//     description: "Finance — billing, payments, ledgers",
//   },
//   {
//     name: "Zenab Admin",
//     email: "admin@msdsolicitors.co.uk",
//     role: "admin",
//     department: "Administration",
//     phone: "+44 7000 000008",
//     description: "Administrator — system config, user provisioning",
//   },
//   {
//     name: "James Consultant",
//     email: "consultant@msdsolicitors.co.uk",
//     role: "consultant",
//     department: "External",
//     phone: "+44 7000 000009",
//     description: "External Consultant / Counsel — limited shared access",
//   },
//   {
//     name: "Demo Client",
//     email: "client@msdsolicitors.co.uk",
//     role: "client",
//     department: "Client Portal",
//     phone: "+44 7000 000010",
//     description: "Client / Portal User — own matters only",
//   },
// ];

// async function seed() {
//   await mongoose.connect(process.env.MONGODB_URI);
//   console.log("✅ MongoDB connected\n");

//   // ── 1. Users ────────────────────────────────────────────────────────────────
//   console.log("━━━ Users ━━━");
//   const users = {};
//   for (const u of usersData) {
//     let user = await User.findOne({ email: u.email });
//     if (!user) {
//       user = await User.create({ name: u.name, email: u.email, password: SEED_PASSWORD, role: u.role, department: u.department, phone: u.phone });
//       console.log(`✅ Created  [${u.role.padEnd(12)}] ${u.name}`);
//     } else {
//       // Update role in case it changed
//       user.role = u.role;
//       await user.save();
//       console.log(`🔄 Updated  [${u.role.padEnd(12)}] ${u.name}`);
//     }
//     users[u.role] = user;
//   }

//   // Helper refs
//   const director    = users["director"];
//   const supervisor  = users["supervisor"];
//   const fee_earner  = users["fee_earner"];
//   const adminUser   = users["admin"];

//   // ── 2. Clients ──────────────────────────────────────────────────────────────
//   console.log("\n━━━ Clients ━━━");
//   const clientsData = [
//     { firstName: "Amina",   lastName: "Rahim",   email: "amina.rahim@example.com",   phone: "+44 7900 111001", nationality: "Bangladeshi", amlStatus: "clear",   identityVerified: true  },
//     { firstName: "David",   lastName: "Mensah",  email: "david.mensah@example.com",  phone: "+44 7900 111002", nationality: "Ghanaian",    amlStatus: "high",    identityVerified: true  },
//     { firstName: "Hana",    lastName: "Fadel",   email: "hana.fadel@example.com",    phone: "+44 7900 111003", nationality: "Syrian",      amlStatus: "high",    identityVerified: false },
//     { firstName: "Nana",    lastName: "Osei",    email: "nana.osei@example.com",     phone: "+44 7900 111004", nationality: "Nigerian",    amlStatus: "medium",  identityVerified: true  },
//     { firstName: "Zara",    lastName: "Virk",    email: "zara.virk@example.com",     phone: "+44 7900 111005", nationality: "Pakistani",   amlStatus: "clear",   identityVerified: true  },
//     { firstName: "Lena",    lastName: "Nowak",   email: "lena.nowak@example.com",    phone: "+44 7900 111006", nationality: "Polish",      amlStatus: "clear",   identityVerified: true  },
//     { firstName: "Seun",    lastName: "Adeyemi", email: "seun.adeyemi@example.com",  phone: "+44 7900 111007", nationality: "Nigerian",    amlStatus: "medium",  identityVerified: true  },
//     { firstName: "Fatima",  lastName: "Beshir",  email: "fatima.beshir@example.com", phone: "+44 7900 111008", nationality: "Somali",      amlStatus: "pending", identityVerified: false },
//   ];

//   const clientMap = {};
//   for (const c of clientsData) {
//     let client = await Client.findOne({ email: c.email });
//     if (!client) {
//       client = await Client.create({ ...c, createdBy: adminUser._id, portalActive: false, marketingConsent: true });
//       console.log(`✅ ${c.firstName} ${c.lastName}`);
//     } else {
//       console.log(`⏭  ${c.firstName} ${c.lastName} (exists)`);
//     }
//     clientMap[c.lastName.toLowerCase()] = client;
//   }

//   // ── 2b. Matters ─────────────────────────────────────────────────────────────
//   console.log("\n━━━ Matters ━━━");
//   const mattersData = [
//     {
//       ref: "M.0726.8821.IMM",
//       clientKey: "rahim",
//       practiceArea: "immigration",
//       matterType: "Spouse Visa — Entry Clearance",
//       description: "Client Amina Rahim spouse entry clearance visa application from Pakistan",
//       status: "active",
//       stage: "Awaiting UKVI Decision",
//       risk: "medium",
//       priority: "normal",
//       fundingType: "fixed_fee",
//       fixedFee: 2500,
//       outstanding: 900,
//       keyDate: new Date(Date.now() + 25 * 86400000),
//       nextActionDate: new Date(Date.now() + 3 * 86400000),
//       nextActionNote: "Chase UKVI for decision status update",
//       immigration: {
//         applicationRoute: "Appendix FM",
//         applicationLocation: "outside_uk",
//         leaveExpiryDate: new Date(Date.now() + 35 * 86400000),
//         homeOfficeRef: "HO-994821",
//         sponsorName: "Tariq Rahim",
//         isUrgent: true,
//         legalCalculation: {
//           source: "Appendix FM-SE / Rules Part 8",
//           assumptions: "Cat A employment income > £29,000 threshold",
//           reviewer: "Sarah Supervisor",
//         },
//       },
//       openingGates: { conflictPassed: true, amlPassed: true, engagementSigned: true, fundingAgreed: true },
//       checklist: [
//         { label: "Client care letter sent and signed", required: true, completed: true, completedAt: new Date() },
//         { label: "Conflict check recorded", required: true, completed: true, completedAt: new Date() },
//         { label: "Passport and travel documents obtained", required: true, completed: true, completedAt: new Date() },
//         { label: "Financial requirement evidence reviewed", required: true, completed: true, completedAt: new Date() },
//         { label: "Submission marked complete", required: true, completed: false },
//       ],
//       parties: [
//         { role: "client", name: "Amina Rahim", email: "amina.rahim@example.com", phone: "+44 7911 123456" },
//         { role: "agent", name: "Tariq Rahim", email: "tariq.rahim@example.com", phone: "+44 7911 654321" },
//       ],
//     },
//     {
//       ref: "M.0726.9402.FAM",
//       clientKey: "virk",
//       practiceArea: "family",
//       matterType: "Child Arrangements Order",
//       description: "Urgent child arrangements order application with safeguarding domestic abuse flags",
//       status: "active",
//       stage: "Court Bundle Preparation",
//       risk: "critical",
//       priority: "urgent",
//       fundingType: "legal_aid",
//       fixedFee: 3500,
//       outstanding: 1500,
//       keyDate: new Date(Date.now() + 5 * 86400000),
//       nextActionDate: new Date(Date.now() + 1 * 86400000),
//       nextActionNote: "Prepare draft C100 application & C1A safeguarding form",
//       family: {
//         caseType: "Child Arrangements",
//         courtName: "Central Family Court London",
//         courtRef: "FD26P00192",
//         hasChildren: true,
//         childrenCount: 2,
//         hasDomesticAbuse: true,
//         hasChildRisk: true,
//         protectedAddress: true,
//         isWithoutNotice: true,
//         shortenedApprovalReason: "Immediate safeguarding risk to mother & children",
//         retrospectiveReviewRequired: true,
//       },
//       openingGates: { conflictPassed: true, amlPassed: true, engagementSigned: true, fundingAgreed: true },
//       checklist: [
//         { label: "Conflict check recorded", required: true, completed: true, completedAt: new Date() },
//         { label: "Safeguarding checks completed", required: true, completed: true, completedAt: new Date() },
//         { label: "Court application prepared", required: true, completed: true, completedAt: new Date() },
//         { label: "Retrospective review completed", required: true, completed: false, code: "retrospective_review" },
//       ],
//       parties: [
//         { role: "client", name: "Jaswinder Virk", email: "jaswinder.virk@example.com", phone: "+44 7933 111222" },
//         { role: "opponent", name: "Rajinder Virk", isProtected: true, notes: "Protected opponent contact" },
//       ],
//     },
//     {
//       ref: "M.0626.5510.IMM",
//       clientKey: "mensah",
//       practiceArea: "immigration",
//       matterType: "Skilled Worker Visa",
//       description: "Kwame Mensah skilled worker visa extension",
//       status: "pending",
//       stage: "Initial Assessment",
//       risk: "high",
//       priority: "normal",
//       fundingType: "fixed_fee",
//       fixedFee: 2200,
//       outstanding: 2200,
//       keyDate: new Date(Date.now() + 45 * 86400000),
//       nextActionDate: new Date(Date.now() + 7 * 86400000),
//       nextActionNote: "Obtain CoS details from employer sponsor",
//       immigration: {
//         applicationRoute: "Skilled Worker",
//         applicationLocation: "inside_uk",
//         leaveExpiryDate: new Date(Date.now() + 60 * 86400000),
//         sponsorName: "Tech Global Solutions UK Ltd",
//         sponsorRef: "CoS-99182312",
//         legalCalculation: {
//           source: "Skilled Worker Appendix SOC 2026",
//           assumptions: "SOC 2136 salary threshold £38,700 confirmed",
//           reviewer: "Mohsin Masaud",
//         },
//       },
//       openingGates: { conflictPassed: true, amlPassed: true, engagementSigned: true, fundingAgreed: true },
//     },
//   ];

//   const matterMap = {};
//   for (const mData of mattersData) {
//     let mat = await Matter.findOne({ reference: mData.ref });
//     const clientDoc = clientMap[mData.clientKey];
//     if (!clientDoc) continue;
//     if (!mat) {
//       mat = await Matter.create({
//         ...mData,
//         clientId: clientDoc._id,
//         ownerId: fee_earner._id,
//         supervisorId: supervisor._id,
//         createdBy: adminUser._id,
//         openedAt: new Date(Date.now() - 20 * 86400000),
//         timeline: [
//           { type: "created", description: `Matter opened: ${mData.matterType}`, createdBy: adminUser._id, isAudit: true },
//           { type: "note", description: "Initial consultation notes recorded with client", createdBy: fee_earner._id, isAudit: false },
//         ]
//       });
//       console.log(`✅ Matter: ${mat.reference} (${mat.matterType})`);
//     } else {
//       console.log(`⏭  Matter: ${mat.reference} (exists)`);
//     }
//     matterMap[mData.ref] = mat;
//   }

//   // ── 3. Cases ────────────────────────────────────────────────────────────────
//   console.log("\n━━━ Cases ━━━");
//   const casesData = [
//     { ref: "RR.0126.3401.SV-LTR",  client: "rahim",   type: "Spouse Visa — LTR",            stage: "Awaiting UKVI Decision", status: "awaiting_decision", risk: "low",    fee: 1800, outstanding: 900  },
//     { ref: "RR.1225.3388.ASY-LTR",  client: "mensah",  type: "Asylum — Leave to Remain",     stage: "FTT Bundle Preparation", status: "open",              risk: "high",   fee: 2500, outstanding: 1200 },
//     { ref: "ZK.1125.3390.FLR-M",    client: "fadel",   type: "FLR(M) — Spouse",              stage: "Documents Gathering",    status: "pending",           risk: "medium", fee: 1500, outstanding: 750  },
//     { ref: "HK.0425.3260.ASY-LTR",  client: "osei",    type: "Asylum — LTR",                 stage: "Interview Preparation",  status: "open",              risk: "high",   fee: 3000, outstanding: 0    },
//     { ref: "AY.0526.3441.FAM-CH",   client: "virk",    type: "Family — Child Arrangements",  stage: "Mediation",              status: "open",              risk: "high",   fee: 4500, outstanding: 2000 },
//     { ref: "SF.0725.3489.SPS-LTR",  client: "nowak",   type: "Spouse Visa — Entry Clearance",stage: "Application Submitted",  status: "pending",           risk: "low",    fee: 1800, outstanding: 900  },
//     { ref: "SF.0624.3201.EEA-PR",   client: "adeyemi", type: "EEA — Permanent Residence",    stage: "Evidence Review",        status: "open",              risk: "medium", fee: 1200, outstanding: 600  },
//     { ref: "RR.0726.3512.ASY-HTR",  client: "beshir",  type: "Asylum — FTT Hearing",         stage: "Hearing Bundle",         status: "open",              risk: "high",   fee: 3500, outstanding: 1750 },
//   ];

//   const caseMap = {};
//   for (const c of casesData) {
//     let cas = await Case.findOne({ reference: c.ref });
//     const clientDoc = clientMap[c.client];
//     if (!clientDoc) { console.log(`⚠  No client for ${c.ref}`); continue; }
//     if (!cas) {
//       cas = await Case.create({
//         reference: c.ref, clientId: clientDoc._id,
//         assignedTo: fee_earner._id, supervisedBy: supervisor._id, createdBy: adminUser._id,
//         type: c.type, stage: c.stage, status: c.status, risk: c.risk,
//         fee: c.fee, outstanding: c.outstanding,
//         keyDate: new Date(Date.now() + Math.random() * 60 * 86400000),
//         openedAt: new Date(Date.now() - Math.random() * 180 * 86400000),
//         conflictCheckDone: true, cddComplete: c.risk !== "high",
//         supervisionCadence: c.risk === "high" ? "monthly" : "6weekly",
//         nextSupervisionDate: new Date(Date.now() + 14 * 86400000),
//         tags: [c.type.split(" ")[0]],
//       });
//       console.log(`✅ ${c.ref}`);
//     } else {
//       console.log(`⏭  ${c.ref} (exists)`);
//     }
//     caseMap[c.ref] = cas;
//   }

//   // ── 4. Tasks ────────────────────────────────────────────────────────────────
//   console.log("\n━━━ Tasks ━━━");
//   const firstCase = Object.values(caseMap)[0];
//   if (firstCase) {
//     const tasksData = [
//       { title: "Upload client passport copy",   status: "completed",   priority: "high",   dueDate: "2026-07-18" },
//       { title: "Complete AML re-screening",     status: "todo",        priority: "high",   dueDate: "2026-07-30" },
//       { title: "Draft FTT bundle",              status: "in_progress", priority: "urgent", dueDate: "2026-07-25" },
//       { title: "Send client care letter",       status: "completed",   priority: "medium", dueDate: "2026-07-15" },
//       { title: "Record supervision (RR files)", status: "overdue",     priority: "high",   dueDate: "2026-07-10" },
//       { title: "Chase payment — Amina Rahim",   status: "todo",        priority: "medium", dueDate: "2026-07-30" },
//     ];
//     for (const t of tasksData) {
//       const exists = await Task.findOne({ title: t.title, caseId: firstCase._id });
//       if (!exists) {
//         await Task.create({
//           title: t.title, caseId: firstCase._id,
//           assignedTo: fee_earner._id, createdBy: adminUser._id,
//           status: t.status, priority: t.priority, dueDate: new Date(t.dueDate),
//           completedAt: t.status === "completed" ? new Date() : undefined,
//         });
//         console.log(`✅ Task: ${t.title}`);
//       }
//     }
//   }

//   // ── 5. Invoices ─────────────────────────────────────────────────────────────
//   console.log("\n━━━ Invoices ━━━");
//   const caseArr = Object.values(caseMap);
//   for (let i = 0; i < Math.min(4, caseArr.length); i++) {
//     const cas = caseArr[i];
//     const exists = await Invoice.findOne({ caseId: cas._id });
//     if (!exists) {
//       await Invoice.create({
//         caseId: cas._id, clientId: cas.clientId, createdBy: adminUser._id,
//         lines: [{ description: `${cas.type} — professional fees`, quantity: 1, unitPrice: cas.fee, total: cas.fee }],
//         subtotal: cas.fee, vatAmount: 0, total: cas.fee,
//         paid: cas.fee - cas.outstanding, outstanding: cas.outstanding,
//         status: cas.outstanding > 0 ? "partial" : "paid",
//         dueAt: new Date(Date.now() + 30 * 86400000),
//       });
//       console.log(`✅ Invoice for ${cas.reference}`);
//     }
//   }

//   // ── 6. Leads ────────────────────────────────────────────────────────────────
//   console.log("\n━━━ Leads ━━━");
//   const leadsData = [
//     { firstName: "Ahmad",  lastName: "Karimi",  type: "Spouse Visa",          source: "website",      status: "new",          notes: "Enquired about spouse visa requirements" },
//     { firstName: "Maria",  lastName: "Santos",  type: "Family Reunion",       source: "referral",     status: "contacted",    notes: "Referred by existing client" },
//     { firstName: "James",  lastName: "Okonkwo", type: "Asylum",               source: "walk_in",      status: "consultation", notes: "Urgent — has upcoming interview" },
//     { firstName: "Priya",  lastName: "Sharma",  type: "Skilled Worker Visa",  source: "website",      status: "instructed",   notes: "Ready to proceed" },
//     { firstName: "Omar",   lastName: "Hassan",  type: "Student Visa",         source: "social_media", status: "new",          notes: "University starting September" },
//     { firstName: "Elena",  lastName: "Popescu", type: "EEA — Settled Status", source: "referral",     status: "lost",         notes: "Went with another firm" },
//   ];
//   const salesUser = users["sales"];
//   for (const l of leadsData) {
//     const email = `${l.firstName.toLowerCase()}.${l.lastName.toLowerCase()}@example.com`;
//     const exists = await Lead.findOne({ email });
//     if (!exists) {
//       await Lead.create({
//         ...l, email, phone: "+44 7900 " + Math.floor(200000 + Math.random() * 799999),
//         assignedTo: salesUser._id, createdBy: salesUser._id,
//         estimatedFee: Math.floor(1000 + Math.random() * 3000),
//       });
//       console.log(`✅ Lead: ${l.firstName} ${l.lastName} (${l.status})`);
//     } else {
//       console.log(`⏭  Lead: ${l.firstName} ${l.lastName} (exists)`);
//     }
//   }

//   // ── Summary ─────────────────────────────────────────────────────────────────
//   console.log(`
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✅ Seed complete — All 10 roles created
// 🔑 Password for ALL users: ${SEED_PASSWORD}
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Role               Email
// ─────────────────────────────────────────────────────────────
// director         → director@msdsolicitors.co.uk    (Mohsin Masaud)
// compliance       → compliance@msdsolicitors.co.uk  (Naveed Compliance)
// supervisor       → supervisor@msdsolicitors.co.uk  (Sarah Supervisor)
// fee_earner       → solicitor@msdsolicitors.co.uk   (Hassan Ali)
// paralegal        → paralegal@msdsolicitors.co.uk   (Amal Paralegal)
// sales            → sales@msdsolicitors.co.uk       (Zaheer Khan)
// finance          → finance@msdsolicitors.co.uk     (Izzah Finance)
// admin            → admin@msdsolicitors.co.uk       (Zenab Admin)
// consultant       → consultant@msdsolicitors.co.uk  (James Consultant)
// client           → client@msdsolicitors.co.uk      (Demo Client)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//   `);

//   await mongoose.disconnect();
//   process.exit(0);
// }

// seed().catch((err) => {
//   console.error("❌ Seed failed:", err.message);
//   process.exit(1);
// });














const path = require("path");

// Root directory se .env load kar rahe hain
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const mongoose = require("mongoose");
const User     = require("../models/User");
const Client   = require("../models/Client");
const Case     = require("../models/Case");
const Task     = require("../models/Task");
const Invoice  = require("../models/Invoice");
const Lead     = require("../models/Lead");
const Matter   = require("../models/Matter");
const Document = require("../models/Document");
const Note     = require("../models/Note");

const SEED_PASSWORD = "MsdCms2026!";

// ─── All 10 role users ────────────────────────────────────────────────────────
const usersData = [
  {
    name: "Mohsin Masaud",
    email: "director@msdsolicitors.co.uk",
    role: "director",
    department: "Management",
    phone: "+44 7000 000001",
    description: "Managing Partner / Director — full access",
  },
  {
    name: "Naveed Compliance",
    email: "compliance@msdsolicitors.co.uk",
    role: "compliance",
    department: "Compliance",
    phone: "+44 7000 000002",
    description: "COLP / Compliance Officer",
  },
  {
    name: "Sarah Supervisor",
    email: "supervisor@msdsolicitors.co.uk",
    role: "supervisor",
    department: "Legal",
    phone: "+44 7000 000003",
    description: "Department Head / Supervisor",
  },
  {
    name: "Hassan Ali",
    email: "solicitor@msdsolicitors.co.uk",
    role: "fee_earner",
    department: "Immigration",
    phone: "+44 7000 000004",
    description: "Solicitor / Caseworker",
  },
  {
    name: "Amal Paralegal",
    email: "paralegal@msdsolicitors.co.uk",
    role: "paralegal",
    department: "Legal Support",
    phone: "+44 7000 000005",
    description: "Paralegal / Legal Assistant",
  },
  {
    name: "Zaheer Khan",
    email: "sales@msdsolicitors.co.uk",
    role: "sales",
    department: "Sales",
    phone: "+44 7000 000006",
    description: "Sales / Intake",
  },
  {
    name: "Izzah Finance",
    email: "finance@msdsolicitors.co.uk",
    role: "finance",
    department: "Finance",
    phone: "+44 7000 000007",
    description: "Finance — billing, payments, ledgers",
  },
  {
    name: "Zenab Admin",
    email: "admin@msdsolicitors.co.uk",
    role: "admin",
    department: "Administration",
    phone: "+44 7000 000008",
    description: "Administrator — system config, user provisioning",
  },
  {
    name: "James Consultant",
    email: "consultant@msdsolicitors.co.uk",
    role: "consultant",
    department: "External",
    phone: "+44 7000 000009",
    description: "External Consultant / Counsel — limited shared access",
  },
  {
    name: "Demo Client",
    email: "client@msdsolicitors.co.uk",
    role: "client",
    department: "Client Portal",
    phone: "+44 7000 000010",
    description: "Client / Portal User — own matters only",
  },
];

async function seed() {
  // .env se MONGODB_URI le raha hai, agar nah mile toh .env wali string default apply kar raha hai
  const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/msd-cms";

  console.log(`📡 Connecting to MongoDB at: ${mongoURI}`);
  await mongoose.connect(mongoURI);
  console.log("✅ MongoDB connected successfully!\n");

  // ── 1. Users ────────────────────────────────────────────────────────────────
  console.log("━━━ Users ━━━");
  const users = {};
  for (const u of usersData) {
    let user = await User.findOne({ email: u.email });
    if (!user) {
      user = await User.create({
        name: u.name,
        email: u.email,
        password: SEED_PASSWORD,
        role: u.role,
        department: u.department,
        phone: u.phone,
      });
      console.log(`✅ Created  [${u.role.padEnd(12)}] ${u.name}`);
    } else {
      user.role = u.role;
      await user.save();
      console.log(`🔄 Updated  [${u.role.padEnd(12)}] ${u.name}`);
    }
    users[u.role] = user;
  }

  // Helper refs
  const director   = users["director"];
  const supervisor = users["supervisor"];
  const fee_earner = users["fee_earner"];
  const adminUser  = users["admin"];

  // ── 2. Clients ──────────────────────────────────────────────────────────────
  console.log("\n━━━ Clients ━━━");
  const clientsData = [
    { firstName: "Amina",   lastName: "Rahim",   email: "amina.rahim@example.com",   phone: "+44 7900 111001", nationality: "Bangladeshi", amlStatus: "clear",   identityVerified: true  },
    { firstName: "David",   lastName: "Mensah",  email: "david.mensah@example.com",  phone: "+44 7900 111002", nationality: "Ghanaian",    amlStatus: "high",    identityVerified: true  },
    { firstName: "Hana",    lastName: "Fadel",   email: "hana.fadel@example.com",    phone: "+44 7900 111003", nationality: "Syrian",      amlStatus: "high",    identityVerified: false },
    { firstName: "Nana",    lastName: "Osei",    email: "nana.osei@example.com",     phone: "+44 7900 111004", nationality: "Nigerian",    amlStatus: "medium",  identityVerified: true  },
    { firstName: "Zara",    lastName: "Virk",    email: "zara.virk@example.com",     phone: "+44 7900 111005", nationality: "Pakistani",   amlStatus: "clear",   identityVerified: true  },
    { firstName: "Lena",    lastName: "Nowak",   email: "lena.nowak@example.com",    phone: "+44 7900 111006", nationality: "Polish",      amlStatus: "clear",   identityVerified: true  },
    { firstName: "Seun",    lastName: "Adeyemi", email: "seun.adeyemi@example.com",  phone: "+44 7900 111007", nationality: "Nigerian",    amlStatus: "medium",  identityVerified: true  },
    { firstName: "Fatima",  lastName: "Beshir",  email: "fatima.beshir@example.com", phone: "+44 7900 111008", nationality: "Somali",      amlStatus: "pending", identityVerified: false },
  ];

  const clientMap = {};
  for (const c of clientsData) {
    let client = await Client.findOne({ email: c.email });
    if (!client) {
      client = await Client.create({ ...c, createdBy: adminUser._id, portalActive: false, marketingConsent: true });
      console.log(`✅ ${c.firstName} ${c.lastName}`);
    } else {
      console.log(`⏭  ${c.firstName} ${c.lastName} (exists)`);
    }
    clientMap[c.lastName.toLowerCase()] = client;
  }

  // ── 2b. Matters ─────────────────────────────────────────────────────────────
  console.log("\n━━━ Matters ━━━");
  const mattersData = [
    {
      ref: "M.0726.8821.IMM",
      clientKey: "rahim",
      practiceArea: "immigration",
      matterType: "Spouse Visa — Entry Clearance",
      description: "Client Amina Rahim spouse entry clearance visa application from Pakistan",
      status: "active",
      stage: "Awaiting UKVI Decision",
      risk: "medium",
      priority: "normal",
      fundingType: "fixed_fee",
      fixedFee: 2500,
      outstanding: 900,
      keyDate: new Date(Date.now() + 25 * 86400000),
      nextActionDate: new Date(Date.now() + 3 * 86400000),
      nextActionNote: "Chase UKVI for decision status update",
      immigration: {
        applicationRoute: "Appendix FM",
        applicationLocation: "outside_uk",
        leaveExpiryDate: new Date(Date.now() + 35 * 86400000),
        homeOfficeRef: "HO-994821",
        sponsorName: "Tariq Rahim",
        isUrgent: true,
        legalCalculation: {
          source: "Appendix FM-SE / Rules Part 8",
          assumptions: "Cat A employment income > £29,000 threshold",
          reviewer: "Sarah Supervisor",
        },
      },
      openingGates: { conflictPassed: true, amlPassed: true, engagementSigned: true, fundingAgreed: true },
      checklist: [
        { label: "Client care letter sent and signed", required: true, completed: true, completedAt: new Date() },
        { label: "Conflict check recorded", required: true, completed: true, completedAt: new Date() },
        { label: "Passport and travel documents obtained", required: true, completed: true, completedAt: new Date() },
        { label: "Financial requirement evidence reviewed", required: true, completed: true, completedAt: new Date() },
        { label: "Submission marked complete", required: true, completed: false },
      ],
      parties: [
        { role: "client", name: "Amina Rahim", email: "amina.rahim@example.com", phone: "+44 7911 123456" },
        { role: "agent", name: "Tariq Rahim", email: "tariq.rahim@example.com", phone: "+44 7911 654321" },
      ],
    },
    {
      ref: "M.0726.9402.FAM",
      clientKey: "virk",
      practiceArea: "family",
      matterType: "Child Arrangements Order",
      description: "Urgent child arrangements order application with safeguarding domestic abuse flags",
      status: "active",
      stage: "Court Bundle Preparation",
      risk: "critical",
      priority: "urgent",
      fundingType: "legal_aid",
      fixedFee: 3500,
      outstanding: 1500,
      keyDate: new Date(Date.now() + 5 * 86400000),
      nextActionDate: new Date(Date.now() + 1 * 86400000),
      nextActionNote: "Prepare draft C100 application & C1A safeguarding form",
      family: {
        caseType: "Child Arrangements",
        courtName: "Central Family Court London",
        courtRef: "FD26P00192",
        hasChildren: true,
        childrenCount: 2,
        hasDomesticAbuse: true,
        hasChildRisk: true,
        protectedAddress: true,
        isWithoutNotice: true,
        shortenedApprovalReason: "Immediate safeguarding risk to mother & children",
        retrospectiveReviewRequired: true,
      },
      openingGates: { conflictPassed: true, amlPassed: true, engagementSigned: true, fundingAgreed: true },
      checklist: [
        { label: "Conflict check recorded", required: true, completed: true, completedAt: new Date() },
        { label: "Safeguarding checks completed", required: true, completed: true, completedAt: new Date() },
        { label: "Court application prepared", required: true, completed: true, completedAt: new Date() },
        { label: "Retrospective review completed", required: true, completed: false, code: "retrospective_review" },
      ],
      parties: [
        { role: "client", name: "Jaswinder Virk", email: "jaswinder.virk@example.com", phone: "+44 7933 111222" },
        { role: "opponent", name: "Rajinder Virk", isProtected: true, notes: "Protected opponent contact" },
      ],
    },
    {
      ref: "M.0626.5510.IMM",
      clientKey: "mensah",
      practiceArea: "immigration",
      matterType: "Skilled Worker Visa",
      description: "Kwame Mensah skilled worker visa extension",
      status: "pending",
      stage: "Initial Assessment",
      risk: "high",
      priority: "normal",
      fundingType: "fixed_fee",
      fixedFee: 2200,
      outstanding: 2200,
      keyDate: new Date(Date.now() + 45 * 86400000),
      nextActionDate: new Date(Date.now() + 7 * 86400000),
      nextActionNote: "Obtain CoS details from employer sponsor",
      immigration: {
        applicationRoute: "Skilled Worker",
        applicationLocation: "inside_uk",
        leaveExpiryDate: new Date(Date.now() + 60 * 86400000),
        sponsorName: "Tech Global Solutions UK Ltd",
        sponsorRef: "CoS-99182312",
        legalCalculation: {
          source: "Skilled Worker Appendix SOC 2026",
          assumptions: "SOC 2136 salary threshold £38,700 confirmed",
          reviewer: "Mohsin Masaud",
        },
      },
      openingGates: { conflictPassed: true, amlPassed: true, engagementSigned: true, fundingAgreed: true },
    },
  ];

  const matterMap = {};
  for (const mData of mattersData) {
    let mat = await Matter.findOne({ reference: mData.ref });
    const clientDoc = clientMap[mData.clientKey];
    if (!clientDoc) continue;
    if (!mat) {
      mat = await Matter.create({
        ...mData,
        clientId: clientDoc._id,
        ownerId: fee_earner._id,
        supervisorId: supervisor._id,
        createdBy: adminUser._id,
        openedAt: new Date(Date.now() - 20 * 86400000),
        timeline: [
          { type: "created", description: `Matter opened: ${mData.matterType}`, createdBy: adminUser._id, isAudit: true },
          { type: "note", description: "Initial consultation notes recorded with client", createdBy: fee_earner._id, isAudit: false },
        ]
      });
      console.log(`✅ Matter: ${mat.reference} (${mat.matterType})`);
    } else {
      console.log(`⏭  Matter: ${mat.reference} (exists)`);
    }
    matterMap[mData.ref] = mat;
  }

  // ── 3. Cases ────────────────────────────────────────────────────────────────
  console.log("\n━━━ Cases ━━━");
  const casesData = [
    { ref: "RR.0126.3401.SV-LTR",  client: "rahim",   type: "Spouse Visa — LTR",         stage: "Awaiting UKVI Decision", status: "awaiting_decision", risk: "low",    fee: 1800, outstanding: 900  },
    { ref: "RR.1225.3388.ASY-LTR",  client: "mensah",  type: "Asylum — Leave to Remain",     stage: "FTT Bundle Preparation", status: "open",              risk: "high",   fee: 2500, outstanding: 1200 },
    { ref: "ZK.1125.3390.FLR-M",    client: "fadel",   type: "FLR(M) — Spouse",              stage: "Documents Gathering",    status: "pending",           risk: "medium", fee: 1500, outstanding: 750  },
    { ref: "HK.0425.3260.ASY-LTR",  client: "osei",    type: "Asylum — LTR",                 stage: "Interview Preparation",  status: "open",              risk: "high",   fee: 3000, outstanding: 0    },
    { ref: "AY.0526.3441.FAM-CH",   client: "virk",    type: "Family — Child Arrangements",  stage: "Mediation",              status: "open",              risk: "high",   fee: 4500, outstanding: 2000 },
    { ref: "SF.0725.3489.SPS-LTR",  client: "nowak",   type: "Spouse Visa — Entry Clearance",stage: "Application Submitted",  status: "pending",           risk: "low",    fee: 1800, outstanding: 900  },
    { ref: "SF.0624.3201.EEA-PR",   client: "adeyemi", type: "EEA — Permanent Residence",    stage: "Evidence Review",        status: "open",              risk: "medium", fee: 1200, outstanding: 600  },
    { ref: "RR.0726.3512.ASY-HTR",  client: "beshir",  type: "Asylum — FTT Hearing",         stage: "Hearing Bundle",         status: "open",              risk: "high",   fee: 3500, outstanding: 1750 },
  ];

  const caseMap = {};
  for (const c of casesData) {
    let cas = await Case.findOne({ reference: c.ref });
    const clientDoc = clientMap[c.client];
    if (!clientDoc) { console.log(`⚠  No client for ${c.ref}`); continue; }
    if (!cas) {
      cas = await Case.create({
        reference: c.ref, clientId: clientDoc._id,
        assignedTo: fee_earner._id, supervisedBy: supervisor._id, createdBy: adminUser._id,
        type: c.type, stage: c.stage, status: c.status, risk: c.risk,
        fee: c.fee, outstanding: c.outstanding,
        keyDate: new Date(Date.now() + Math.random() * 60 * 86400000),
        openedAt: new Date(Date.now() - Math.random() * 180 * 86400000),
        conflictCheckDone: true, cddComplete: c.risk !== "high",
        supervisionCadence: c.risk === "high" ? "monthly" : "6weekly",
        nextSupervisionDate: new Date(Date.now() + 14 * 86400000),
        tags: [c.type.split(" ")[0]],
      });
      console.log(`✅ ${c.ref}`);
    } else {
      console.log(`⏭  ${c.ref} (exists)`);
    }
    caseMap[c.ref] = cas;
  }

  // ── 4. Tasks ────────────────────────────────────────────────────────────────
  console.log("\n━━━ Tasks ━━━");
  const firstCase = Object.values(caseMap)[0];
  if (firstCase) {
    const tasksData = [
      { title: "Upload client passport copy",   status: "completed",   priority: "high",   dueDate: "2026-07-18" },
      { title: "Complete AML re-screening",     status: "todo",        priority: "high",   dueDate: "2026-07-30" },
      { title: "Draft FTT bundle",              status: "in_progress", priority: "urgent", dueDate: "2026-07-25" },
      { title: "Send client care letter",       status: "completed",   priority: "medium", dueDate: "2026-07-15" },
      { title: "Record supervision (RR files)", status: "overdue",     priority: "high",   dueDate: "2026-07-10" },
      { title: "Chase payment — Amina Rahim",   status: "todo",        priority: "medium", dueDate: "2026-07-30" },
    ];
    for (const t of tasksData) {
      const exists = await Task.findOne({ title: t.title, caseId: firstCase._id });
      if (!exists) {
        await Task.create({
          title: t.title, caseId: firstCase._id,
          assignedTo: fee_earner._id, createdBy: adminUser._id,
          status: t.status, priority: t.priority, dueDate: new Date(t.dueDate),
          completedAt: t.status === "completed" ? new Date() : undefined,
        });
        console.log(`✅ Task: ${t.title}`);
      }
    }
  }

  // ── 5. Invoices ─────────────────────────────────────────────────────────────
  console.log("\n━━━ Invoices ━━━");
  const caseArr = Object.values(caseMap);
  for (let i = 0; i < Math.min(4, caseArr.length); i++) {
    const cas = caseArr[i];
    const exists = await Invoice.findOne({ caseId: cas._id });
    if (!exists) {
      await Invoice.create({
        caseId: cas._id, clientId: cas.clientId, createdBy: adminUser._id,
        lines: [{ description: `${cas.type} — professional fees`, quantity: 1, unitPrice: cas.fee, total: cas.fee }],
        subtotal: cas.fee, vatAmount: 0, total: cas.fee,
        paid: cas.fee - cas.outstanding, outstanding: cas.outstanding,
        status: cas.outstanding > 0 ? "partial" : "paid",
        dueAt: new Date(Date.now() + 30 * 86400000),
      });
      console.log(`✅ Invoice for ${cas.reference}`);
    }
  }

  // ── 6. Leads ────────────────────────────────────────────────────────────────
  console.log("\n━━━ Leads ━━━");
  const leadsData = [
    { firstName: "Ahmad",  lastName: "Karimi",  type: "Spouse Visa",         source: "website",      status: "new",          notes: "Enquired about spouse visa requirements" },
    { firstName: "Maria",  lastName: "Santos",  type: "Family Reunion",        source: "referral",     status: "contacted",    notes: "Referred by existing client" },
    { firstName: "James",  lastName: "Okonkwo", type: "Asylum",               source: "walk_in",      status: "consultation", notes: "Urgent — has upcoming interview" },
    { firstName: "Priya",  lastName: "Sharma",  type: "Skilled Worker Visa",  source: "website",      status: "instructed",   notes: "Ready to proceed" },
    { firstName: "Omar",   lastName: "Hassan",  type: "Student Visa",         source: "social_media", status: "new",          notes: "University starting September" },
    { firstName: "Elena",  lastName: "Popescu", type: "EEA — Settled Status", source: "referral",     status: "lost",         notes: "Went with another firm" },
  ];
  const salesUser = users["sales"];
  for (const l of leadsData) {
    const email = `${l.firstName.toLowerCase()}.${l.lastName.toLowerCase()}@example.com`;
    const exists = await Lead.findOne({ email });
    if (!exists) {
      await Lead.create({
        ...l, email, phone: "+44 7900 " + Math.floor(200000 + Math.random() * 799999),
        assignedTo: salesUser._id, createdBy: salesUser._id,
        estimatedFee: Math.floor(1000 + Math.random() * 3000),
      });
      console.log(`✅ Lead: ${l.firstName} ${l.lastName} (${l.status})`);
    } else {
      console.log(`⏭  Lead: ${l.firstName} ${l.lastName} (exists)`);
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Seed complete — All 10 roles created
🔑 Password for ALL users: ${SEED_PASSWORD}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Role             Email
─────────────────────────────────────────────────────────────
director         → director@msdsolicitors.co.uk    (Mohsin Masaud)
compliance       → compliance@msdsolicitors.co.uk  (Naveed Compliance)
supervisor       → supervisor@msdsolicitors.co.uk  (Sarah Supervisor)
fee_earner       → solicitor@msdsolicitors.co.uk   (Hassan Ali)
paralegal        → paralegal@msdsolicitors.co.uk   (Amal Paralegal)
sales            → sales@msdsolicitors.co.uk       (Zaheer Khan)
finance          → finance@msdsolicitors.co.uk     (Izzah Finance)
admin            → admin@msdsolicitors.co.uk       (Zenab Admin)
consultant       → consultant@msdsolicitors.co.uk  (James Consultant)
client           → client@msdsolicitors.co.uk       (Demo Client)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});