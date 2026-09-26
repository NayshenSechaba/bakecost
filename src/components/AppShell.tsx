'use client';

import BottomNav from '@/components/BottomNav';
import SidebarNav from '@/components/SidebarNav';
import { AuthProvider } from '@/components/AuthProvider';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="app-layout">
        <SidebarNav />
        <div className="main-content">
          <div className="page-content">
            {children}
          </div>
        </div>
        <BottomNav />
      </div>
    </AuthProvider>
  );
}
