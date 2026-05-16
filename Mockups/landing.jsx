// landing.jsx — Tesifye marketing landing page

const { useState: useStateL, useEffect: useEffectL, useRef: useRefL } = React;

function FeatTestCases() {
  // Animated streaming test cases
  const items = [
    { id:'TC-001', title:'User can sign in with valid credentials', badge:'high' },
    { id:'TC-002', title:'Card declined → friendly error + retry', badge:'crit' },
    { id:'TC-003', title:'Search with 0 results shows empty state', badge:'med' },
    { id:'TC-004', title:'Cancel booking within 24h refunds in full', badge:'high' },
    { id:'TC-005', title:'Date picker rejects past dates', badge:'med' },
  ];
  return (
    <div className="feat-visual">
      {items.map((it, i) => (
        <div key={it.id} className="fv-tcrow" style={{animationDelay: `${i*120 + 200}ms`}}>
          <span className="id">{it.id}</span>
          <span className="title">{it.title}</span>
          <span className={`badge ${it.badge}`}>{it.badge}</span>
          <window.MIcon.check className="check" style={{width:12, height:12}}/>
        </div>
      ))}
    </div>
  );
}

function FeatUX() {
  const heights = [62, 78, 70, 88, 55, 72, 84, 92, 68, 80];
  const [animated, setAnimated] = useStateL(false);
  const ref = useRefL();
  useEffectL(() => {
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && setAnimated(true)), { threshold: 0.4 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <div className="feat-visual" ref={ref}>
      <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:14}}>
        <div>
          <div style={{fontSize:11, color:'var(--text-2)', letterSpacing:'0.08em', textTransform:'uppercase'}}>Score</div>
          <div style={{fontSize:36, fontWeight:700, letterSpacing:'-0.02em'}}>B+ <span style={{fontSize:14, color:'var(--text-1)', fontWeight:500}}>78/100</span></div>
        </div>
        <div style={{fontSize:11, color:'var(--success)', fontFamily:'JetBrains Mono, monospace'}}>↑ 4 this week</div>
      </div>
      <div className="fv-ux">
        {heights.map((h,i) => (
          <div key={i} className={`bar ${h > 80 ? 'tall' : h < 60 ? 'warn' : 'tall'}`} style={{ height: animated ? `${h}%` : '4%', transitionDelay: `${i*50}ms` }}/>
        ))}
      </div>
      <div style={{display:'flex', justifyContent:'space-between', marginTop:8, fontSize:10, color:'var(--text-2)', fontFamily:'JetBrains Mono, monospace'}}>
        <span>H1</span><span>H2</span><span>H3</span><span>H4</span><span>H5</span><span>H6</span><span>H7</span><span>H8</span><span>H9</span><span>H10</span>
      </div>
    </div>
  );
}

function FeatBug() {
  const colors = ['#F87171', '#FBBF24', '#60A5FA', '#A78BFA'];
  const labels = ['[BUG] Stuck spinner on Apple Pay dismissal', '[BUG] Date picker mis-formats in fr-FR', '[BUG] CVV field missing tooltip', '[BUG] Search ignores diacritics on Pixel'];
  return (
    <div className="feat-visual fv-bug-stream">
      {labels.map((l,i) => (
        <div key={i} className="fv-bug-pill" style={{animationDelay: `${i*1.2}s`, top: 6 + i*8}}>
          <span className="dot" style={{background: colors[i]}}/>
          <span style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{l}</span>
        </div>
      ))}
    </div>
  );
}

function FeatPersonas() {
  const ps = [
    { in:'FT', label:'First-time', score: 64 },
    { in:'PU', label:'Power user', score: 81 },
    { in:'EL', label:'Elder', score: 52 },
    { in:'LV', label:'Low vision', score: 48 },
  ];
  return (
    <div className="feat-visual fv-personas">
      {ps.map((p,i) => (
        <div key={i} className="fv-persona">
          <div className="av">{p.in}</div>
          <div className="label">{p.label}</div>
          <div className="score">{p.score}</div>
        </div>
      ))}
    </div>
  );
}

