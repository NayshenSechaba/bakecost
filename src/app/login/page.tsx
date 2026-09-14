'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F1EC] p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-[#E3DED6]">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2">
            <Image
              src="/logo.png"
              alt="Doughnomic"
              width={260}
              height={44}
              className="h-11 w-auto object-contain"
              priority
            />
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1 tracking-tight">
            know what every bake really costs
          </p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="password">
                Password
              </label>
            </div>
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#26221F] hover:bg-[#38332E] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 text-sm flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Signing in…
              </>
            ) : (
              <>
                Sign In <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#E3DED6] text-center space-y-2.5">
          <div>
            <span className="text-xs text-slate-500 mr-1.5">Don't have an account?</span>
            <Link href="/signup" className="text-xs font-bold text-[#C68A4C] hover:underline">
              Sign Up for Free
            </Link>
          </div>
          <div>
            <Link href="/pricing" className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors">
              View Pricing & Plans →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
