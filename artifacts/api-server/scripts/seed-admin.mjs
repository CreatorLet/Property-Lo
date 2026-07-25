/**
 * Creates the default admin account if one doesn't exist.
 * Run from workspace root: pnpm --filter @workspace/api-server run seed-admin
 *
 * Credentials are read from env vars:
 *   ADMIN_EMAIL    (default: admin@propertylo.ng)
 *   ADMIN_PASSWORD (default: Admin@12345 — CHANGE IN PRODUCTION)
 *   ADMIN_NAME     (default: Property Lo Admin)
 */
import bcrypt from "bcryptjs";
import pg from "pg";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌  DATABASE_URL not set");
  process.exit(1);
}

const EMAIL    = process.env.ADMIN_EMAIL    ?? "admin@propertylo.ng";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin@12345";
const NAME     = process.env.ADMIN_NAME     ?? "Property Lo Admin";

const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();

const { rows: existing } = await client.query(
  "SELECT id FROM users WHERE email = $1 LIMIT 1",
  [EMAIL.toLowerCase()]
);

if (existing.length > 0) {
  console.log("✅  Admin already exists:", EMAIL);
} else {
  const hash = await bcrypt.hash(PASSWORD, 12);
  await client.query(
    `INSERT INTO users (email, full_name, password_hash, role, status, is_verified)
     VALUES ($1, $2, $3, 'admin', 'active', true)`,
    [EMAIL.toLowerCase(), NAME, hash]
  );
  console.log("✅  Admin created");
  console.log("   Email:   ", EMAIL);
  console.log("   Password: [set via ADMIN_PASSWORD env var]");
}

await client.end();
