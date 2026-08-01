'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast, ToastContainer } from '@/components/Toast';
import { Store, UserPlus, Key, Mail, CheckCircle } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toasts, addToast } = useToast();

  const [bakeryName, setBakeryName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!bakeryName.trim() || !email.trim() || !password.trim()) {
      addToast('Please fill in all fields', 'error');
      return;
    }
    if (password.length < 6) {
      addToast('Password must be at least 6 characters', 'error');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: {
          bakery_name: bakeryName.trim(),
        },
      },
    });

    if (error) {
      addToast(error.message, 'error');
      setLoading(false);
    } else {
      addToast('Sign up successful!', 'success');
      if (data?.session) {
        // Verification was disabled, user is immediately logged in
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 1000);
      } else {
        // Verification is active, user needs to confirm email
        setCompleted(true);
      }
    }
  }

  if (completed) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: 48, color: 'var(--success)', marginBottom: 16 }}>
            <CheckCircle size={56} style={{ margin: '0 auto' }} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px 0' }}>Confirm Your Email</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 24px 0' }}>
            We've sent a verification link to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>. 
            Please check your inbox (and spam folder) to complete registering <strong style={{ color: 'var(--accent)' }}>{bakeryName}</strong>.
          </p>
          <Link href="/login" className="btn btn-primary btn-full">
            Back to Sign In
          </Link>
        </div>
      </div>
    );
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
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, textAlign: 'center' }}>Create Bakery Account</h2>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label className="input-label">Bakery Name</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                placeholder="e.g. Flour & Sugar"
                value={bakeryName}
                onChange={(e) => setBakeryName(e.target.value)}
                required
                style={{ paddingLeft: 40 }}
              />
              <Store size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

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
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: 40 }}
              />
              <Key size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <div className="spinner" /> : <UserPlus size={18} />}
            {loading ? 'Creating account…' : 'Register Bakery'}
          </button>
        </form>

        <div className="divider" style={{ margin: '12px 0' }} />

        <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>
          Already registered?{' '}
          <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
