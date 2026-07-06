'use client';
import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Save } from 'lucide-react';
import { Category, ApiResponse } from '@/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { revalidateStorefront } from '@/app/actions/revalidate';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

type Mode = 'list' | 'create' | 'edit';

export default function AdminCategoriesPage() {
  const [mode, setMode] = useState<Mode>('list');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get<ApiResponse<Category[]>>('/categories/admin');
      setCategories(data.data || []);
    } catch { toast.error('Error cargando categorías'); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => { setForm({ name: '', description: '' }); setEditingCategory(null); setMode('create'); };
  const openEdit = (cat: Category) => { setEditingCategory(cat); setForm({ name: cat.name, description: cat.description || '' }); setMode('edit'); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error('El nombre es requerido'); return; }
    setIsSaving(true);
    try {
      if (mode === 'create') {
        await api.post('/categories', form);
        toast.success('Categoría creada ✅');
      } else if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, form);
        toast.success('Categoría actualizada ✅');
      }
      await revalidateStorefront();
      setMode('list');
      fetchCategories();
    } catch (error: unknown) {
      toast.error((error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al guardar');
    } finally { setIsSaving(false); }
  };

  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/categories/${id}/toggle`);
      await revalidateStorefront();
      fetchCategories();
    } catch { toast.error('Error al cambiar estado'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setDeleteTarget(null);
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Categoría eliminada');
      await revalidateStorefront();
      fetchCategories();
    } catch { toast.error('Error al eliminar'); }
  };

  if (mode === 'create' || mode === 'edit') {
    return (
      <div className="max-w-lg space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setMode('list')} className="btn-ghost py-1.5 px-3 text-sm">← Volver</button>
          <h1 className="text-xl font-bold text-white">{mode === 'create' ? 'Nueva categoría' : 'Editar categoría'}</h1>
        </div>
        <form onSubmit={handleSave} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 space-y-4">
          <div>
            <label className="label">Nombre *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Ropa, Accesorios..." required />
          </div>
          <div>
            <label className="label">Descripción <span className="text-gray-400 font-normal">(opcional)</span></label>
            <textarea className="input resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción de la categoría..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isSaving} className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />
              {isSaving ? 'Guardando...' : 'Guardar categoría'}
            </button>
            <button type="button" onClick={() => setMode('list')} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Categorías</h1>
          <p className="text-sm text-gray-500">{categories.length} categorías</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm py-2.5">
          <Plus className="w-4 h-4" /> Nueva categoría
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="bg-[var(--color-surface)] rounded-2xl p-4 animate-pulse h-14" />)}</div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
          <Plus className="w-10 h-10 mx-auto text-blush-400/40 mb-3" />
          <p className="text-gray-500">No hay categorías aún.</p>
          <button onClick={openCreate} className="btn-primary mt-4 text-sm py-2.5">Crear primera categoría</button>
        </div>
      ) : (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--color-surface-alt)] border-b border-[var(--color-border)]">
              <tr>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Descripción</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-[var(--color-surface-alt)] transition-colors">
                  <td className="p-4">
                    <p className="text-sm font-medium text-gray-100">{cat.name}</p>
                    <p className="text-xs text-gray-500 font-mono">{cat.slug}</p>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <p className="text-sm text-gray-400 truncate max-w-[200px]">{cat.description || '—'}</p>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      cat.is_active
                        ? 'text-green-400 bg-green-400/10'
                        : 'text-gray-500 bg-gray-500/10'
                    }`}>
                      {cat.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleToggle(cat.id)} title={cat.is_active ? 'Desactivar' : 'Activar'} className="p-1.5 hover:bg-[var(--color-surface-alt)] rounded-lg transition-colors">
                        {cat.is_active ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                      </button>
                      <button onClick={() => openEdit(cat)} className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors">
                        <Pencil className="w-4 h-4 text-blue-500" />
                      </button>
                      <button onClick={() => setDeleteTarget({ id: cat.id, name: cat.name })} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar categoría"
        message={`¿Eliminar la categoría "${deleteTarget?.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
