require("dotenv").config();
const mongoose = require("mongoose");
const User     = require("../models/User");
const Client   = require("../models/Client");
const Case     = require("../models/Case");
const Task     = require("../models/Task");
const Invoice  = require("../models/Invoice");
const Lead     = require("../models/Lead");

const SEED_PASSWORD = "MsdCms2026!";

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ MongoDB connected\n");

  // ── 1. Users ────────────────────────────────────────────────────────────────
  const usersData = [
    { name: "Mohsin Masaud",    email: "director@msdsolicitors.co.uk",    role: "director",    department: "Management",    phone: "+44 7000 000001" },
    { name: "Naveed Ahmed",     email: "supervisor@msdsolicitors.co.uk",  role: "supervisor",  department: "Legal",         phone: "+44 7000 000002" },
    { name: "Hassan Ali",       email: "solicitor@msdsolicitors.co.uk",   role: "fee_earner",  department: "Immigration",   phone: "+44 7000 000003" },
    { name: "Izzah Amal",       email: "admin@msdsolicitors.co.uk",       role: "admin",       department: "Administration",phone: "+44 7000 000004" },
    { name: "Zenab Hussain",    email: "admin2@msdsolicitors.co.uk",      role: "admin",       department: "Administration",phone: "+44 7000 000005" },
    { name: "Naveed Compliance",email: "compliance@msdsolicitors.co.uk",  role: "compliance",  department: "Compliance",    phone: "+44 7000 000006" },
    { name: "Zaheer Khan",      email: "sales@msdsolicitors.co.uk",       role: "sales",       department: "Sales",         phone: "+44 7000 000007" },
    { name: "Demo Client",      email: "client@msdsolicitors.co.uk",      role: "client",      department: "Client Portal", phone: "+44 7000 000008" },
  ];

  const users = {};
  for (const u of usersData) {
    let user = await User.findOne({ email: u.email });
    if (!user) {
      user = await User.create({ ...u, password: SEED_PASSWORD });
      console.log(`✅ User  [${u.role.padEnd(11)}] ${u.name}`);
    } else {
      console.log(`⏭  User  [${u.role.padEnd(11)}] ${u.name} (exists)`);
    }
    users[u.role] = user;
  }
  // keep admin ref by name
  users.izzah  = await User.findOne({ email: "admin@msdsolicitors.co.uk" });
  users.hassan = await User.findOne({ email: "solicitor@msdsolicitors.co.uk" });

  // ── 2. Clients ──────────────────────────────────────────────────────────────
  const clientsData = [
    { firstName: "Amina",     lastName: "Rahim",    email: "amina.rahim@example.com",    phone: "+44 7900 111001", nationality: "Bangladeshi",  dateOfBirth: "1990-03-12", amlStatus: "clear",   identityVerified: true,  marketingConsent: true  },
    { firstName: "David",     lastName: "Mensah",   email: "david.mensah@example.com",   phone: "+44 7900 111002", nationality: "Ghanaian",     dateOfBirth: "1985-07-22", amlStatus: "high",    identityVerified: true,  marketingConsent: false },
    { firstName: "Hana",      lastName: "Fadel",    email: "hana.fadel@example.com",     phone: "+44 7900 111003", nationality: "Syrian",       dateOfBirth: "1993-11-05", amlStatus: "high",    identityVerified: false, marketingConsent: false },
    { firstName: "Nana",      lastName: "Osei",     email: "nana.osei@example.com",      phone: "+44 7900 111004", nationality: "Nigerian",     dateOfBirth: "1988-06-18", amlStatus: "medium",  identityVerified: true,  marketingConsent: true  },
    { firstName: "Zara",      lastName: "Virk",     email: "zara.virk@example.com",      phone: "+44 7900 111005", nationality: "Pakistani",    dateOfBirth: "1995-01-30", amlStatus: "clear",   identityVerified: true,  marketingConsent: true  },
    { firstName: "Lena",      lastName: "Nowak",    email: "lena.nowak@example.com",     phone: "+44 7900 111006", nationality: "Polish",       dateOfBirth: "1991-09-14", amlStatus: "clear",   identityVerified: true,  marketingConsent: true  },
    { firstName: "Seun",      lastName: "Adeyemi",  email: "seun.adeyemi@example.com",   phone: "+44 7900 111007", nationality: "Nigerian",     dateOfBirth: "1987-04-25", amlStatus: "medium",  identityVerified: true,  marketingConsent: false },
    { firstName: "Fatima",    lastName: "Beshir",   email: "fatima.beshir@example.com",  phone: "+44 7900 111008", nationality: "Somali",       dateOfBirth: "1996-12-08", amlStatus: "pending", identityVerified: false, marketingConsent: false },
  ];

  const clients = {};
  for (const c of clientsData) {
    let client = await Client.findOne({ email: c.email });
    if (!client) {
      client = await Client.create({ ...c, createdBy: users.izzah._id, portalActive: Math.random() > 0.5 });
      console.log(`✅ Client  ${c.firstName} ${c.lastName}`);
    } else {
      console.log(`⏭  Client  ${c.firstName} ${c.lastName} (exists)`);
    }
    clients[c.lastName.toLowerCase()] = client;
  }

  // ── 3. Cases ────────────────────────────────────────────────────────────────
  const casesData = [
    { ref: "RR.0126.3401.SV-LTR",  client: "rahim",   type: "Spouse Visa — LTR",           stage: "Awaiting UKVI Decision", status: "awaiting_decision", risk: "low",    fee: 1800, outstanding: 900,  keyDate: "2026-07-21" },
    { ref: "RR.1225.3388.ASY-LTR",  client: "mensah",  type: "Asylum — Leave to Remain",    stage: "FTT Bundle Preparation", status: "open",              risk: "high",   fee: 2500, outstanding: 1200, keyDate: "2026-07-23" },
    { ref: "ZK.1125.3390.FLR-M",    client: "fadel",   type: "FLR(M) — Spouse",             stage: "Documents Gathering",    status: "pending",           risk: "medium", fee: 1500, outstanding: 750,  keyDate: "2026-07-26" },
    { ref: "HK.0425.3260.ASY-LTR",  client: "osei",    type: "Asylum — LTR",                stage: "Interview Preparation",  status: "open",              risk: "high",   fee: 3000, outstanding: 0,    keyDate: "2026-08-03" },
    { ref: "AY.0526.3441.FAM-CH",   client: "virk",    type: "Family — Child Arrangements", stage: "Mediation",              status: "open",              risk: "high",   fee: 4500, outstanding: 2000, keyDate: "2026-08-07" },
    { ref: "SF.0725.3489.SPS-LTR",  client: "nowak",   type: "Spouse Visa — Entry Clearance",stage: "Application Submitted", status: "pending",           risk: "low",    fee: 1800, outstanding: 900,  keyDate: "2026-09-01" },
    { ref: "SF.0624.3201.EEA-PR",   client: "adeyemi", type: "EEA — Permanent Residence",   stage: "Evidence Review",        status: "open",              risk: "medium", fee: 1200, outstanding: 600,  keyDate: "2026-08-15" },
    { ref: "RR.0726.3512.ASY-HTR",  client: "beshir",  type: "Asylum — FTT Hearing",        stage: "Hearing Bundle",         status: "open",              risk: "high",   fee: 3500, outstanding: 1750, keyDate: "2026-07-28" },
  ];

  const caseMap = {};
  for (const c of casesData) {
    let cas = await Case.findOne({ reference: c.ref });
    if (!cas) {
      const clientDoc = clients[c.client];
      if (!clientDoc) { console.log(`⚠ Client not found for case ${c.ref}`); continue; }
      cas = await Case.create({
        reference:      c.ref,
        clientId:       clientDoc._id,
        assignedTo:     users.hassan._id,
        supervisedBy:   users["supervisor"]._id,
        createdBy:      users.izzah._id,
        type:           c.type,
        stage:          c.stage,
        status:         c.status,
        risk:           c.risk,
        fee:            c.fee,
        outstanding:    c.outstanding,
        keyDate:        new Date(c.keyDate),
        openedAt:       new Date(Date.now() - Math.random() * 180 * 86400000),
        conflictCheckDone: true,
        cddComplete:    c.risk !== "pending",
        supervisionCadence: c.risk === "high" ? "monthly" : "6weekly",
        nextSupervisionDate: new Date(c.keyDate),
        tags: [c.type.split(" ")[0]],
      });
      console.log(`✅ Case  ${c.ref}`);
    } else {
      console.log(`⏭  Case  ${c.ref} (exists)`);
    }
    caseMap[c.ref] = cas;
  }

  // ── 4. Tasks ────────────────────────────────────────────────────────────────
  const firstCase = Object.values(caseMap)[0];
  if (firstCase) {
    const tasksData = [
      { title: "Upload client passport copy",      status: "completed", priority: "high",   dueDate: "2026-07-18" },
      { title: "Complete AML re-screening",        status: "todo",      priority: "high",   dueDate: "2026-07-24" },
      { title: "Draft FTT bundle",                 status: "in_progress",priority: "urgent",dueDate: "2026-07-22" },
      { title: "Send client care letter",          status: "completed", priority: "medium", dueDate: "2026-07-15" },
      { title: "Record supervision (RR files)",    status: "overdue",   priority: "high",   dueDate: "2026-07-10" },
      { title: "Chase payment — Amina Rahim",      status: "todo",      priority: "medium", dueDate: "2026-07-25" },
    ];
    for (const t of tasksData) {
      const exists = await Task.findOne({ title: t.title, caseId: firstCase._id });
      if (!exists) {
        await Task.create({
          title:      t.title,
          caseId:     firstCase._id,
          assignedTo: users.hassan._id,
          createdBy:  users.izzah._id,
          status:     t.status,
          priority:   t.priority,
          dueDate:    new Date(t.dueDate),
          completedAt: t.status === "completed" ? new Date() : undefined,
        });
        console.log(`✅ Task  ${t.title}`);
      }
    }
  }

  // ── 5. Invoices ─────────────────────────────────────────────────────────────
  const firstCaseArr = Object.values(caseMap);
  for (let i = 0; i < Math.min(3, firstCaseArr.length); i++) {
    const cas = firstCaseArr[i];
    const exists = await Invoice.findOne({ caseId: cas._id });
    if (!exists) {
      await Invoice.create({
        caseId:    cas._id,
        clientId:  cas.clientId,
        createdBy: users.izzah._id,
        lines:     [{ description: `${cas.type} — professional fees`, quantity: 1, unitPrice: cas.fee, total: cas.fee }],
        subtotal:  cas.fee,
        vatAmount: 0,
        total:     cas.fee,
        paid:      cas.fee - cas.outstanding,
        outstanding: cas.outstanding,
        status:    cas.outstanding > 0 ? "partial" : "paid",
        dueAt:     new Date(Date.now() + 30 * 86400000),
      });
      console.log(`✅ Invoice  for case ${cas.reference}`);
    }
  }

  // ── 6. Leads ────────────────────────────────────────────────────────────────
  const leadsData = [
    { firstName: "Ahmad",  lastName: "Karimi",   type: "Spouse Visa",         source: "website",  status: "new",          notes: "Enquired about spouse visa requirements" },
    { firstName: "Maria",  lastName: "Santos",   type: "Family Reunion",      source: "referral", status: "contacted",    notes: "Referred by existing client" },
    { firstName: "James",  lastName: "Okonkwo",  type: "Asylum",              source: "walk_in",  status: "consultation", consultationDate: "2026-07-24", notes: "Urgent — has upcoming interview" },
    { firstName: "Priya",  lastName: "Sharma",   type: "Skilled Worker Visa", source: "website",  status: "instructed",   notes: "Ready to proceed" },
    { firstName: "Omar",   lastName: "Hassan",   type: "Student Visa",        source: "social_media", status: "new",       notes: "University starting September" },
    { firstName: "Elena",  lastName: "Popescu",  type: "EEA — Settled Status",source: "referral", status: "lost",         notes: "Went with another firm" },
  ];

  for (const l of leadsData) {
    const exists = await Lead.findOne({ email: `${l.firstName.toLowerCase()}.${l.lastName.toLowerCase()}@example.com` });
    if (!exists) {
      await Lead.create({
        ...l,
        email:      `${l.firstName.toLowerCase()}.${l.lastName.toLowerCase()}@example.com`,
        phone:      "+44 7900 " + Math.floor(200000 + Math.random() * 799999),
        assignedTo: users["sales"]._id,
        createdBy:  users["sales"]._id,
        consultationDate: l.consultationDate ? new Date(l.consultationDate) : undefined,
        estimatedFee: Math.floor(1000 + Math.random() * 3000),
      });
      console.log(`✅ Lead  ${l.firstName} ${l.lastName} — ${l.type}`);
    } else {
      console.log(`⏭  Lead  ${l.firstName} ${l.lastName} (exists)`);
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ Seed complete");
  console.log(`🔑 Password for all users: ${SEED_PASSWORD}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\nUser logins:");
  usersData.forEach((u) => console.log(`  ${u.role.padEnd(12)} → ${u.email}`));

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
