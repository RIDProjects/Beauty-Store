import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../../config/database';
import { User, JwtPayload } from '../../common/types';
import { encrypt, decrypt, tryDecrypt } from '../../common/encryption';

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResult {
  user: Omit<User, 'password'>;
  token: string;
}

// Deterministic hash of email for indexed lookup — never stored in plaintext
const hashEmail = (email: string): string => {
  const key = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'fallback-dev-key';
  return crypto.createHmac('sha256', key).update(email.toLowerCase().trim()).digest('hex');
};

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET not set');
    return 'dev-secret-key-do-not-use-in-production';
  }
  return secret;
};

const decryptValue = (value: string | undefined): string | undefined => {
  if (!value) return value;
  return tryDecrypt(value);
};

export class AuthService {
  async register(dto: RegisterDto): Promise<AuthResult> {
    const decryptedPassword = decryptValue(dto.password) || dto.password;
    const decryptedEmail = decryptValue(dto.email) || dto.email;
    const emailHash = hashEmail(decryptedEmail);
    const hashedPassword = await bcrypt.hash(decryptedPassword, 12);

    try {
      const result = await query(
        `INSERT INTO users (name, email, email_hash, password, phone, role)
         VALUES ($1, $2, $3, $4, $5, 'customer')
         RETURNING id, name, email, phone, role, is_active, created_at, updated_at`,
        [dto.name, dto.email, emailHash, hashedPassword, dto.phone || null]
      );

      const user = result.rows[0] as Omit<User, 'password'>;
      const token = this.generateToken(user as User, decryptedEmail);

      return {
        user: {
          ...user,
          email: decrypt(user.email),
          phone: user.phone ? decrypt(user.phone) : undefined,
        },
        token,
      };
    } catch (error: unknown) {
      if ((error as { code?: string }).code === '23505') {
        throw new Error('Este email ya está registrado');
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const decryptedEmail = decryptValue(dto.email) || dto.email;
    const decryptedPassword = decryptValue(dto.password) || dto.password;
    const emailHash = hashEmail(decryptedEmail);

    // O(1) indexed lookup — no full table scan
    const result = await query(
      'SELECT * FROM users WHERE email_hash = $1 AND is_active = TRUE',
      [emailHash]
    );

    if (result.rows.length === 0) throw new Error('Credenciales inválidas');

    const user = result.rows[0] as User;

    const isPasswordValid = await bcrypt.compare(decryptedPassword, user.password);
    if (!isPasswordValid) throw new Error('Credenciales inválidas');

    const { password: _, ...userWithoutPassword } = user;
    const token = this.generateToken(user, decryptedEmail);

    return {
      user: {
        ...userWithoutPassword,
        email: decrypt(userWithoutPassword.email),
        phone: userWithoutPassword.phone ? decrypt(userWithoutPassword.phone) : undefined,
      },
      token,
    };
  }

  async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    const result = await query(
      'SELECT id, name, email, phone, role, is_active, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) throw new Error('Usuario no encontrado');

    const user = result.rows[0] as Omit<User, 'password'>;
    return {
      ...user,
      email: decrypt(user.email),
      phone: user.phone ? decrypt(user.phone) : undefined,
    };
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string }): Promise<Omit<User, 'password'>> {
    const encryptedPhone = data.phone ? encrypt(data.phone) : null;

    const result = await query(
      `UPDATE users SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        updated_at = NOW()
       WHERE id = $3
       RETURNING id, name, email, phone, role, is_active, created_at, updated_at`,
      [data.name || null, encryptedPhone, userId]
    );

    const user = result.rows[0] as Omit<User, 'password'>;
    return {
      ...user,
      email: decrypt(user.email),
      phone: user.phone ? decrypt(user.phone) : undefined,
    };
  }

  private generateToken(user: Omit<User, 'password'>, plainEmail: string): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: plainEmail,
      role: user.role,
    };

    return jwt.sign(payload, getJwtSecret(), {
      expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as jwt.SignOptions['expiresIn'],
    });
  }
}
