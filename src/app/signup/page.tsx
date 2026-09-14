'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { Building2, Mail, Lock, ArrowRight, Loader2, CheckCircle, Sparkles } from 'lucide-react';

function SignupForm() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const isInvited = searchParams.get('invited') === 'true' || Boolean(emailParam);

  const [bakeryName, setBakeryName] = useState('');
  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (emailParam && !email) {
      setEmail(emailParam);
    }
  }, [emailParam, email]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          bakery_name: isInvited ? undefined : (bakeryName.trim() || 'My Bakery'),
        }
      }
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-lg w-full bg-white p-8 sm:p-11 rounded-3xl shadow-md border-2 border-[#D8D2C9]">
      {/* Logo & Header */}
      <div className="text-center mb-9 flex flex-col items-center">
        <div className="flex justify-center mb-3">
          <Image
            src="/logo.png"
            alt="Doughnomic"
            width={320}
            height={52}
            className="h-14 sm:h-16 w-auto object-contain"
            priority
          />
        </div>
        <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#C68A4C] mt-1">
          know what every bake really costs
        </p>
      </div>

      {isInvited && (
        <div className="mb-6 p-3.5 rounded-xl bg-[#EAF5EC] border border-[#C3E6CB] text-slate-800 flex items-start gap-2.5">
          <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-emerald-800 block">Team Invitation Detected</span>
            <span>You're accepting an invite to join a bakery workspace. Set your password to complete account setup.</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSignUp} className="space-y-4">
        {!isInvited && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="bakeryName">
              Bakery Name
            </label>
            <div className="auth-input-wrapper">
              <div className="auth-input-icon">
                <Building2 size={17} />
              </div>
              <input
                id="bakeryName"
                type="text"
                placeholder="e.g. Sunrise Artisan Bakery"
                value={bakeryName}
                onChange={(e) => setBakeryName(e.target.value)}
                className="auth-input-field"
                required={!isInvited}
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="email">
            Email Address
          </label>
          <div className="auth-input-wrapper">
            <div className="auth-input-icon">
              <Mail size={17} />
            </div>
            <input
              id="email"
              type="email"
              placeholder="baker@example.co.za"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input-field"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="password">
            Password (min. 6 characters)
          </label>
          <div className="auth-input-wrapper">
            <div className="auth-input-icon">
              <Lock size={17} />
            </div>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              className="auth-input-field"
              required
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[#FBEAEB] border border-[#F5C2C7] text-[#A32D2D] text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl bg-[#EAF5EC] border border-[#C3E6CB] text-[#1E7E34] text-xs font-medium text-center flex items-center justify-center gap-2">
            <CheckCircle size={16} className="text-[#1E7E34] flex-shrink-0" />
            <span>Check your email inbox for a confirmation link!</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || success}
          className="w-full bg-[#26221F] hover:bg-[#38332E] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 text-sm flex items-center justify-center gap-2 mt-2 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> {isInvited ? 'Joining Team…' : 'Creating Account…'}
            </>
          ) : (
            <>
              {isInvited ? 'Accept Invite & Join Team' : 'Create Free Account'} <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-[#E3DED6] text-center space-y-2.5">
        <div>
          <span className="text-xs text-slate-500 mr-1.5">Already have an account?</span>
          <Link href="/login" className="text-xs font-bold text-[#C68A4C] hover:underline">
            Sign In
          </Link>
        </div>
        {!isInvited && (
          <div>
            <Link href="/pricing" className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors">
              View Pricing & Plans →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F1EC] p-4 sm:p-6 font-sans">
      <Suspense fallback={<div className="text-xs text-slate-400">Loading signup...</div>}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
