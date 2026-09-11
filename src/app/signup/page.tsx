'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SignupPage() {
  const [bakeryName, setBakeryName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          bakery_name: bakeryName,
        }
      }
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] p-4">
      <div className="max-w-md w-full bg-[var(--bg-card)] p-8 rounded-xl shadow-lg border border-[var(--border)]">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🥐</div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Join Doughnomics</h1>
          <p className="text-[var(--text-primary)] opacity-70">Start managing your bakery costs for free</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-6">
          <div>
            <label className="block text-[var(--text-primary)] text-sm font-medium mb-2" htmlFor="bakeryName">
              Bakery Name
            </label>
            <input
              id="bakeryName"
              type="text"
              value={bakeryName}
              onChange={(e) => setBakeryName(e.target.value)}
              className="w-full px-4 py-2 bg-[var(--bg-base)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              required
            />
          </div>

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
              minLength={6}
              className="w-full px-4 py-2 bg-[var(--bg-base)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-500 text-sm text-center font-medium">
              Check your email for a confirmation link!
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || success}
            className="w-full bg-[var(--accent)] text-[var(--text-primary)] font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-[var(--accent-dim)] hover:text-[var(--accent)] text-sm">
            Already have an account? Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
