import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Schemas de validación
const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// GET /api/auth/me
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Token requerido' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; role: string };

    const result = await query(
      'SELECT id, name, email, phone, role, is_active, created_at FROM users WHERE id = $1',
      [payload.sub]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });
  }
}

// POST /api/auth/register
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pathname } = new URL(request.url);
    
    // Determinar si es registro o login basado en la ruta
    if (pathname.endsWith('/register')) {
      const validation = registerSchema.safeParse(body);
      if (!validation.success) {
        const errors = validation.error.issues.map(i => i.message).join(', ');
        return NextResponse.json({ success: false, error: errors }, { status: 400 });
      }

      const { name, email, password, phone } = validation.data;

      // Check if email exists
      const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (existing.rows.length > 0) {
        return NextResponse.json({ success: false, error: 'El email ya está registrado' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const result = await query(
        `INSERT INTO users (name, email, password, phone, role) 
         VALUES ($1, $2, $3, $4, 'customer') 
         RETURNING id, name, email, phone, role, is_active, created_at`,
        [name, email.toLowerCase(), hashedPassword, phone || null]
      );

      const user = result.rows[0];
      const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

      return NextResponse.json({ success: true, data: { user, token }, message: 'Registro exitoso' }, { status: 201 });
    } 
    else if (pathname.endsWith('/login')) {
      const validation = loginSchema.safeParse(body);
      if (!validation.success) {
        const errors = validation.error.issues.map(i => i.message).join(', ');
        return NextResponse.json({ success: false, error: errors }, { status: 400 });
      }

      const { email, password } = validation.data;

      const result = await query(
        'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Credenciales inválidas' }, { status: 401 });
      }

      const user = result.rows[0];
      const isValid = await bcrypt.compare(password, user.password);

      if (!isValid) {
        return NextResponse.json({ success: false, error: 'Credenciales inválidas' }, { status: 401 });
      }

      const { password: _, ...userWithoutPassword } = user;
      const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

      return NextResponse.json({ success: true, data: { user: userWithoutPassword, token }, message: 'Login exitoso' });
    }

    return NextResponse.json({ success: false, error: 'Ruta no encontrada' }, { status: 404 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}

// PUT /api/auth/profile
export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Token requerido' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };

    const body = await request.json();
    const { name, phone } = body;

    const result = await query(
      `UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone), updated_at = NOW() 
       WHERE id = $3 
       RETURNING id, name, email, phone, role, is_active, created_at`,
      [name || null, phone || null, payload.sub]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result.rows[0], message: 'Perfil actualizado' });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}