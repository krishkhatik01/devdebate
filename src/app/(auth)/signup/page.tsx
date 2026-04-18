'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Terminal, User, Mail, Lock, Loader2 } from 'lucide-react';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signup, loginWithGoogle, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await signup(email, password, name);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] dark:bg-[#0a0a0b] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-[#111113] dark:bg-[#111113] border border-[rgba(255,255,255,0.08)] rounded-2xl p-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-strong)] mb-4">
            <Terminal size={20} className="text-[var(--accent-primary)]" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-2">
            Create Account
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            Join DevDebate and start exploring AI-powered dev tools
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-[var(--accent-danger)]/10 border border-[var(--accent-danger)]/30 text-[var(--accent-danger)] text-sm">
            {error}
          </div>
        )}

        {/* Google Sign Up */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-[rgba(255,255,255,0.12)] text-[var(--text-primary)] font-medium hover:bg-[rgba(255,255,255,0.05)] transition-all disabled:opacity-50 mb-4"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign up with Google
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border-strong)]" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-[#111113] text-[var(--text-muted)]">or create with email</span>
          </div>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 h-11 rounded-lg bg-[#0a0a0b] border border-[rgba(255,255,255,0.1)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:shadow-[0_0_0_3px_rgba(0,212,255,0.15)] transition-all"
                placeholder="John Doe"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 h-11 rounded-lg bg-[#0a0a0b] border border-[rgba(255,255,255,0.1)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:shadow-[0_0_0_3px_rgba(0,212,255,0.15)] transition-all"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 h-11 rounded-lg bg-[#0a0a0b] border border-[rgba(255,255,255,0.1)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:shadow-[0_0_0_3px_rgba(0,212,255,0.15)] transition-all"
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 h-11 rounded-lg bg-[#0a0a0b] border border-[rgba(255,255,255,0.1)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:shadow-[0_0_0_3px_rgba(0,212,255,0.15)] transition-all"
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-lg bg-[var(--accent-primary)] text-[#0a0a0b] font-semibold hover:scale-[1.01] hover:brightness-110 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Login Link */}
        <p className="mt-6 text-center text-[var(--text-secondary)] text-sm">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-[var(--accent-primary)] hover:underline font-medium"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
