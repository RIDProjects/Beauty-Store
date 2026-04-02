import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/categories
export async function GET() {
  try {
    const result = await query(
      `SELECT * FROM categories WHERE is_active = TRUE ORDER BY name ASC`
    );

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json({ success: false, error: 'Error al obtener categorías' }, { status: 500 });
  }
}