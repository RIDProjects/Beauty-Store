'use server';

import { revalidatePath } from 'next/cache';

/**
 * Invalida el caché ISR de la home y de la tienda.
 * Llamar después de cualquier mutación admin (create/update/delete/toggle)
 * sobre productos o categorías para que los cambios se vean al instante
 * en las páginas públicas sin esperar el revalidate de 60s/300s.
 */
export async function revalidateStorefront() {
  revalidatePath('/', 'layout');
  revalidatePath('/shop/products');
}
