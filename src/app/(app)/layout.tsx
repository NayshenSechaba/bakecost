'use client';

import React from 'react';
import BottomNav from '@/components/BottomNav';
import { AuthProvider, useAuth } from '@/lib/contexts/AuthContext';

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="app-shell flex-center" style={{ minHeight: '100dvh' }}>
        <div className="spinner" style={{ borderTopColor: 'var(--accent)', width: 36, height: 36, borderWidth: 3 }} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="page-content">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </AuthProvider>
  );
}
