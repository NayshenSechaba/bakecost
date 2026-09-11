'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBasket,
  BookOpen,
  Scale,
  Package,
  AlertTriangle,
  BarChart3,
  Users,
  Settings,
  Sparkles,
  LogOut,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

const NAV_LINKS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/ingredients', icon: ShoppingBasket, label: 'Ingredients' },
  { href: '/recipes', icon: BookOpen, label: 'Recipes' },
  { href: '/scale', icon: Scale, label: 'Scale & Cost' },
  { href: '/inventory', icon: Package, label: 'Inventory' },
  { href: '/wastage', icon: AlertTriangle, label: 'Wastage Tracker' },
  { href: '/reports', icon: BarChart3, label: 'Reports & Analytics' },
  { href: '/team', icon: Users, label: 'Team Members' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userRole, plan, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const currentPlan = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Free';

  return (
    <aside className="sidebar-nav">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-logo">🥐</div>
          <div className="sidebar-brand-text">
            <span className="sidebar-title">Doughnomics</span>
            <span className="sidebar-subtitle">Bakery Command Centre</span>
          </div>
        </div>
      </div>

      {/* Quick Action */}
      <div className="sidebar-quick-action">
        <Link href="/recipes/new" className="btn btn-primary btn-full btn-sm">
          <Plus size={16} /> New Recipe
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-menu">
        <div className="sidebar-section-label">Main Menu</div>
        {NAV_LINKS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-link ${active ? 'active' : ''}`}
            >
              <span className="sidebar-icon">
                <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
              </span>
              <span className="sidebar-label">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Plan Card */}
      <div className="sidebar-plan-card">
        <div className="flex-between mb-1">
          <span className="text-xs uppercase font-bold text-[var(--text-muted)] tracking-wider">Plan</span>
          <span className={`badge ${plan === 'annual' ? 'badge-accent' : plan === 'monthly' ? 'badge-warning' : 'badge-secondary'}`} style={{ fontSize: 10 }}>
            {currentPlan}
          </span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mb-2.5">
          {plan === 'free' ? 'Unlock unlimited recipes & exports' : 'Full access enabled'}
        </p>
        {plan === 'free' ? (
          <Link href="/pricing" className="btn btn-secondary btn-full btn-sm" style={{ fontSize: 12, padding: '6px 10px' }}>
            <Sparkles size={13} color="var(--accent)" /> Upgrade Plan
          </Link>
        ) : (
          <Link href="/pricing" className="text-xs text-[var(--accent)] hover:underline block text-center">
            Manage Subscription
          </Link>
        )}
      </div>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name" title={user?.email || ''}>
              {user?.email || 'User'}
            </span>
            <span className="sidebar-user-role capitalize">{userRole || 'Member'}</span>
          </div>
          <button
            onClick={handleSignOut}
            className="sidebar-logout-btn"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
