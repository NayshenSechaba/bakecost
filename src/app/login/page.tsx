'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] p-4">
      <div className="max-w-md w-full bg-[var(--bg-card)] p-8 rounded-xl shadow-lg border border-[var(--border)]">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🥐</div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Doughnomics</h1>
          <p className="text-[var(--text-primary)] opacity-70">Your bakery's financial command centre</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-6">
          <div>
            <label className="block text-[var(--text-primary)] text-sm font-medium mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-[var(--bg-base)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              required
            />
          </div>

          <div>
            <label className="block text-[var(--text-primary)] text-sm font-medium mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-[var(--bg-base)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[var(--accent)] text-[var(--text-primary)] font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <div>
            <Link href="/signup" className="text-[var(--accent-dim)] hover:text-[var(--accent)] text-sm">
              Don't have an account? Sign Up
            </Link>
          </div>
          <div>
            <Link href="/pricing" className="text-[var(--accent-dim)] hover:text-[var(--accent)] text-sm">
              View Pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
