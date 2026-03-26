import bcrypt from 'bcryptjs';
import { query } from '../config/database';

async function createAdmin() {
  const email = 'admin@vainybliss.com';
  const password = 'Admin123!';
  const name = 'Admin Vainy Bliss';

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

    // También crear usuario de prueba
    const customerEmail = 'maria@test.com';
    const customerPassword = 'Customer123!';
    const customerHashed = await bcrypt.hash(customerPassword, 12);

    const customerExisting = await query('SELECT id FROM public.users WHERE email = $1', [customerEmail]);

    if (customerExisting.rows.length === 0) {
      await query(
        `INSERT INTO public.users (name, email, password, role)
         VALUES ($1, $2, $3, $4)`,
        ['Maria Rodriguez', customerEmail, customerHashed, 'customer']
      );
      console.log('✅ Usuario de prueba creado: maria@test.com / Customer123!');
    }

    console.log('\n=== CREDENCIALES ===');
    console.log('Admin: admin@vainybliss.com / Admin123!');
    console.log('Usuario: maria@test.com / Customer123!');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

createAdmin();
