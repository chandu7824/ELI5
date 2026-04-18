const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: "../.env" });

// Use the same connection logic as your main app
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is not defined in .env file");
  process.exit(1);
}

console.log("📡 Connecting to MongoDB...");

const client = new MongoClient(MONGO_URI);

async function createSpecificAdmin() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("eli5");

    const adminEmail = "admin_eli5@gmail.com";
    const adminUsername = "admin";
    const adminPassword = "admin@123";

    const existingAdmin = await db.collection("users").findOne({
      $or: [{ email: adminEmail }, { username: adminUsername }],
    });

    if (existingAdmin) {
      console.log("⚠️ Admin user already exists!");
      console.log("📧 Email:", adminEmail);
      console.log("👤 Username:", adminUsername);
      console.log("👑 Role:", existingAdmin.role);
      await client.close();
      process.exit();
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const adminUser = {
      username: adminUsername,
      email: adminEmail,
      passwordHash: passwordHash,
      profile: {
        avatar: "",
        bio: "System Administrator - ELI5 Platform",
      },
      stats: {
        totalQuestions: 0,
        totalAnswers: 0,
        reputationScore: 1000,
      },
      role: "admin",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("users").insertOne(adminUser);

    console.log("\n✅ Admin user created successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 Email:", adminEmail);
    console.log("👤 Username:", adminUsername);
    console.log("🔑 Password:", adminPassword);
    console.log("🆔 Admin ID:", result.insertedId);
    console.log("👑 Role: admin");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    await client.close();
    process.exit();
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    await client.close();
    process.exit(1);
  }
}

createSpecificAdmin();
