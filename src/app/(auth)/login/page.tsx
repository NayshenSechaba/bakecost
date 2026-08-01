'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast, ToastContainer } from '@/components/Toast';
import { LogIn, Key, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toasts, addToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      addToast('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (error) {
      addToast(error.message, 'error');
      setLoading(false);
    } else {
      addToast('Logged in successfully!', 'success');
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 800);
    }
  }

  return (
    <div className="auth-page">
      <ToastContainer toasts={toasts} />

      <div className="auth-logo">
        <div className="auth-logo-icon">🥐</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>BakeCost</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>True cost & pricing for bakers</p>
      </div>

      <div className="auth-card">
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, textAlign: 'center' }}>Welcome Back</h2>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type="email"
                placeholder="e.g. baker@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: 40 }}
              />
              <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: 40 }}
              />
              <Key size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <div className="spinner" /> : <LogIn size={18} />}
            {loading ? 'Logging in…' : 'Sign In'}
          </button>
        </form>

        <div className="divider" style={{ margin: '12px 0' }} />

        <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>
          New bakery?{' '}
          <Link href="/signup" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
            Register your bakery
          </Link>
        </p>
      </div>
    </div>
  );
}
