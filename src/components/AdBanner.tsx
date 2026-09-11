'use client';

import React from 'react';
import { useAuth } from './AuthProvider';
import Link from 'next/link';

export function AdBanner() {
  const { plan, loading } = useAuth();

  if (loading || plan !== 'free') {
    return null;
  }

  return (
    <div className="w-full border border-[var(--border)] bg-[var(--bg-elevated)] py-3 px-4 text-center">
      <p className="text-sm text-[var(--text-primary)]/70">
        <span className="font-semibold text-[var(--text-primary)]/50 mr-2">[Ad Space]</span> 
        — <Link href="/pricing" className="ml-1 text-[var(--accent)] hover:underline">Upgrade to remove ads</Link>
      </p>
    </div>
  );
}
