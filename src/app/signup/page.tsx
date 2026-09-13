'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Building2, Mail, Lock, ArrowRight, Loader2, CheckCircle } from 'lucide-react';

export default function SignupPage() {
  const [bakeryName, setBakeryName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          bakery_name: bakeryName,
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
    <div className="min-h-screen flex items-center justify-center bg-[#F4F1EC] p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-[#E3DED6]">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl mx-auto mb-3 shadow-xs">
            🥐
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Join Doughnomics
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Start managing your bakery costs and profits for free
          </p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="bakeryName">
              Bakery Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Building2 size={16} />
              </div>
              <input
                id="bakeryName"
                type="text"
                placeholder="e.g. Sunrise Artisan Bakery"
                value={bakeryName}
                onChange={(e) => setBakeryName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-sand-50 border border-[#E3DED6] rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white text-sm font-medium transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail size={16} />
              </div>
              <input
                id="email"
                type="email"
                placeholder="baker@example.co.za"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-sand-50 border border-[#E3DED6] rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white text-sm font-medium transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="password">
              Password (min. 6 characters)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={16} />
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                className="w-full pl-10 pr-4 py-2.5 bg-sand-50 border border-[#E3DED6] rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white text-sm font-medium transition-all"
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
            className="w-full bg-[#26221F] hover:bg-[#38332E] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 text-sm flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Creating Account…
              </>
            ) : (
              <>
                Create Free Account <ArrowRight size={16} />
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
