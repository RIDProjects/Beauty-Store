import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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

// Helper para desencriptar valores que pueden estar encriptados o no
const decryptValue = (value: string | undefined): string | undefined => {
  if (!value) return value;
  return tryDecrypt(value);
};

export class AuthService {
  async register(dto: RegisterDto): Promise<AuthResult> {
    // El email ya viene encriptado del frontend, lo guardamos directamente encriptado
    // Pero primero necesitamos verificar si ya existe
    // Como el email está encriptado, no podemos hacer búsqueda directa
    // Por ahora permitimos registros duplicados hasta tener índice de búsqueda
    // En producción,可以考虑 guardar un hash del email para búsqueda
    
    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // El email y phone ya vienen encriptados del frontend
    // Solo encriptamos el name por seguridad
    const encryptedName = encrypt(dto.name);

    // Create user with encrypted fields (email y phone ya encriptados, name encriptamos)
    const result = await query(
      `INSERT INTO users (name, email, password, phone, role)
       VALUES ($1, $2, $3, $4, 'customer')
       RETURNING id, name, email, phone, role, is_active, created_at, updated_at`,
      [encryptedName, dto.email, hashedPassword, dto.phone || null]
    );

    const user = result.rows[0] as Omit<User, 'password'>;
    
    // Desencriptar para respuesta
    const decryptedUser = {
      ...user,
      name: decrypt(user.name),
      email: decrypt(user.email),
      phone: user.phone ? decrypt(user.phone) : undefined,
    };
    
    const token = this.generateToken(user as User);

    return { user: decryptedUser, token };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    // El email llega encriptado desde el frontend, lo desencriptamos para buscar
    const decryptedEmail = decryptValue(dto.email) || dto.email;
    
    // Buscar usuario - el email en la DB está encriptado, comparamos con todos
    const result = await query(
      'SELECT * FROM users WHERE is_active = TRUE'
    );

    // Encontrar usuario comparando email desencriptado
    const userRow = result.rows.find((row) => {
      const storedEmail = tryDecrypt(row.email);
      return storedEmail.toLowerCase() === decryptedEmail.toLowerCase();
    });

    if (!userRow) {
      throw new Error('Credenciales inválidas');
    }

    const user = userRow as User;

    // Check password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas');
    }

    // Desencriptar campos sensibles para respuesta
    const { password: _, ...userWithoutPassword } = user;
    const decryptedUser = {
      ...userWithoutPassword,
      name: tryDecrypt(userWithoutPassword.name) || userWithoutPassword.name,
      email: decrypt(userWithoutPassword.email),
      phone: userWithoutPassword.phone ? decrypt(userWithoutPassword.phone) : undefined,
    };
    
    const token = this.generateToken(user);

    return { user: decryptedUser, token };
  }

  async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    const result = await query(
      'SELECT id, name, email, phone, role, is_active, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    const user = result.rows[0] as Omit<User, 'password'>;
    
    // Desencriptar campos sensibles
    return {
      ...user,
      name: tryDecrypt(user.name) || user.name,
      email: decrypt(user.email),
      phone: user.phone ? decrypt(user.phone) : undefined,
    };
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string }): Promise<Omit<User, 'password'>> {
    // Encriptar los nuevos valores
    const encryptedName = data.name ? encrypt(data.name) : null;
    const encryptedPhone = data.phone ? encrypt(data.phone) : null;

    const result = await query(
      `UPDATE users SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        updated_at = NOW()
       WHERE id = $3
       RETURNING id, name, email, phone, role, is_active, created_at, updated_at`,
      [encryptedName, encryptedPhone, userId]
    );

    const user = result.rows[0] as Omit<User, 'password'>;
    
    // Desencriptar para respuesta
    return {
      ...user,
      name: tryDecrypt(user.name) || user.name,
      email: decrypt(user.email),
      phone: user.phone ? decrypt(user.phone) : undefined,
    };
  }

  private generateToken(user: User): string {
    // Usar email desencriptado para el token
    const emailInToken = tryDecrypt(user.email) || user.email;
    
    const payload: JwtPayload = {
      sub: user.id,
      email: emailInToken,
      role: user.role,
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    } as jwt.SignOptions);
  }
}