function FeatLink() {
  const rows = [
    { req:'Card payment via Stripe', status:'ok', label:'Verified' },
    { req:'Apple Pay support', status:'high', label:'Mismatch' },
    { req:'3DS confirmation', status:'crit', label:'Missing' },
    { req:'Refund within 24h', status:'med', label:'Untested' },
  ];
  return (
    <div className="feat-visual">
      {rows.map((r,i) => (
        <div key={i} className="fv-tcrow" style={{animationDelay: `${i*150}ms`}}>
          <span className="id">REQ-{i+1}</span>
          <span className="title">{r.req}</span>
          <span className={`badge ${r.status}`}>{r.label}</span>
        </div>
      ))}
    </div>
  );
}

function FeatChat() {
  return (
    <div className="feat-visual" style={{display:'flex', flexDirection:'column', gap:8}}>
      <div style={{alignSelf:'flex-end', maxWidth:'80%', background:'var(--accent-glow)', border:'1px solid var(--accent-strong)', borderRadius:12, padding:'8px 12px', fontSize:12}}>
        Why is my checkout test failing on Pixel?
      </div>
      <div style={{alignSelf:'flex-start', maxWidth:'85%', background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:12, padding:'10px 14px', fontSize:12, lineHeight:1.5}}>
        <strong style={{color:'var(--accent-2)'}}>Sidekick</strong> · Looking at your TC-002 logs — the Apple Pay sheet dispatches a <code style={{background:'var(--bg-3)', padding:'1px 5px', borderRadius:4, fontFamily:'JetBrains Mono, monospace', fontSize:10}}>onCancel</code> event your handler doesn't listen for. Add a `dismissed` case to your payment state machine.
      </div>
    </div>
  );
}

function FeatPipeline() {
  const I = window.MIcon;
  return (
    <div className="hero-visual reveal-zoom" style={{aspectRatio:'auto', height: 460, marginTop: 0}}>
      <div className="pipeline">
        <div className="pipeline-stream"><svg preserveAspectRatio="none" viewBox="0 0 800 4"><path d="M0 2 L800 2"/></svg></div>
        <div className="pipeline-stage">
          <div className="pipeline-node s1"><I.eye/></div>
          <div className="pipeline-label"><b>Scout</b><br/>analyzes screen</div>
        </div>
        <div className="pipeline-stage">
          <div className="pipeline-node s2"><I.spark/></div>
          <div className="pipeline-label"><b>Generator</b><br/>writes tests</div>
        </div>
        <div className="pipeline-stage">
          <div className="pipeline-node s3"><I.shield/></div>
          <div className="pipeline-label"><b>Judge</b><br/>verifies output</div>
        </div>
        <div className="pipeline-output">
          <span>TC-007</span> Card declined → retry CTA <span className="pipeline-cursor"></span>
        </div>
      </div>
    </div>
  );
}

