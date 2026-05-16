'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Props {
  active?: 'home' | 'features' | 'pricing' | 'about';
}

const CHECK_PATH = 'M5 12l4 4 10-10';
const ARROW_PATH = 'M5 12h14M13 6l6 6-6 6';

function LogoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={16} height={16} style={{ color: 'white' }}>
      <path d={CHECK_PATH} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={13} height={13}>
      <path d={ARROW_PATH} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function MarketingNav({ active }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
      <div className="container nav-inner">
        <Link href="/" className="logo">
          <span className="logo-mark"><LogoIcon /></span>
          <span>Tesifye</span>
        </Link>

        <div className="nav-links">
          <Link href="/#features" className={active === 'features' ? 'active' : ''}>Features</Link>
          <Link href="/pricing"   className={active === 'pricing'  ? 'active' : ''}>Pricing</Link>
          <Link href="/about"     className={active === 'about'    ? 'active' : ''}>About</Link>
        </div>

        <div className="nav-cta">
          <Link href="/login"    className="btn btn-ghost btn-sm">Sign in</Link>
          <Link href="/register" className="btn btn-primary btn-sm">
            Try free <ArrowIcon />
          </Link>
        </div>
      </div>
    </nav>
  );
}
