'use client';

/**
 * Landing page — Task 1.17
 * Implemented from mockup: Mockups/landing.jsx
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { CountUp } from '@/components/marketing/CountUp';
import { useScrollReveal } from '@/components/marketing/useScrollReveal';

// ── SVG helpers ───────────────────────────────────────────────────────────────

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size} style={{ flexShrink: 0 }}>
      <path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ArrowIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function EyeIcon()     { return <svg viewBox="0 0 24 24" fill="none" width={32} height={32}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>; }
function SparkIcon()   { return <svg viewBox="0 0 24 24" fill="none" width={32} height={32}><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>; }
function ShieldIcon()  { return <svg viewBox="0 0 24 24" fill="none" width={32} height={32}><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>; }
function FlaskIcon()   { return <svg viewBox="0 0 24 24" fill="none" width={20} height={20} style={{ color: 'var(--accent-2)' }}><path d="M9 3h6M10 3v5l-5 11a2 2 0 002 3h10a2 2 0 002-3l-5-11V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function EyeSIcon()    { return <svg viewBox="0 0 24 24" fill="none" width={20} height={20} style={{ color: 'var(--accent-2)' }}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>; }
function BugIcon()     { return <svg viewBox="0 0 24 24" fill="none" width={20} height={20} style={{ color: 'var(--accent-2)' }}><rect x="7" y="9" width="10" height="11" rx="5" stroke="currentColor" strokeWidth="1.8"/><path d="M9 6l-1-2M15 6l1-2M3 13h4M17 13h4M5 9l3 1M19 9l-3 1M5 18l3-2M19 18l-3-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function UserIcon()    { return <svg viewBox="0 0 24 24" fill="none" width={20} height={20} style={{ color: 'var(--accent-2)' }}><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8"/></svg>; }
function LinkIcon()    { return <svg viewBox="0 0 24 24" fill="none" width={20} height={20} style={{ color: 'var(--accent-2)' }}><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7L11 7M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7L13 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function ChatIcon()    { return <svg viewBox="0 0 24 24" fill="none" width={20} height={20} style={{ color: 'var(--accent-2)' }}><path d="M21 12a8 8 0 01-11.5 7.2L4 21l1.8-5.5A8 8 0 1121 12z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>; }
function DataIcon()    { return <svg viewBox="0 0 24 24" fill="none" width={20} height={20} style={{ color: 'var(--accent-2)' }}><ellipse cx="12" cy="6" rx="8" ry="3" stroke="currentColor" strokeWidth="1.8"/><path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" stroke="currentColor" strokeWidth="1.8"/></svg>; }
function GlobeIcon()   { return <svg viewBox="0 0 24 24" fill="none" width={20} height={20} style={{ color: 'var(--accent-2)' }}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" stroke="currentColor" strokeWidth="1.8"/></svg>; }
function SparkSIcon()  { return <svg viewBox="0 0 24 24" fill="none" width={20} height={20} style={{ color: 'var(--accent-2)' }}><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>; }
function DownloadIcon(){ return <svg viewBox="0 0 24 24" fill="none" width={20} height={20} style={{ color: 'var(--accent-2)' }}><path d="M12 4v12m0 0l-5-5m5 5l5-5M5 20h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }

// ── Feature visuals ───────────────────────────────────────────────────────────

const TC_ITEMS = [
  { id: 'TC-001', title: 'User can sign in with valid credentials',     badge: 'high' },
  { id: 'TC-002', title: 'Card declined → friendly error + retry',      badge: 'crit' },
  { id: 'TC-003', title: 'Search with 0 results shows empty state',     badge: 'med'  },
  { id: 'TC-004', title: 'Cancel booking within 24h refunds in full',   badge: 'high' },
  { id: 'TC-005', title: 'Date picker rejects past dates',              badge: 'med'  },
];

function FeatTestCases() {
  return (
    <div className="feat-visual">
      {TC_ITEMS.map((it, i) => (
        <div key={it.id} className="fv-tcrow" style={{ animationDelay: `${i * 120 + 200}ms` }}>
          <span className="id">{it.id}</span>
          <span className="title">{it.title}</span>
          <span className={`badge ${it.badge}`}>{it.badge}</span>
        </div>
      ))}
    </div>
  );
}

function FeatUX() {
  const heights = [62, 78, 70, 88, 55, 72, 84, 92, 68, 80];
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setAnimated(true)),
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="feat-visual" ref={ref}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-2)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Score</div>
          <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em' }}>
            B+ <span style={{ fontSize: 14, color: 'var(--text-1)', fontWeight: 500 }}>78/100</span>
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--success)', fontFamily: 'JetBrains Mono, monospace' }}>↑ 4 this week</div>
      </div>
      <div className="fv-ux">
        {heights.map((h, i) => (
          <div
            key={i}
            className={`bar ${h > 80 ? 'tall' : h < 60 ? 'warn' : 'tall'}`}
            style={{ height: animated ? `${h}%` : '4%', transitionDelay: `${i * 50}ms` }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: 'var(--text-2)', fontFamily: 'JetBrains Mono, monospace' }}>
        {['H1','H2','H3','H4','H5','H6','H7','H8','H9','H10'].map(l => <span key={l}>{l}</span>)}
      </div>
    </div>
  );
}

function FeatBug() {
  const colors = ['#F87171', '#FBBF24', '#60A5FA', '#A78BFA'];
  const labels = [
    '[BUG] Stuck spinner on Apple Pay dismissal',
    '[BUG] Date picker mis-formats in fr-FR',
    '[BUG] CVV field missing tooltip',
    '[BUG] Search ignores diacritics on Pixel',
  ];
  return (
    <div className="feat-visual fv-bug-stream">
      {labels.map((l, i) => (
        <div key={i} className="fv-bug-pill" style={{ animationDelay: `${i * 1.2}s` }}>
          <span className="dot" style={{ background: colors[i] }} />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l}</span>
        </div>
      ))}
    </div>
  );
}

function FeatPersonas() {
  const ps = [
    { init: 'FT', label: 'First-time', score: 64 },
    { init: 'PU', label: 'Power user', score: 81 },
    { init: 'EL', label: 'Elder',      score: 52 },
    { init: 'LV', label: 'Low vision', score: 48 },
  ];
  return (
    <div className="feat-visual fv-personas">
      {ps.map((p, i) => (
        <div key={i} className="fv-persona">
          <div className="av">{p.init}</div>
          <div className="label">{p.label}</div>
          <div className="score">{p.score}</div>
        </div>
      ))}
    </div>
  );
}

function FeatLink() {
  const rows = [
    { req: 'Card payment via Stripe',  status: 'ok',   label: 'Verified'  },
    { req: 'Apple Pay support',        status: 'high',  label: 'Mismatch'  },
    { req: '3DS confirmation',         status: 'crit',  label: 'Missing'   },
    { req: 'Refund within 24h',        status: 'med',   label: 'Untested'  },
  ];
  return (
    <div className="feat-visual">
      {rows.map((r, i) => (
        <div key={i} className="fv-tcrow" style={{ animationDelay: `${i * 150}ms` }}>
          <span className="id">REQ-{i + 1}</span>
          <span className="title">{r.req}</span>
          <span className={`badge ${r.status}`}>{r.label}</span>
        </div>
      ))}
    </div>
  );
}

function FeatChat() {
  return (
    <div className="feat-visual" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ alignSelf: 'flex-end', maxWidth: '80%', background: 'var(--accent-glow)', border: '1px solid var(--accent-strong)', borderRadius: 12, padding: '8px 12px', fontSize: 12 }}>
        Why is my checkout test failing on Pixel?
      </div>
      <div style={{ alignSelf: 'flex-start', maxWidth: '85%', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', fontSize: 12, lineHeight: 1.5 }}>
        <strong style={{ color: 'var(--accent-2)' }}>Sidekick</strong> · Looking at your TC-002 logs — the Apple Pay sheet dispatches a{' '}
        <code style={{ background: 'var(--bg-3)', padding: '1px 5px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>onCancel</code>{' '}
        event your handler doesn&apos;t listen for. Add a dismissed case to your payment state machine.
      </div>
    </div>
  );
}

// ── Pipeline hero visual ──────────────────────────────────────────────────────

function PipelineVisual() {
  const stages = [
    { icon: <EyeIcon />,   label: <><b>Scout</b><br />analyzes screen</> },
    { icon: <SparkIcon />, label: <><b>Generator</b><br />writes tests</> },
    { icon: <ShieldIcon />, label: <><b>Judge</b><br />verifies output</> },
  ];

  return (
    <div className="hero-visual reveal-zoom" style={{ aspectRatio: 'auto', height: 460, marginTop: 0 }}>
      <div className="pipeline">
        <div className="pipeline-stream">
          <svg preserveAspectRatio="none" viewBox="0 0 800 4">
            <path d="M0 2 L800 2" />
          </svg>
        </div>
        {stages.map((s, i) => (
          <div key={i} className="pipeline-stage">
            <div className={`pipeline-node s${i + 1}`} style={{ color: 'var(--accent-2)' }}>
              {s.icon}
            </div>
            <div className="pipeline-label">{s.label}</div>
          </div>
        ))}
        <div className="pipeline-output">
          <span>TC-007</span> Card declined → retry CTA <span className="pipeline-cursor" />
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  useScrollReveal();

  return (
    <>
      <MarketingNav active="home" />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-grid-overlay" />
        </div>
        <div className="container hero-content">
          <span className="eyebrow reveal">AI testing partner · Live</span>
          <h1 className="reveal" style={{ ['--delay' as string]: '120ms' }}>
            <span className="serif gradient-text">Ship fewer bugs.</span>
            <span>Test like a senior QA in minutes.</span>
          </h1>
          <p className="hero-sub reveal" style={{ ['--delay' as string]: '240ms' }}>
            Tesifye turns your screens and PRDs into test cases, UX audits, bug reports, and persona walkthroughs —
            generated, verified, and ready for Jira. All powered by GROQ&apos;s sub-second LLMs.
          </p>
          <div className="hero-cta reveal" style={{ ['--delay' as string]: '360ms' }}>
            <Link href="/register" className="btn btn-primary">
              Get started free <ArrowIcon />
            </Link>
            <a href="#how" className="btn btn-ghost">See how it works</a>
          </div>
          <div className="hero-trust reveal" style={{ ['--delay' as string]: '480ms' }}>
            <span className="hero-trust-item"><CheckIcon />No credit card</span>
            <span className="hero-trust-item"><CheckIcon />10 features included</span>
            <span className="hero-trust-item"><CheckIcon />Sub-second responses</span>
            <span className="hero-trust-item"><CheckIcon />Export to Jira / Linear</span>
          </div>
          <PipelineVisual />
        </div>
      </section>

      {/* ── LOGOS ─────────────────────────────────────────────────────────── */}
      <section className="logos">
        <div className="container">
          <div className="logos-label">Trusted by QA teams shipping faster</div>
          <div className="logos-row">
            {['Pebble', 'Mosaic', 'Lumina', 'Drifter', 'Northwind', 'Halcyon', 'Catalyst'].map((n) => (
              <div key={n} className="logo-item">
                <span className="dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
                {n}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── METRICS ─────────────────────────────────────────────────────── */}
      <section className="section" style={{ paddingTop: 100, paddingBottom: 60 }}>
        <div className="container">
          <div className="metrics-grid reveal">
            <div className="metric"><div className="num"><CountUp to={94} suffix="%" /></div><div className="label">Faster test creation</div><div className="delta">vs. manual</div></div>
            <div className="metric"><div className="num"><CountUp to={3.2} suffix="x" /></div><div className="label">Bugs caught pre-prod</div><div className="delta">avg across pilots</div></div>
            <div className="metric"><div className="num"><CountUp to={580} suffix="ms" /></div><div className="label">Median response time</div><div className="delta">GROQ-powered</div></div>
            <div className="metric"><div className="num"><CountUp to={24} suffix="K+" /></div><div className="label">Tests generated weekly</div><div className="delta">across customers</div></div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="section" id="features">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">10 features, one project brain</span>
            <h2 style={{ marginTop: 20 }}>Every QA chore — <span className="serif">handled</span>.</h2>
            <p>From the first PRD page to the last bug ticket, Tesifye is the partner that knows your app as well as you do.</p>
          </div>

          <div className="feat-grid">
            {/* Test case generator — span 8 */}
            <div className="feat-card feat-span-8 reveal">
              <div className="feat-icon"><FlaskIcon /></div>
              <h3>Test Case Generator</h3>
              <p>Streams structured test cases — verified by a Judge model against your real screens. Functional, edge, negative, accessibility, performance.</p>
              <FeatTestCases />
            </div>

            {/* UX audit — span 4 */}
            <div className="feat-card feat-span-4 reveal" style={{ ['--delay' as string]: '120ms' }}>
              <div className="feat-icon"><EyeSIcon /></div>
              <h3>UX/UI Auditor</h3>
              <p>Nielsen heuristics + WCAG. Pixel-extracted contrast grounds the AI in real data.</p>
              <FeatUX />
            </div>

            {/* Bug — span 4 */}
            <div className="feat-card feat-span-4 reveal">
              <div className="feat-icon"><BugIcon /></div>
              <h3>Bug Report Formatter</h3>
              <p>Paste messy notes — get ticket-ready Jira / GitHub / Linear bugs.</p>
              <FeatBug />
            </div>

            {/* Personas — span 4 */}
            <div className="feat-card feat-span-4 reveal" style={{ ['--delay' as string]: '120ms' }}>
              <div className="feat-icon"><UserIcon /></div>
              <h3>Persona Friction</h3>
              <p>AI roleplays personas. Element-level friction with severity + risk.</p>
              <FeatPersonas />
            </div>

            {/* PRD Link — span 4 */}
            <div className="feat-card feat-span-4 reveal" style={{ ['--delay' as string]: '240ms' }}>
              <div className="feat-icon"><LinkIcon /></div>
              <h3>PRD ↔ UI Link</h3>
              <p>Cross-references requirements against UI elements.</p>
              <FeatLink />
            </div>

            {/* Sidekick — span 8 */}
            <div className="feat-card feat-span-8 reveal">
              <div className="feat-icon"><ChatIcon /></div>
              <h3>Sidekick</h3>
              <p>A project-aware copilot that knows your screens, test cases, audit findings, and bugs. Ask anything, get specific answers.</p>
              <FeatChat />
            </div>

            {/* Synthetic test data — span 4 */}
            <div className="feat-card feat-span-4 reveal" style={{ ['--delay' as string]: '120ms' }}>
              <div className="feat-icon"><DataIcon /></div>
              <h3>Synthetic Test Data</h3>
              <p>Locale-aware records with edge cases — Unicode, SQL injection, empty fields, multi-script names.</p>
              <div className="feat-visual" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-1)', background: 'var(--bg-2)', padding: 14, borderRadius: 8, lineHeight: 1.7 }}>
                <div>{'{ name: "Aisha Bello", cc: "NG" }'}</div>
                <div>{'{ name: "Yuki Tanaka", cc: "JP" }'}</div>
                <div style={{ color: 'var(--warning)' }}>{'{ name: "👋 \'); DROP--", cc: "??" }'}</div>
              </div>
            </div>

            {/* i18n — span 4 */}
            <div className="feat-card feat-span-4 reveal">
              <div className="feat-icon"><GlobeIcon /></div>
              <h3>i18n Audit</h3>
              <p>RTL, text expansion, locale formatting.</p>
            </div>

            {/* Gap finder — span 4 */}
            <div className="feat-card feat-span-4 reveal" style={{ ['--delay' as string]: '120ms' }}>
              <div className="feat-icon"><SparkSIcon /></div>
              <h3>Gap Finder</h3>
              <p>Catches contradictions and untestable specs in your PRD.</p>
            </div>

            {/* Export — span 4 */}
            <div className="feat-card feat-span-4 reveal" style={{ ['--delay' as string]: '240ms' }}>
              <div className="feat-icon"><DownloadIcon /></div>
              <h3>Export Engine</h3>
              <p>MD, CSV, JSON, Gherkin, Jira markup, Linear.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="section" id="how" style={{ background: 'var(--bg-1)' }}>
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">How it works</span>
            <h2 style={{ marginTop: 20 }}>Three stages. <span className="serif">One pipeline.</span></h2>
            <p>Tesifye chains specialized GROQ models so each step is fast, cheap, and grounded in evidence.</p>
          </div>
          <div style={{ maxWidth: 920, margin: '0 auto' }}>
            <div className="how-step reveal">
              <div className="num">i</div>
              <div>
                <h3>Scout analyzes your screens</h3>
                <p>Drop in screenshots or hook up a URL. <code style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--accent-2)' }}>llama-4-scout</code> identifies elements, layout intent, and edge states. We also extract contrast, palette, and whitespace from raw pixels — so the AI is always grounded.</p>
              </div>
            </div>
            <div className="how-step reveal" style={{ ['--delay' as string]: '150ms' }}>
              <div className="num">ii</div>
              <div>
                <h3>Generator drafts artifacts</h3>
                <p>Test cases, bug formats, audit findings — drafted by <code style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--accent-2)' }}>llama-3.3-70b</code>. Sub-second streaming on GROQ means you watch the suite assemble itself.</p>
              </div>
            </div>
            <div className="how-step reveal" style={{ ['--delay' as string]: '300ms' }}>
              <div className="num">iii</div>
              <div>
                <h3>Judge verifies before you see it</h3>
                <p>A second smaller model checks each artifact against the source: does it reference real screen elements? Is it actionable? Hallucinations get filtered, partial failures get a &quot;resume&quot; button — never a silent error.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIAL ─────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="testimonial reveal">
            <blockquote>
              We replaced a 3-day test-writing sprint with a 20-minute Tesifye session. Coverage went up. The QA team finally has time to do exploratory work.
            </blockquote>
            <div className="testimonial-author">
              <div className="av">PR</div>
              <div style={{ textAlign: 'left' }}>
                <div className="name">Priya Raman</div>
                <div className="title">Head of Quality, Mosaic Health</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="big-cta reveal-zoom">
            <span className="eyebrow" style={{ marginBottom: 16 }}>Free during beta</span>
            <h2 style={{ maxWidth: 680, margin: '0 auto' }}>Your QA team&apos;s <span className="serif gradient-text">new partner.</span></h2>
            <p style={{ maxWidth: 540, margin: '16px auto 0' }}>
              Spin up a project, drop in 3 screenshots, and watch your first test suite write itself.
            </p>
            <div className="btn-row" style={{ marginTop: 32 }}>
              <Link href="/register" className="btn btn-primary">
                Get started free <ArrowIcon />
              </Link>
              <Link href="/pricing" className="btn btn-ghost">View pricing</Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}
