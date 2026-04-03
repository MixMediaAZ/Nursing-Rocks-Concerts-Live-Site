/**
 * Admin User Creation Script
 * Creates or updates an admin user in the database
 * Usage: npx tsx scripts/create-admin.ts
 */

import { db } from "../server/db";
import { users } from "@shared/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

const ADMIN_EMAIL = "MixMediaAZ@gmail.com";
const ADMIN_PASSWORD = "HomeRunBall1!";
const SALT_ROUNDS = 10;

async function createAdmin() {
  try {
    console.log(`Creating admin user: ${ADMIN_EMAIL}`);

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, ADMIN_EMAIL))
      .limit(1);

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);

    if (existingUser.length > 0) {
      // Update existing user to admin
      console.log("User exists, updating to admin status...");
      const updated = await db
        .update(users)
        .set({
          is_admin: true,
          password_hash: passwordHash,
          is_suspended: false,
        })
        .where(eq(users.email, ADMIN_EMAIL))
        .returning();

      console.log("✅ Admin user updated successfully!");
      console.log(`   Email: ${updated[0].email}`);
      console.log(`   Admin: ${updated[0].is_admin}`);
      console.log(`   Verified: ${updated[0].is_verified}`);
    } else {
      // Create new user as admin
      console.log("User does not exist, creating new admin user...");
      const created = await db
        .insert(users)
        .values({
          email: ADMIN_EMAIL,
          password_hash: passwordHash,
          first_name: "Admin",
          last_name: "User",
          is_admin: true,
          is_verified: true, // Admin users are pre-verified
        })
        .returning();

      console.log("✅ Admin user created successfully!");
      console.log(`   Email: ${created[0].email}`);
      console.log(`   Admin: ${created[0].is_admin}`);
      console.log(`   Verified: ${created[0].is_verified}`);
    }

    console.log("\n✅ Admin setup complete!");
    console.log(`\nYou can now login at /login with:`);
    console.log(`  Email: ${ADMIN_EMAIL}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log(`\nThen visit /admin to access the admin dashboard.`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  }
}

createAdmin();
