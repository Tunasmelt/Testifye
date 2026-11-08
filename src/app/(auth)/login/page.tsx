'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// useSearchParams must be inside a Suspense boundary for static generation
function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  // Sanitise redirect: only allow relative paths (prevents open-redirect)
  const rawRedirect = params.get('redirect') ?? '';
  const redirect = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/dashboard';

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (authError) throw authError;
      router.push(redirect);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <LogoMark />
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Tesi<span style={{ color: 'var(--accent-2)' }}>fye</span>
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-1)' }}>Sign in to your workspace</p>
      </div>

      {/* Card */}
      <div className="tf-card" style={{ padding: '28px 28px 24px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="tf-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="tf-input"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="tf-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="tf-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: 'var(--error)', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, padding: '10px 12px' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="tf-btn tf-btn-primary"
            disabled={loading}
            style={{ marginTop: 4 }}
          >
            {loading && <Spinner />}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="tf-divider" style={{ margin: '20px 0' }} />

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-1)' }}>
          No account?{' '}
          <Link href="/signup" style={{ color: 'var(--accent-2)', fontWeight: 600 }}>
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ width: 400 }} />}>
      <LoginForm />
    </Suspense>
  );
}

function LogoMark() {
  return (
    <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, var(--accent), var(--accent-3))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(139,92,246,0.4)' }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M4 8h8M8 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="tf-spin" style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
