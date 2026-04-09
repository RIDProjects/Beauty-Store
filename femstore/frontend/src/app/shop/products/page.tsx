'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import Header from '@/components/layout/Header';
import ProductCard from '@/components/shop/ProductCard';
import FilterDrawer from '@/components/shop/FilterDrawer';
import { Product, Category, ApiResponse, Pagination } from '@/types';
import api from '@/lib/api';
import { useSearchParams } from 'next/navigation';

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category_id') || '');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setSelectedCategory(searchParams.get('category_id') || '');
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get<ApiResponse<Category[]>>('/categories');
      setCategories(data.data || []);
    } catch { /* ignore */ }
  };

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (selectedCategory) params.set('category_id', selectedCategory);
      params.set('page', String(page));
      params.set('limit', '12');

      const { data } = await api.get<ApiResponse<Product[]>>(`/products?${params.toString()}`);
      setProducts(data.data || []);
      if (data.pagination) setPagination(data.pagination);
    } catch { /* ignore */ } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedCategory, page]);

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { setPage(1); }, [debouncedSearch, selectedCategory]);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setPage(1);
  };

  const hasFilters = search || selectedCategory;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="page-container py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="section-title">Tienda</h1>
            <p className="text-gray-500 dark:text-gray-400">Descubre todos nuestros productos</p>
          </div>

          {/* Filters Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input pl-9"
                />
              </div>

              {/* Filter button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="btn-secondary flex items-center gap-2 whitespace-nowrap"
                  aria-label="Abrir filtros"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filtros
                  {selectedCategory && (
                    <span className="ml-1 bg-blush-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">1</span>
                  )}
                </button>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2 rounded-lg text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-1 transition-colors"
                  >
                    <X className="w-3 h-3" /> Limpiar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results count */}
          {pagination && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {pagination.total} {pagination.total === 1 ? 'producto encontrado' : 'productos encontrados'}
            </p>
          )}

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="aspect-[3/4] bg-blush-50 dark:bg-gray-700" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-5 bg-blush-50 dark:bg-gray-600 rounded w-1/3 mt-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  <button
                    onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    disabled={page === 1}
                    className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
                  >
                    ← Anterior
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Página {page} de {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => { setPage((p) => Math.min(pagination.totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    disabled={page === pagination.totalPages}
                    className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-24 text-gray-400 dark:text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-3 text-blush-200" />
              <p className="font-medium">No se encontraron productos</p>
              <p className="text-sm mt-1">Intenta con otros filtros</p>
              {hasFilters && (
                <button onClick={clearFilters} className="btn-primary mt-4 text-sm py-2">
                  Ver todos los productos
                </button>
              )}
            </div>
          )}
        </div>
      </main>
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onClear={clearFilters}
        hasFilters={!!hasFilters}
      />
    </>
  );
}
