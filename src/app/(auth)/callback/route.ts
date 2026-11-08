import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * OAuth callback handler — exchanges auth code for a session.
 * Prepared for Google OAuth (Phase 5) but unused until then.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code   = url.searchParams.get('code');
  const rawNext = url.searchParams.get('next') ?? '/dashboard';
  const origin  = url.origin;

  // Prevent open redirect: must start with '/' and not be protocol-relative (//)
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_callback_failed`);
}
