import bcrypt from 'bcryptjs';
import { query } from '../config/database';

async function createAdmin() {
  const email = 'liliana@vainybliss.com';
  const password = 'Lili@2001';
  const name = 'Liliana';

  // Generar hash
  const hashedPassword = await bcrypt.hash(password, 12);

  console.log('Creando admin...', { email, name });

  try {
    // Verificar si ya existe
    const existing = await query('SELECT id FROM public.users WHERE email = $1', [email]);

    if (existing.rows.length > 0) {
      // Actualizar password y role
      await query(
        'UPDATE public.users SET password = $1, role = $2 WHERE email = $3',
        [hashedPassword, 'admin', email]
      );
      console.log('✅ Admin actualizado');
    } else {
      // Crear nuevo
      await query(
        `INSERT INTO public.users (name, email, password, role)
         VALUES ($1, $2, $3, $4)`,
        [name, email, hashedPassword, 'admin']
      );
      console.log('✅ Admin creado');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

createAdmin();
