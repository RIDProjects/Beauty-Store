'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize);
  const [checkedReturn, setCheckedReturn] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (checkedReturn) return;
    
    const justCompletedOrder = localStorage.getItem('justCompletedOrder');
    if (justCompletedOrder) {
      localStorage.removeItem('justCompletedOrder');
      toast.success('¡Pedido enviado! El vendedor te contactará pronto 💬');
      setCheckedReturn(true);
    }
  }, [checkedReturn]);

  return <>{children}</>;
}
