/**
 * DEV-ONLY: Promote a user to admin by email.
 *
 * Usage:
 *   node scripts/make-admin.mjs user@example.com
 *
 * The .dev-users.json file must exist (i.e., the user must have signed up first).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', '.dev-users.json');

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error('Usage: node scripts/make-admin.mjs <email>');
  process.exit(1);
}

if (!fs.existsSync(DB_PATH)) {
  console.error(`No .dev-users.json found. Have any users signed up yet?`);
  process.exit(1);
}

const users = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
const idx = users.findIndex((u) => u.email.toLowerCase() === email);

if (idx === -1) {
  console.error(`No user found with email: ${email}`);
  process.exit(1);
}

const prev = users[idx].role ?? 'user';
users[idx].role = 'admin';
fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2), 'utf-8');

console.log(`✓ ${users[idx].name} (${email}) promoted from "${prev}" → "admin"`);
console.log('  Sign out and back in for the new role to take effect.');
