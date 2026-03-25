'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Search,
  Upload, X, ImageIcon, Save
} from 'lucide-react';
import { Product, Category, ApiResponse } from '@/types';
import api, { getImageUrl } from '@/lib/api';
import toast from 'react-hot-toast';

type Mode = 'list' | 'create' | 'edit';

const emptyForm = {
  name: '', description: '', price: '', stock: '', category_id: '', is_active: true,
};

export default function AdminProductsPage() {
  const [mode, setMode] = useState<Mode>('list');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ ...emptyForm });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get<ApiResponse<Product[]>>(`/products/admin?limit=50${search ? `&search=${search}` : ''}`),
        api.get<ApiResponse<Category[]>>('/categories/admin'),
      ]);
      setProducts(prodRes.data.data || []);
      setCategories(catRes.data.data || []);
    } catch { toast.error('Error cargando productos'); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, [search]);

  const openCreate = () => {
    setForm({ ...emptyForm });
    setEditingProduct(null);
    setMode('create');
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      stock: String(product.stock),
      category_id: product.category_id || '',
      is_active: product.is_active,
    });
    setMode('edit');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) { toast.error('Nombre y precio son requeridos'); return; }
    setIsSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        price: parseFloat(form.price),
        stock: parseInt(form.stock) || 0,
        category_id: form.category_id || undefined,
        is_active: form.is_active,
      };
      if (mode === 'create') {
        await api.post('/products', payload);
        toast.success('Producto creado ✅');
      } else if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
        toast.success('Producto actualizado ✅');
      }
      setMode('list');
      fetchData();
    } catch (error: unknown) {
      toast.error((error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al guardar');
    } finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Producto eliminado');
      fetchData();
    } catch { toast.error('Error al eliminar'); }
  };

  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/products/${id}/toggle`);
      fetchData();
    } catch { toast.error('Error al cambiar estado'); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;
    setUploadingImage(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      await api.post(`/products/${editingProduct.id}/images`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Imagen subida ✅');
      // Refresh product
      const { data } = await api.get<ApiResponse<Product>>(`/products/${editingProduct.id}`);
      setEditingProduct(data.data!);
    } catch { toast.error('Error al subir imagen'); } finally { setUploadingImage(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!editingProduct) return;
    try {
      await api.delete(`/products/${editingProduct.id}/images/${imageId}`);
      const { data } = await api.get<ApiResponse<Product>>(`/products/${editingProduct.id}`);
      setEditingProduct(data.data!);
      toast.success('Imagen eliminada');
    } catch { toast.error('Error al eliminar imagen'); }
  };

  // ─── Form View ─────────────────────────────────────────────
  if (mode === 'create' || mode === 'edit') {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-3">
          <button onClick={() => setMode('list')} className="btn-ghost py-1.5 px-3 text-sm">← Volver</button>
          <h1 className="text-xl font-bold text-gray-900">{mode === 'create' ? 'Nuevo producto' : 'Editar producto'}</h1>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="card p-6 space-y-4">
            <div>
              <label className="label">Nombre *</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre del producto" required />
            </div>
            <div>
              <label className="label">Descripción</label>
              <textarea className="input resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción del producto..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Precio *</label>
                <input type="number" step="0.01" min="0" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" required />
              </div>
              <div>
                <label className="label">Stock</label>
                <input type="number" min="0" className="input" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="0" />
              </div>
            </div>
            <div>
              <label className="label">Categoría</label>
              <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">Sin categoría</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 text-emerald-500" />
              <label htmlFor="is_active" className="text-sm text-gray-700 cursor-pointer">Producto activo (visible en la tienda)</label>
            </div>
          </div>

          {/* Images - only when editing */}
          {mode === 'edit' && editingProduct && (
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-500" />
                Imágenes
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {editingProduct.images?.map((img) => (
                  <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden bg-emerald-50">
                    <Image src={getImageUrl(img.url)} alt="Producto" fill className="object-cover" />
                    {img.is_primary && (
                      <div className="absolute top-1 left-1 bg-emerald-500 text-white text-xs px-1.5 py-0.5 rounded-full">Principal</div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.id)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingImage}
                  className="aspect-square rounded-xl border-2 border-dashed border-emerald-200 hover:border-emerald-400 flex flex-col items-center justify-center gap-1 text-emerald-400 hover:text-emerald-600 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-xs">{uploadingImage ? 'Subiendo...' : 'Añadir'}</span>
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <p className="text-xs text-gray-400">JPG, PNG, WebP • Máx 5MB por imagen</p>
            </div>
          )}

          {mode === 'create' && (
            <div className="card p-4 bg-amber-50 border-amber-200">
              <p className="text-xs text-amber-700">💡 Guarda el producto primero y luego podrás subir imágenes desde la opción Editar.</p>
            </div>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={isSaving} className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />
              {isSaving ? 'Guardando...' : 'Guardar producto'}
            </button>
            <button type="button" onClick={() => setMode('list')} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </div>
    );
  }

  // ─── List View ─────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Productos</h1>
          <p className="text-sm text-gray-500">{products.length} productos</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm py-2.5">
          <Plus className="w-4 h-4" /> Nuevo producto
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input pl-9" placeholder="Buscar productos..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="card p-4 animate-pulse h-16" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 card">
          <Plus className="w-10 h-10 mx-auto text-emerald-200 mb-3" />
          <p className="text-gray-500">No hay productos. ¡Crea el primero!</p>
          <button onClick={openCreate} className="btn-primary mt-4 text-sm py-2.5">Crear producto</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Producto</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Categoría</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Precio</th>
                <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Estado</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 rounded-lg overflow-hidden flex-shrink-0">
                        {product.primary_image ? (
                          <Image src={getImageUrl(product.primary_image)} alt={product.name} width={40} height={40} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-4 h-4 text-emerald-300" /></div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[140px]">{product.name}</p>
                        <p className="text-xs text-gray-400">Stock: {product.stock}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <span className="text-sm text-gray-600">{product.category_name || '—'}</span>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-emerald-600">${Number(product.price).toFixed(2)}</span>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className={product.is_active ? 'badge-green' : 'badge-gray'}>
                      {product.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleToggle(product.id)} title={product.is_active ? 'Desactivar' : 'Activar'} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        {product.is_active ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                      </button>
                      <button onClick={() => openEdit(product)} className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors">
                        <Pencil className="w-4 h-4 text-blue-500" />
                      </button>
                      <button onClick={() => handleDelete(product.id, product.name)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
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
    </div>
  );
}
