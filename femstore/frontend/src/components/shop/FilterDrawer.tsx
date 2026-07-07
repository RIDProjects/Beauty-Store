'use client';
import { useEffect } from 'react';
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
  // Escape + bloqueo de scroll del body mientras el drawer está abierto
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer — se mantiene montado para animar la salida */}
      <aside
        className={`fixed right-0 top-0 h-full w-full max-w-sm bg-[var(--color-surface)] z-50 shadow-2xl flex flex-col border-l border-[var(--color-border)] transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-label="Filtros"
        aria-modal="true"
        aria-hidden={!isOpen}
      >
        <header className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-bold text-[var(--color-text)]">Filtros</h2>
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
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
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
                      : 'text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]'
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
                          : 'text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]'
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
          <footer className="border-t border-[var(--color-border)] p-5">
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
