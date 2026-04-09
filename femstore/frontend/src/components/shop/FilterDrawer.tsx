'use client';
import { X, Check } from 'lucide-react';
import { Category } from '@/types';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  onClear: () => void;
  hasFilters: boolean;
}

export default function FilterDrawer({
  isOpen,
  onClose,
  categories,
  selectedCategory,
  onSelectCategory,
  onClear,
  hasFilters,
}: FilterDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className="fixed right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-gray-900 z-50 shadow-2xl flex flex-col animate-slide-in-right border-l border-gray-200 dark:border-gray-700"
        role="dialog"
        aria-label="Filtros"
        aria-modal="true"
      >
        <header className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Filtros</h2>
          <button
            onClick={onClose}
            className="btn-ghost p-1.5"
            aria-label="Cerrar filtros"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-6">
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              Categorías
            </h3>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => {
                    onSelectCategory('');
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded-xl transition-colors ${
                    !selectedCategory
                      ? 'bg-blush-50 dark:bg-blush-900/30 text-blush-700 dark:text-blush-300 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  Todas las categorías
                  {!selectedCategory && <Check className="w-4 h-4" aria-hidden="true" />}
                </button>
              </li>
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <li key={cat.id}>
                    <button
                      onClick={() => {
                        onSelectCategory(cat.id);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded-xl transition-colors ${
                        isActive
                          ? 'bg-blush-50 dark:bg-blush-900/30 text-blush-700 dark:text-blush-300 font-semibold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {cat.name}
                      {isActive && <Check className="w-4 h-4" aria-hidden="true" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {hasFilters && (
          <footer className="border-t border-gray-100 dark:border-gray-800 p-5">
            <button
              onClick={() => {
                onClear();
                onClose();
              }}
              className="btn-secondary w-full"
            >
              Limpiar filtros
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}
