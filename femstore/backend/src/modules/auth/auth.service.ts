import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../../config/database';
import { User, JwtPayload } from '../../common/types';

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

export class AuthService {
  async register(dto: RegisterDto): Promise<AuthResult> {
    // Check if email already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [dto.email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('El email ya está registrado');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Create user
    const result = await query(
      `INSERT INTO users (name, email, password, phone, role)
       VALUES ($1, $2, $3, $4, 'customer')
       RETURNING id, name, email, phone, role, is_active, created_at, updated_at`,
      [dto.name, dto.email.toLowerCase(), hashedPassword, dto.phone || null]
    );

    const user = result.rows[0] as Omit<User, 'password'>;
    const token = this.generateToken(user as User);

    return { user, token };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    // Find user
    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
      [dto.email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw new Error('Credenciales inválidas');
    }

    const user = result.rows[0] as User;

    // Check password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas');
    }

    const { password: _, ...userWithoutPassword } = user;
    const token = this.generateToken(user);

    return { user: userWithoutPassword, token };
  }

  async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    const result = await query(
      'SELECT id, name, email, phone, role, is_active, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    return result.rows[0];
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string }): Promise<Omit<User, 'password'>> {
    const result = await query(
      `UPDATE users SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        updated_at = NOW()
       WHERE id = $3
       RETURNING id, name, email, phone, role, is_active, created_at, updated_at`,
      [data.name || null, data.phone || null, userId]
    );

    return result.rows[0];
  }

  private generateToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    } as jwt.SignOptions);
  }
}
