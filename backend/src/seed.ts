import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "./models/User";

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not set");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const existing = await User.countDocuments();
  if (existing > 0) {
    console.log(`Database already has ${existing} user(s). Skipping seed.`);
    await mongoose.disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash("admin123", 12);

  await User.create({
    name: "Admin",
    email: "admin@example.com",
    password: hashedPassword,
    role: "admin",
    status: true,
  });

  console.log("Admin user created:");
  console.log("  Email:    admin@example.com");
  console.log("  Password: admin123");

  await mongoose.disconnect();
  console.log("Done.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
