'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [success, setSuccess]         = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      if (authError) throw authError;
      setSuccess(true);
      // If email confirmation is disabled in Supabase, redirect immediately
      setTimeout(() => router.push('/dashboard'), 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign up failed. Please try again.');
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
        <p style={{ fontSize: 13, color: 'var(--text-1)' }}>Create your free workspace</p>
      </div>

      <div className="tf-card" style={{ padding: '28px 28px 24px' }}>
        {success ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Account created!</div>
            <div style={{ fontSize: 13, color: 'var(--text-1)' }}>Redirecting to your dashboard…</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="tf-label" htmlFor="name">Display Name</label>
              <input
                id="name"
                type="text"
                className="tf-input"
                placeholder="Jane Smith"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoFocus
              />
            </div>
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
              />
            </div>
            <div>
              <label className="tf-label" htmlFor="password">Password <span className="tf-label-hint">(min 8 chars)</span></label>
              <input
                id="password"
                type="password"
                className="tf-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            {error && (
              <div style={{ fontSize: 12, color: 'var(--error)', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, padding: '10px 12px' }}>
                {error}
              </div>
            )}

            <button type="submit" className="tf-btn tf-btn-primary" disabled={loading} style={{ marginTop: 4 }}>
              {loading && <Spinner />}
              {loading ? 'Creating account…' : 'Get Started Free'}
            </button>

            <p style={{ fontSize: 11, color: 'var(--text-2)', textAlign: 'center', lineHeight: 1.5 }}>
              By signing up you agree to our terms of service.
            </p>
          </form>
        )}

        {!success && (
          <>
            <div className="tf-divider" style={{ margin: '20px 0' }} />
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-1)' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: 'var(--accent-2)', fontWeight: 600 }}>Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
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
