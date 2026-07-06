'use client';
import { useState, useEffect, useCallback } from 'react';
import { Bell, ShoppingCart, AlertTriangle, Info, Check, CheckCheck } from 'lucide-react';
import { Notification, NotificationType, ApiResponse, Pagination } from '@/types';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const TYPE_CONFIG: Record<NotificationType, { icon: typeof Bell; label: string; color: string }> = {
  new_order:    { icon: ShoppingCart,  label: 'Pedido',  color: 'text-blush-400 bg-blush-500/10' },
  out_of_stock: { icon: AlertTriangle, label: 'Agotado', color: 'text-amber-400 bg-amber-400/10' },
  system:       { icon: Info,          label: 'Sistema', color: 'text-blue-400 bg-blue-400/10' },
};

const timeAgo = (date: string): string => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'hace un momento';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} día${days === 1 ? '' : 's'}`;
  return new Date(date).toLocaleDateString('es-ES');
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (unreadOnly) params.set('unread_only', 'true');
      const { data } = await api.get<ApiResponse<Notification[]>>(`/notifications?${params.toString()}`);
      setNotifications(data.data || []);
      if (data.pagination) setPagination(data.pagination);
    } catch { toast.error('Error cargando notificaciones'); } finally { setIsLoading(false); }
  }, [page, unreadOnly]);

  useEffect(() => { setPage(1); }, [unreadOnly]);
  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch { toast.error('Error al marcar como leída'); }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      toast.success('Todas marcadas como leídas');
      fetchNotifications();
    } catch { toast.error('Error al marcar todas'); }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Notificaciones</h1>
          <p className="text-sm text-gray-500">{pagination?.total ?? '—'} en total</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="btn-secondary flex items-center gap-2 text-sm py-2">
            <CheckCheck className="w-4 h-4" /> Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[{ value: false, label: 'Todas' }, { value: true, label: 'No leídas' }].map((opt) => (
          <button
            key={String(opt.value)}
            onClick={() => setUnreadOnly(opt.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
              unreadOnly === opt.value
                ? 'bg-blush-500 text-white border-blush-500'
                : 'bg-[var(--color-surface)] text-gray-400 border-[var(--color-border)] hover:border-blush-500/50 hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="bg-[var(--color-surface)] rounded-2xl p-4 animate-pulse h-20" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
          <Bell className="w-10 h-10 mx-auto text-blush-400/40 mb-3" />
          <p className="text-gray-500">{unreadOnly ? 'No hay notificaciones sin leer' : 'No hay notificaciones todavía'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const conf = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
            const Icon = conf.icon;
            return (
              <div
                key={n.id}
                className={`bg-[var(--color-surface)] border rounded-2xl p-4 flex items-start gap-3 transition-colors ${
                  n.is_read ? 'border-[var(--color-border)] opacity-70' : 'border-blush-500/40'
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${conf.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-100">{n.title}</p>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-blush-500 flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{timeAgo(n.created_at)}</p>
                </div>
                {!n.is_read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    title="Marcar como leída"
                    className="p-1.5 hover:bg-[var(--color-surface-alt)] rounded-lg transition-colors flex-shrink-0"
                  >
                    <Check className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">← Anterior</button>
          <span className="text-sm text-gray-500 self-center">Página {page} de {pagination.totalPages}</span>
          <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Siguiente →</button>
        </div>
      )}
    </div>
  );
}
