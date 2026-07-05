'use client';

import { useState, useCallback } from 'react';

type Toast = { id: number; message: string; type: 'success' | 'error' | 'info' };

let toastId = 0;
let addToastGlobal: ((msg: string, type?: Toast['type']) => void) | null = null;

export function toast(message: string, type: Toast['type'] = 'info') {
  if (addToastGlobal) addToastGlobal(message, type);
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  addToastGlobal = addToast;

  return { toasts, addToast };
}

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="toast-wrap">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
