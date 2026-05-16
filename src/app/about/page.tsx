'use client';

/**
 * About page — Task 1.17
 * Implemented from mockup: Mockups/about.jsx
 */

import Link from 'next/link';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { CountUp } from '@/components/marketing/CountUp';
import { useScrollReveal } from '@/components/marketing/useScrollReveal';

function ArrowIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const TEAM = [
  { init: 'NA', name: 'Naomi Ackermann', role: 'Co-founder & CEO',      bio: "Ex-Stripe QA lead. Believes humans should test creatively, not write boilerplate." },
  { init: 'TK', name: 'Tariq Kassem',    role: 'Co-founder & CTO',      bio: 'Built inference infra at Hugging Face. Loves a clean LLM pipeline.' },
  { init: 'MR', name: 'Mei Reyes',       role: 'Head of Design',         bio: 'Previously at Linear and Notion. Obsessed with restraint.' },
  { init: 'OG', name: 'Olu Gbadebo',     role: 'Head of QA Research',    bio: 'Authored ISTQB advanced module on AI testing. Mentors the AI personas.' },
];

const VALUES = [
  { num: 'i',   title: 'Tests are conversations', body: "Good testing comes from a curious mind asking sharp questions. Tesifye is the colleague that never gets tired of asking." },
  { num: 'ii',  title: 'Verify, then ship',        body: "Every artifact passes through a Judge model. Hallucinations don't reach your suite — full stop." },
  { num: 'iii', title: 'Respect the craft',         body: "We're not replacing QA engineers. We're removing the parts they hate so they can do the work only humans can do." },
];

export default function AboutPage() {
  useScrollReveal();

  return (
    <>
      <MarketingNav active="about" />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="about-hero">
        <div className="hero-bg"><div className="hero-grid-overlay" /></div>
        <div className="container">
          <span className="eyebrow reveal">About Tesifye</span>
          <h1 className="reveal" style={{ ['--delay' as string]: '120ms' }}>
            We&apos;re building the{' '}
            <span className="serif gradient-text">testing partner</span>{' '}
            we wish we had.
          </h1>
          <p className="lead reveal" style={{ ['--delay' as string]: '240ms' }}>
            QA was the first job AI should have helped — and somehow the last one it did.
            Tesifye is what happens when senior QA engineers and inference experts redesign
            testing from the ground up, on top of GROQ&apos;s instant LLMs.
          </p>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="stat-strip reveal">
            <div className="metric"><div className="num"><CountUp to={2024} /></div><div className="label">Founded</div></div>
            <div className="metric"><div className="num"><CountUp to={28} /></div><div className="label">Engineers, designers, QA leads</div></div>
            <div className="metric"><div className="num"><CountUp to={140} suffix="+" /></div><div className="label">Customer teams</div></div>
            <div className="metric"><div className="num"><CountUp to={1.2} suffix="M" /></div><div className="label">Tests generated</div></div>
          </div>
        </div>
      </section>

      {/* ── STORY ─────────────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container" style={{ maxWidth: 780, margin: '0 auto' }}>
          <div className="reveal">
            <span className="eyebrow">Our story</span>
            <h2 style={{ marginTop: 24, marginBottom: 32 }}>It started with a regret retro.</h2>
            <div style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--text-1)', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <p>Naomi led QA at a 200-person fintech where every release ended the same way: a 6-hour Saturday triage. Bugs nobody had thought to test for. PRDs that quietly contradicted themselves three pages in. A backlog of &quot;we&apos;ll write the test for that next sprint&quot; notes that never got written.</p>
              <p>The frustrating part wasn&apos;t the bugs. It was that{' '}
                <span className="serif" style={{ color: 'var(--accent-2)', fontSize: '1.1em' }}>most of them were obvious in hindsight</span>{' '}
                — the kind a careful senior tester would catch in 30 seconds, if anyone had time to look.</p>
              <p>So we built the colleague we wished we had. Not a replacement. A partner that drafts the boring 80% so humans can focus on the 20% that actually requires judgment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUES ─────────────────────────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--bg-1)' }}>
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">Principles</span>
            <h2 style={{ marginTop: 20 }}>What we <span className="serif">won&apos;t</span> compromise on.</h2>
          </div>
          <div className="values-grid">
            {VALUES.map((v, i) => (
              <div key={i} className="value-card reveal" style={{ ['--delay' as string]: `${i * 120}ms` }}>
                <div className="num">{v.num}</div>
                <h3>{v.title}</h3>
                <p>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ─────────────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">Team</span>
            <h2 style={{ marginTop: 20 }}>Built by <span className="serif">QA people</span>, for QA people.</h2>
          </div>
          <div className="team-grid">
            {TEAM.map((m, i) => (
              <div key={i} className="team-card reveal" style={{ ['--delay' as string]: `${i * 100}ms` }}>
                <div className="av">{m.init}</div>
                <div className="name">{m.name}</div>
                <div className="role">{m.role}</div>
                <div className="bio">{m.bio}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BACKED BY ─────────────────────────────────────────────────────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="reveal" style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--bg-1)', borderRadius: 20, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 18 }}>Backed by</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap', opacity: 0.75, fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>
              <span>Sequoia Capital</span>
              <span>Index Ventures</span>
              <span>SV Angel</span>
              <span>+ 14 angels</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="big-cta reveal-zoom">
            <span className="eyebrow" style={{ marginBottom: 16 }}>We&apos;re hiring</span>
            <h2>Help us build <span className="serif gradient-text">the future of QA.</span></h2>
            <p>Remote-friendly. Generous equity. Real autonomy.</p>
            <div className="btn-row">
              <Link href="#" className="btn btn-primary">View open roles <ArrowIcon /></Link>
              <Link href="/register" className="btn btn-ghost">Or try the product</Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}
