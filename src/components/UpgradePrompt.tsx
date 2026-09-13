'use client';

import React from 'react';
import { Lock, X } from 'lucide-react';
import Link from 'next/link';

interface UpgradePromptProps {
  feature: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradePrompt({ feature, isOpen, onClose }: UpgradePromptProps) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-sheet" style={{ maxWidth: '420px' }}>
        <div className="modal-handle" />
        <div className="flex flex-col items-center text-center p-2">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAEEDA] text-[#854F0B] shadow-sm">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="mb-2 text-xl font-extrabold text-slate-900">Upgrade to Unlock</h2>
          <p className="mb-6 text-sm text-slate-600 leading-relaxed">
            The <strong>{feature}</strong> feature is available exclusively on paid Doughnomics plans.
          </p>
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <Link
              href="/pricing"
              className="btn btn-primary flex-1 py-3"
              onClick={onClose}
            >
              View Plans
            </Link>
            <button
              onClick={onClose}
              className="btn btn-secondary flex-1 py-3"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
