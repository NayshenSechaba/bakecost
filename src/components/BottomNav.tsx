'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBasket,
  BookOpen,
  Scale,
  Package,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/ingredients', icon: ShoppingBasket, label: 'Ingredients' },
  { href: '/recipes', icon: BookOpen, label: 'Recipes' },
  { href: '/scale', icon: Scale, label: 'Scale' },
  { href: '/inventory', icon: Package, label: 'Inventory' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link key={href} href={href} className={`nav-item${active ? ' active' : ''}`}>
            <span className="nav-icon">
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            </span>
            <span className="nav-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
