'use client';

import BottomNav from '@/components/BottomNav';
import { AuthProvider } from '@/components/AuthProvider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="app-shell">
        <div className="page-content">
          {children}
        </div>
        <BottomNav />
      </div>
    </AuthProvider>
  );
}
