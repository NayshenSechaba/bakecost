'use client';

import React from 'react';
import { Lock } from 'lucide-react';
import Link from 'next/link';

interface UpgradePromptProps {
  feature: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradePrompt({ feature, isOpen, onClose }: UpgradePromptProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-[var(--bg-surface)] p-6 shadow-xl border border-[var(--border)]">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/20 text-[var(--accent)]">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-[var(--text-primary)]">Upgrade to Unlock</h2>
          <p className="mb-6 text-sm text-[var(--text-primary)]/80">
            The {feature} feature is available on paid plans.
          </p>
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <Link
              href="/pricing"
              className="flex-1 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-[var(--accent)]/90"
              onClick={onClose}
            >
              View Plans
            </Link>
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated)]"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
