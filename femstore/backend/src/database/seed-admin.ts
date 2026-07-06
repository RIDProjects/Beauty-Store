import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from '../config/database';

const hashEmail = (email: string): string => {
  const key = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'fallback-dev-key';
  return crypto.createHmac('sha256', key).update(email.toLowerCase().trim()).digest('hex');
};

async function createAdmin() {
  const email = 'liliana@vainybliss.com';
  const password = 'Lili@2001';
  const name = 'Liliana';
  const emailHash = hashEmail(email);
  const hashedPassword = await bcrypt.hash(password, 12);

  console.log('🌱 Seeding admin user...');

  try {
    // Look up by email (plaintext) OR by email_hash — handles both old and new records
    const existing = await query(
      'SELECT id FROM public.users WHERE email = $1 OR email_hash = $2',
      [email, emailHash]
    );

    if (existing.rows.length > 0) {
      // Always refresh password, role, and email_hash (backfills NULL email_hash for old records)
      await query(
        'UPDATE public.users SET password = $1, role = $2, email_hash = $3 WHERE email = $4 OR email_hash = $5',
        [hashedPassword, 'admin', emailHash, email, emailHash]
      );
    } else {
      await query(
        `INSERT INTO public.users (name, email, email_hash, password, role)
         VALUES ($1, $2, $3, $4, 'admin')`,
        [name, email, emailHash, hashedPassword]
      );
    }
    console.log('✅ Admin ready');
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }

  process.exit(0);
}

createAdmin();
