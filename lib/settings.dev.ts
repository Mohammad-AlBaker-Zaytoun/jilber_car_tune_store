/**
 * DEV-ONLY settings store — JSON file on disk.
 * Replace with a real database before production.
 */

import fs from 'fs';
import path from 'path';
import type { AdminSettings } from '@/types/admin';

const DB_PATH = path.join(process.cwd(), '.dev-settings.json');

const DEFAULTS: AdminSettings = {
  shopName: 'JILBER Performance',
  contactEmail: 'info@jilber.com',
  contactPhone: '+1 555 000 0000',
  address: '42 Performance Drive, Motorsport Park, CA 90210',
  currency: 'USD',
  taxRate: 10,
  bookingMessage:
    'Thank you for booking with JILBER. Our team will contact you within 24 hours to confirm your appointment.',
};

export function getSettings(): AdminSettings {
  try {
    if (!fs.existsSync(DB_PATH)) return DEFAULTS;
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<AdminSettings>) };
  } catch {
    return DEFAULTS;
  }
}

export function updateSettings(data: Partial<AdminSettings>): AdminSettings {
  const current = getSettings();
  const updated = { ...current, ...data };
  fs.writeFileSync(DB_PATH, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}