function LandingPage() {
  window.useScrollReveal();
  const I = window.MIcon;
  return (
    <>
      <window.MNav active="home"/>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-grid-overlay"/>
        </div>
        <div className="container hero-content">
          <span className="eyebrow reveal">AI testing partner · Live</span>
          <h1 className="reveal" style={{'--delay':'120ms'}}>
            <span className="serif gradient-text">Ship fewer bugs.</span>
            <span>Test like a senior QA in minutes.</span>
          </h1>
          <p className="hero-sub reveal" style={{'--delay':'240ms'}}>
            Tesifye turns your screens and PRDs into test cases, UX audits, bug reports, and persona walkthroughs — generated, verified, and ready for Jira. All powered by GROQ's sub-second LLMs.
          </p>
          <div className="hero-cta reveal" style={{'--delay':'360ms'}}>
            <a href="Tesifye Tour.html" className="btn btn-primary">Try the live tour<I.arrow style={{width:14, height:14}}/></a>
            <a href="#how" className="btn btn-ghost">See how it works</a>
          </div>
          <div className="hero-trust reveal" style={{'--delay':'480ms'}}>
            <span className="hero-trust-item"><I.check style={{width:14, height:14}}/>No credit card</span>
            <span className="hero-trust-item"><I.check style={{width:14, height:14}}/>10 features included</span>
            <span className="hero-trust-item"><I.check style={{width:14, height:14}}/>Sub-second responses</span>
            <span className="hero-trust-item"><I.check style={{width:14, height:14}}/>Export to Jira/Linear</span>
          </div>
          <FeatPipeline/>
        </div>
      </section>

      {/* LOGOS */}
      <section className="logos">
        <div className="container">
          <div className="logos-label">Trusted by QA teams shipping faster</div>
          <div className="logos-row">
            {['Pebble','Mosaic','Lumina','Drifter','Northwind','Halcyon','Catalyst'].map(n => (
              <div key={n} className="logo-item"><span className="dot"/>{n}</div>
            ))}
          </div>
        </div>
      </section>

      {/* METRICS */}
      <section className="section" style={{paddingTop: 100, paddingBottom: 60}}>
        <div className="container">
          <div className="metrics-grid reveal">
            <div className="metric"><div className="num"><window.CountUp to={94} suffix="%"/></div><div className="label">Faster test creation</div><div className="delta">vs. manual</div></div>
            <div className="metric"><div className="num"><window.CountUp to={3.2} suffix="x"/></div><div className="label">Bugs caught pre-prod</div><div className="delta">avg across pilots</div></div>
            <div className="metric"><div className="num"><window.CountUp to={580} suffix="ms"/></div><div className="label">Median response time</div><div className="delta">GROQ-powered</div></div>
            <div className="metric"><div className="num"><window.CountUp to={24} prefix="" suffix="K+"/></div><div className="label">Tests generated weekly</div><div className="delta">across customers</div></div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section" id="features">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">10 features, one project brain</span>
            <h2 style={{marginTop:20}}>Every QA chore — <span className="serif">handled</span>.</h2>
            <p>From the first PRD page to the last bug ticket, Tesifye is the partner that knows your app as well as you do.</p>
          </div>

          <div className="feat-grid">
            <div className="feat-card feat-span-8 reveal">
              <div className="feat-icon"><I.flask/></div>
              <h3>Test Case Generator</h3>
              <p>Streams structured test cases — verified by a Judge model against your real screens. Functional, edge, negative, accessibility, performance.</p>
              <FeatTestCases/>
            </div>
            <div className="feat-card feat-span-4 reveal" style={{'--delay':'120ms'}}>
              <div className="feat-icon"><I.eye/></div>
              <h3>UX/UI Auditor</h3>
              <p>Nielsen heuristics + WCAG. Pixel-extracted contrast grounds the AI in real data.</p>
              <FeatUX/>
            </div>

            <div className="feat-card feat-span-4 reveal">
              <div className="feat-icon"><I.bug/></div>
              <h3>Bug Report Formatter</h3>
              <p>Paste messy notes — get ticket-ready Jira/GitHub/Linear bugs.</p>
              <FeatBug/>
            </div>
            <div className="feat-card feat-span-4 reveal" style={{'--delay':'120ms'}}>
              <div className="feat-icon"><I.user/></div>
              <h3>Persona Friction</h3>
              <p>AI roleplays personas. Element-level friction with severity + risk.</p>
              <FeatPersonas/>
            </div>
            <div className="feat-card feat-span-4 reveal" style={{'--delay':'240ms'}}>
              <div className="feat-icon"><I.link/></div>
              <h3>PRD ↔ UI Link</h3>
              <p>Cross-references requirements against UI elements.</p>
              <FeatLink/>
            </div>

            <div className="feat-card feat-span-8 reveal">
              <div className="feat-icon"><I.chat/></div>
              <h3>Sidekick</h3>
              <p>A project-aware copilot that knows your screens, test cases, audit findings, and bugs. Ask anything, get specific answers.</p>
              <FeatChat/>
            </div>
            <div className="feat-card feat-span-4 reveal" style={{'--delay':'120ms'}}>
              <div className="feat-icon"><I.data/></div>
              <h3>Synthetic Test Data</h3>
              <p>Locale-aware records with edge cases — Unicode, SQL injection, empty fields, multi-script names.</p>
              <div className="feat-visual" style={{fontFamily:'JetBrains Mono, monospace', fontSize:11, color:'var(--text-1)', background:'var(--bg-2)', padding:14, borderRadius:8, lineHeight:1.7}}>
                <div>{'{ name: "Aisha Bello", cc: "NG" }'}</div>
                <div>{'{ name: "Yuki Tanaka", cc: "JP" }'}</div>
                <div style={{color:'var(--warning)'}}>{'{ name: "👋 \\\'); DROP--", cc:"??" }'}</div>
              </div>
            </div>

            <div className="feat-card feat-span-4 reveal">
              <div className="feat-icon"><I.globe/></div>
              <h3>i18n Audit</h3>
              <p>RTL, text expansion, locale formatting.</p>
            </div>
            <div className="feat-card feat-span-4 reveal" style={{'--delay':'120ms'}}>
              <div className="feat-icon"><I.spark/></div>
              <h3>Gap Finder</h3>
              <p>Catches contradictions and untestable specs in your PRD.</p>
            </div>
            <div className="feat-card feat-span-4 reveal" style={{'--delay':'240ms'}}>
              <div className="feat-icon"><I.download/></div>
              <h3>Export Engine</h3>
              <p>MD, CSV, JSON, Gherkin, Jira markup, Linear.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section" id="how" style={{background:'var(--bg-1)'}}>
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">How it works</span>
            <h2 style={{marginTop:20}}>Three stages. <span className="serif">One pipeline.</span></h2>
            <p>Tesifye chains specialized GROQ models so each step is fast, cheap, and grounded in evidence.</p>
          </div>
          <div style={{maxWidth:920, margin:'0 auto'}}>
            <div className="how-step reveal">
              <div className="num">i</div>
              <div>
                <h3>Scout analyzes your screens</h3>
                <p>Drop in screenshots or hook up a URL. <code style={{fontFamily:'JetBrains Mono, monospace', fontSize:13, color:'var(--accent-2)'}}>llama-4-scout</code> identifies elements, layout intent, and edge states. We also extract contrast, palette, and whitespace from raw pixels — so the AI is always grounded.</p>
              </div>
            </div>
            <div className="how-step reveal" style={{'--delay':'150ms'}}>
              <div className="num">ii</div>
              <div>
                <h3>Generator drafts artifacts</h3>
                <p>Test cases, bug formats, audit findings — drafted by <code style={{fontFamily:'JetBrains Mono, monospace', fontSize:13, color:'var(--accent-2)'}}>llama-3.3-70b</code>. Sub-second streaming on GROQ means you watch the suite assemble itself.</p>
              </div>
            </div>
            <div className="how-step reveal" style={{'--delay':'300ms'}}>
              <div className="num">iii</div>
              <div>
                <h3>Judge verifies before you see it</h3>
                <p>A second smaller model checks each artifact against the source: does it reference real screen elements? Is it actionable? Hallucinations get filtered, partial failures get a "resume" button — never a silent error.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="section">
        <div className="container">
          <div className="testimonial reveal">
            <blockquote>
              We replaced a 3-day test-writing sprint with a 20-minute Tesifye session. Coverage went up. The QA team finally has time to do exploratory work.
            </blockquote>
            <div className="testimonial-author">
              <div className="av">PR</div>
              <div style={{textAlign:'left'}}>
                <div className="name">Priya Raman</div>
                <div className="title">Head of Quality, Mosaic Health</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{paddingTop: 40}}>
        <div className="container">
          <div className="big-cta reveal-zoom">
            <span className="eyebrow" style={{marginBottom:16}}>Free during beta</span>
            <h2 style={{maxWidth:680, margin:'0 auto'}}>Your QA team's <span className="serif gradient-text">new partner.</span></h2>
            <p style={{maxWidth:540, margin:'16px auto 0'}}>Spin up a project, drop in 3 screenshots, and watch your first test suite write itself.</p>
            <div className="btn-row" style={{marginTop:32}}>
              <a href="Tesifye Tour.html" className="btn btn-primary">Open the live tour<I.arrow style={{width:14, height:14}}/></a>
              <a href="Tesifye Pricing.html" className="btn btn-ghost">View pricing</a>
            </div>
          </div>
        </div>
      </section>

      <window.MFooter/>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<LandingPage/>);
