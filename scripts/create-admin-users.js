import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Admin user definitions (no passwords in code). Passwords must be set via environment:
//   ADMIN_PASSWORD_1  - password for first user (MixMediaAZ@gmail.com)
//   ADMIN_PASSWORD_2  - password for second user (Spencer.Coon@...)
const ADMIN_USERS = [
  {
    email: 'MixMediaAZ@gmail.com',
    passwordEnv: 'ADMIN_PASSWORD_1',
    first_name: 'MixMedia',
    last_name: 'Admin',
    is_admin: true,
    is_verified: true,
  },
  {
    email: 'Spencer.Coon@executiveelitegroup.com',
    passwordEnv: 'ADMIN_PASSWORD_2',
    first_name: 'Spencer',
    last_name: 'Coon',
    is_admin: true,
    is_verified: true,
  },
];

async function createAdminUsers() {
  try {
    console.log('Creating/updating admin users...\n');
    
    for (const adminUser of ADMIN_USERS) {
      const password = process.env[adminUser.passwordEnv];
      if (!password || password.trim() === '') {
        console.error(`❌ Missing ${adminUser.passwordEnv}. Set it in .env or environment and run again.`);
        process.exit(1);
      }
      const normalizedEmail = adminUser.email.toLowerCase().trim();
      
      // Check if user exists (case-insensitive)
      const existingUser = await pool.query(
        `SELECT id, email, is_admin FROM users WHERE LOWER(email) = LOWER($1)`,
        [normalizedEmail]
      );
      
      if (existingUser.rows.length > 0) {
        const user = existingUser.rows[0];
        console.log(`Found existing user: ${user.email}`);
        
        // Update password and admin status
        const passwordHash = await bcrypt.hash(password, 10);
        await pool.query(
          `UPDATE users 
           SET password_hash = $1, 
               is_admin = $2, 
               is_verified = $3,
               first_name = $4,
               last_name = $5
           WHERE id = $6`,
          [
            passwordHash,
            adminUser.is_admin,
            adminUser.is_verified,
            adminUser.first_name,
            adminUser.last_name,
            user.id,
          ]
        );
        console.log(`✅ Updated admin user: ${adminUser.email} (ID: ${user.id})`);
      } else {
        // Create new user
        const passwordHash = await bcrypt.hash(password, 10);
        const result = await pool.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, is_admin, is_verified)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, email`,
          [
            normalizedEmail,
            passwordHash,
            adminUser.first_name,
            adminUser.last_name,
            adminUser.is_admin,
            adminUser.is_verified,
          ]
        );
        console.log(`✅ Created admin user: ${adminUser.email} (ID: ${result.rows[0].id})`);
      }
    }
    
    console.log('\n✅ All admin users created/updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin users:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createAdminUsers();
