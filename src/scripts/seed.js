require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const SEED_PASSWORD = "MsdCms2026!";

const seedUsers = [
  {
    name: "Mohsin Masaud",
    email: "director@msdsolicitors.co.uk",
    password: SEED_PASSWORD,
    role: "director",
    department: "Management",
    phone: "+44 7000 000001",
  },
  {
    name: "Naveed Ahmed",
    email: "supervisor@msdsolicitors.co.uk",
    password: SEED_PASSWORD,
    role: "supervisor",
    department: "Legal",
    phone: "+44 7000 000002",
  },
  {
    name: "Hassan Ali",
    email: "solicitor@msdsolicitors.co.uk",
    password: SEED_PASSWORD,
    role: "fee_earner",
    department: "Immigration",
    phone: "+44 7000 000003",
  },
  {
    name: "Izzah Amal",
    email: "admin@msdsolicitors.co.uk",
    password: SEED_PASSWORD,
    role: "admin",
    department: "Administration",
    phone: "+44 7000 000004",
  },
  {
    name: "Zenab Hussain",
    email: "admin2@msdsolicitors.co.uk",
    password: SEED_PASSWORD,
    role: "admin",
    department: "Administration",
    phone: "+44 7000 000005",
  },
  {
    name: "Naveed Compliance",
    email: "compliance@msdsolicitors.co.uk",
    password: SEED_PASSWORD,
    role: "compliance",
    department: "Compliance",
    phone: "+44 7000 000006",
  },
  {
    name: "Zaheer Khan",
    email: "sales@msdsolicitors.co.uk",
    password: SEED_PASSWORD,
    role: "sales",
    department: "Sales",
    phone: "+44 7000 000007",
  },
  {
    name: "Demo Client",
    email: "client@msdsolicitors.co.uk",
    password: SEED_PASSWORD,
    role: "client",
    department: "Client Portal",
    phone: "+44 7000 000008",
  },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB\n");

  let created = 0;
  let updated = 0;

  for (const userData of seedUsers) {
    let user = await User.findOne({ email: userData.email });

    if (user) {
      // Existing user update karo (save() call karne se bcrypt password hashing hook trigger hoga)
      Object.assign(user, userData);
      await user.save();
      console.log(`🔄 Updated  [${userData.role.padEnd(11)}]  ${userData.name.padEnd(20)}  ${userData.email}`);
      updated++;
    } else {
      // New user create karo
      await User.create(userData);
      console.log(`✅ Created  [${userData.role.padEnd(11)}]  ${userData.name.padEnd(20)}  ${userData.email}`);
      created++;
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📋 Seed complete: ${created} created, ${updated} updated`);
  console.log(`🔑 Password for all users: ${SEED_PASSWORD}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  console.log(`Role         Email`);
  console.log(`─────────────────────────────────────────────────`);
  console.log(`director   → director@msdsolicitors.co.uk     (Mohsin Masaud)`);
  console.log(`supervisor → supervisor@msdsolicitors.co.uk   (Naveed Ahmed)`);
  console.log(`fee_earner → solicitor@msdsolicitors.co.uk    (Hassan Ali)`);
  console.log(`admin      → admin@msdsolicitors.co.uk        (Izzah Amal)`);
  console.log(`admin      → admin2@msdsolicitors.co.uk       (Zenab Hussain)`);
  console.log(`compliance → compliance@msdsolicitors.co.uk   (Naveed Compliance)`);
  console.log(`sales      → sales@msdsolicitors.co.uk        (Zaheer Khan)`);
  console.log(`client     → client@msdsolicitors.co.uk       (Demo Client)`);

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});