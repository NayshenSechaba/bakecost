'use client';

import React from 'react';
import { useAuth } from './AuthProvider';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export function AdBanner() {
  const { plan, loading } = useAuth();

  if (loading || plan !== 'free') {
    return null;
  }

  return (
    <div className="w-full border border-[#E3DED6] bg-white rounded-xl py-3 px-4 mb-4 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-sand-200 text-slate-600">
          Sponsored
        </span>
        <span className="text-xs text-slate-600 font-medium">
          Doughnomics Free Plan
        </span>
      </div>
      <Link
        href="/pricing"
        className="text-xs font-bold text-[#C68A4C] hover:underline flex items-center gap-1"
      >
        <Sparkles size={13} /> Remove ads
      </Link>
    </div>
  );
}
