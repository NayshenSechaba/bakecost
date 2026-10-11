import React, { createContext, useContext, useState, useCallback } from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/lib/theme';

type Toast = { id: number; message: string; type: 'success' | 'error' | 'info' };
let toastId = 0;

const ToastContext = createContext<{
  addToast: (msg: string, type?: Toast['type']) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <View style={styles.container} pointerEvents="none">
        {toasts.map((t) => (
          <View
            key={t.id}
            style={[
              styles.toast,
              t.type === 'success' && styles.success,
              t.type === 'error' && styles.error,
            ]}
          >
            <Text style={[
              styles.text,
              t.type === 'success' && styles.successText,
              t.type === 'error' && styles.errorText,
            ]}>
              {t.message}
            </Text>
          </View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  toast: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.sand200,
    shadowColor: COLORS.slate900,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    maxWidth: 350,
  },
  text: { fontSize: 14, fontWeight: '500', color: COLORS.slate900, textAlign: 'center' },
  success: { borderColor: COLORS.success, backgroundColor: COLORS.successBg },
  successText: { color: COLORS.success },
  error: { borderColor: COLORS.danger, backgroundColor: COLORS.dangerBg },
  errorText: { color: COLORS.danger },
});
