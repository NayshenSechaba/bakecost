import BottomNav from '@/components/BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <div className="page-content">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
