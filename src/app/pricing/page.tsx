'use client';

/**
 * Pricing page — Task 1.17
 * Implemented from mockup: Mockups/pricing.jsx
 */

import { useState } from 'react';
import Link from 'next/link';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { useScrollReveal } from '@/components/marketing/useScrollReveal';

export const metadata = undefined; // 'use client' — set via head in layout

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={{ width: 15, height: 15, flexShrink: 0, marginTop: 2 }}>
      <path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ArrowIcon({ size = 13 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const TIERS = [
  {
    name:     'Solo',
    desc:     'For solo QA engineers and indie devs.',
    monthly:  0,
    yearly:   0,
    featured: false,
    cta:      'Start free',
    href:     '/register',
    features: [
      { label: 'Up to 3 projects',         muted: false },
      { label: '100 test cases / month',    muted: false },
      { label: 'UX audit (1 screen / day)', muted: false },
      { label: 'Bug report formatter',      muted: false },
      { label: 'Markdown export',           muted: false },
      { label: 'Community support',         muted: true  },
    ],
  },
  {
    name:     'Team',
    desc:     'For QA teams shipping every week.',
    monthly:  29,
    yearly:   24,
    featured: true,
    cta:      'Start 14-day trial',
    href:     '/register',
    features: [
      { label: 'Unlimited projects',             muted: false },
      { label: '10,000 test cases / month',       muted: false },
      { label: 'Full UX + i18n audit',            muted: false },
      { label: 'Persona friction (4 personas)',    muted: false },
      { label: 'Sidekick chat (project-aware)',    muted: false },
      { label: 'Jira / Linear / GitHub export',   muted: false },
      { label: 'Priority GROQ queue',             muted: false },
      { label: 'Slack support',                   muted: false },
    ],
  },
  {
    name:     'Scale',
    desc:     'For organizations with custom workflows.',
    monthly:  null,
    yearly:   null,
    featured: false,
    cta:      'Talk to sales',
    href:     '#',
    features: [
      { label: 'Everything in Team',          muted: false },
      { label: 'SSO + SCIM',                  muted: false },
      { label: 'Custom personas & rubrics',   muted: false },
      { label: 'Self-hosted model option',    muted: false },
      { label: 'SOC 2 Type II report',        muted: false },
      { label: 'Dedicated CSM',               muted: false },
      { label: 'SLA + uptime guarantees',     muted: false },
    ],
  },
];

const COMPARE_ROWS = [
  ['Test cases / month',    '100',        '10,000',      'Unlimited'],
  ['Projects',              '3',          'Unlimited',   'Unlimited'],
  ['UX audit',              'Daily',      'Continuous',  'Continuous + custom rubric'],
  ['Persona friction',      '—',          '4 personas',  'Custom personas'],
  ['Sidekick chat',         '—',          '✓',           '✓ with private context'],
  ['Export integrations',   'Markdown',   'Jira, Linear, GitHub', 'Custom + API'],
  ['SSO',                   '—',          '—',           '✓'],
  ['Self-hosted models',    '—',          '—',           '✓'],
  ['Support',               'Community',  'Slack',       'Dedicated CSM'],
];

const FAQ_ITEMS = [
  { q: "What does 'powered by GROQ' mean?", a: "Tesifye runs every model call through GROQ's inference cloud. That's why generation feels instant — most prompts return in under 600ms. We orchestrate llama-3.3-70b, llama-4-scout, and a smaller Judge model behind the scenes, so you don't have to think about it." },
  { q: 'Do I need to write any prompts?', a: "No. Every feature comes with curated prompt chains tuned by senior QA engineers. You drop in a screenshot or paste a PRD; we handle the rest." },
  { q: 'How do I export to Jira?', a: "One click. Tesifye formats bugs and test cases into Jira-flavored markup, ADF, or CSV import. Linear and GitHub Issues are first-class too." },
  { q: "What happens when I hit my plan's monthly limit?", a: "Generation pauses and you keep everything you've made. You can upgrade in-place or wait for next month. Nothing is deleted." },
  { q: 'Is my data used to train models?', a: "No. Tesifye does not train on customer data. On Scale, you can run inference against your own GROQ deployment for full data residency." },
  { q: 'Can I bring my own model?', a: "On Scale yes — point Tesifye at a self-hosted llama-3.3 endpoint or any OpenAI-compatible inference server." },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item reveal${open ? ' open' : ''}`} onClick={() => setOpen(!open)}>
      <div className="faq-q">
        <span>{q}</span>
        <span className="faq-toggle" style={{ fontSize: 18, lineHeight: 1, userSelect: 'none' }}>+</span>
      </div>
      <div className="faq-a">{a}</div>
    </div>
  );
}

export default function PricingPage() {
  useScrollReveal();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <>
      <MarketingNav active="pricing" />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="hero" style={{ padding: '160px 0 60px' }}>
        <div className="hero-bg"><div className="hero-grid-overlay" /></div>
        <div className="container hero-content">
          <span className="eyebrow reveal">Pricing</span>
          <h1 className="reveal" style={{ ['--delay' as string]: '100ms' }}>
            Simple plans. <span className="serif gradient-text">Bold value.</span>
          </h1>
          <p className="hero-sub reveal" style={{ ['--delay' as string]: '200ms' }}>
            Start free, scale when your team&apos;s ready. Every plan includes the full 10-feature pipeline — only limits scale.
          </p>

          {/* Billing toggle */}
          <div className="reveal" style={{ ['--delay' as string]: '300ms', display: 'inline-flex', padding: 5, background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 999, marginTop: 8 }}>
            {([['monthly', 'Monthly'], ['yearly', 'Yearly · save 20%']] as const).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setBilling(k)}
                style={{
                  padding: '9px 18px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                  background: billing === k ? 'var(--bg-3)' : 'transparent',
                  color:      billing === k ? 'var(--text-0)' : 'var(--text-1)',
                  border:     'none', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING CARDS ───────────────────────────────────────────────── */}
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="price-grid">
            {TIERS.map((t, i) => {
              const price = billing === 'monthly' ? t.monthly : t.yearly;
              return (
                <div
                  key={t.name}
                  className={`price-card${t.featured ? ' featured' : ''} reveal`}
                  style={{ ['--delay' as string]: `${i * 100}ms` }}
                >
                  <div className="tier-name">{t.name}</div>
                  <div className="price">
                    {price !== null
                      ? <><span className="num">${price}</span><span className="per">/ user / month</span></>
                      : <span className="num" style={{ fontSize: 36 }}>Custom</span>
                    }
                  </div>
                  <div className="desc">{t.desc}</div>
                  <hr />
                  <ul>
                    {t.features.map((f, j) => (
                      <li key={j} className={f.muted ? 'muted' : ''}>
                        <CheckIcon />
                        {f.label}
                      </li>
                    ))}
                  </ul>
                  <Link href={t.href} className={`btn${t.featured ? ' btn-primary' : ''}`}>
                    {t.cta} <ArrowIcon />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── COMPARE TABLE ───────────────────────────────────────────────── */}
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="section-head reveal" style={{ maxWidth: 560 }}>
            <h2 style={{ fontSize: 'clamp(28px, 3vw, 40px)' }}>Compare features</h2>
          </div>
          <div className="reveal" style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', padding: '12px 24px', background: 'var(--bg-2)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-2)' }}>
              <div>Feature</div>
              <div>Solo</div>
              <div style={{ color: 'var(--accent-2)' }}>Team</div>
              <div>Scale</div>
            </div>
            {COMPARE_ROWS.map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', padding: '14px 24px', borderTop: '1px solid var(--border)', fontSize: 13, alignItems: 'center' }}>
                <div style={{ color: 'var(--text-1)' }}>{row[0]}</div>
                <div>{row[1]}</div>
                <div style={{ color: 'var(--accent-2)', fontWeight: 600 }}>{row[2]}</div>
                <div>{row[3]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">FAQ</span>
            <h2 style={{ marginTop: 20 }}>Questions, <span className="serif">answered.</span></h2>
          </div>
          <div className="faq">
            {FAQ_ITEMS.map((item, i) => (
              <FAQItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="big-cta reveal-zoom">
            <h2>Ready to <span className="serif gradient-text">see it live?</span></h2>
            <p>Open the app — no credit card needed.</p>
            <div className="btn-row">
              <Link href="/register" className="btn btn-primary">
                Get started free <ArrowIcon size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}
