import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/migrate - Check migration status
export async function GET() {
  try {
    const tables = await query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    return NextResponse.json({ 
      success: true, 
      tables: tables.rows.map(r => r.table_name),
      message: 'Las tablas se crean automáticamente en la primera petición'
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 });
  }
}