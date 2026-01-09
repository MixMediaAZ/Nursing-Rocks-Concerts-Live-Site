import "dotenv/config";
import { eq, sql } from "drizzle-orm";
import { db, pool } from "../server/db";
import { users } from "../shared/schema";

async function main() {
  const emailArg = process.argv[2];
  const email = (emailArg || process.env.ADMIN_EMAIL || "").trim();

  if (!email) {
    console.error("Usage: tsx scripts/promote-admin.ts <email>  (or set ADMIN_EMAIL)");
    process.exit(1);
  }

  // Promote ALL users matching this email case-insensitively.
  // (Postgres UNIQUE is case-sensitive, so duplicates can exist by casing.)
  const updatedRows = await db
    .update(users)
    .set({ is_admin: true })
    .where(sql`lower(${users.email}) = lower(${email})`)
    .returning({ id: users.id, email: users.email, is_admin: users.is_admin });

  if (!updatedRows.length) {
    console.error("No user found with that email. Create the user first, then promote.");
    process.exit(2);
  }

  console.log("Promoted user(s) to admin:", updatedRows.map((u) => ({ id: u.id, email: u.email, is_admin: u.is_admin })));
}

main()
  .catch((err) => {
    console.error("Failed to promote admin:", err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end().catch(() => {});
  });


