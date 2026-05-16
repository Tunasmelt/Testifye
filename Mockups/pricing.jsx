// pricing.jsx — Pricing page

const { useState: useStateP } = React;

function PricingPage() {
  window.useScrollReveal();
  const I = window.MIcon;
  const [billing, setBilling] = useStateP('monthly');

  const tiers = [
    {
      name:'Solo', desc:'For solo QA engineers and indie devs.',
      monthly: 0, yearly: 0,
      features: [
        ['Up to 3 projects'],
        ['100 test cases / month'],
        ['UX audit (1 screen / day)'],
        ['Bug report formatter'],
        ['Markdown export'],
        ['Community support', true],
      ],
      cta: 'Start free',
    },
    {
      name:'Team', desc:'For QA teams shipping every week.',
      monthly: 29, yearly: 24,
      featured: true,
      features: [
        ['Unlimited projects'],
        ['10,000 test cases / month'],
        ['Full UX + i18n audit'],
        ['Persona friction (4 personas)'],
        ['Sidekick chat (project-aware)'],
        ['Jira / Linear / GitHub export'],
        ['Priority GROQ queue'],
        ['Slack support'],
      ],
      cta: 'Start 14-day trial',
    },
    {
      name:'Scale', desc:'For organizations with custom workflows.',
      monthly: 'Custom', yearly: 'Custom',
      features: [
        ['Everything in Team'],
        ['SSO + SCIM'],
        ['Custom personas & rubrics'],
        ['Self-hosted model option'],
        ['SOC 2 Type II report'],
        ['Dedicated CSM'],
        ['SLA + uptime guarantees'],
      ],
      cta: 'Talk to sales',
    },
  ];

  return (
    <>
      <window.MNav active="pricing"/>

      <section className="hero" style={{padding:'160px 0 60px'}}>
        <div className="hero-bg"><div className="hero-grid-overlay"/></div>
        <div className="container hero-content">
          <span className="eyebrow reveal">Pricing</span>
          <h1 className="reveal" style={{'--delay':'100ms'}}>Simple plans. <span className="serif gradient-text">Bold value.</span></h1>
          <p className="hero-sub reveal" style={{'--delay':'200ms'}}>Start free, scale when your team's ready. Every plan includes the full 10-feature pipeline — only limits scale.</p>

          <div className="reveal" style={{'--delay':'300ms', display:'inline-flex', padding:5, background:'var(--bg-1)', border:'1px solid var(--border)', borderRadius:999, marginTop:8}}>
            {[['monthly','Monthly'],['yearly','Yearly · save 20%']].map(([k,v]) => (
              <button key={k} onClick={()=>setBilling(k)} style={{
                padding:'9px 18px', borderRadius:999, fontSize:12, fontWeight:600,
                background: billing===k ? 'var(--bg-3)' : 'transparent',
                color: billing===k ? 'var(--text-0)' : 'var(--text-1)',
                transition:'all 0.2s',
              }}>{v}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{paddingTop:40}}>
        <div className="container">
          <div className="price-grid">
            {tiers.map((t, i) => (
              <div key={t.name} className={`price-card ${t.featured?'featured':''} reveal`} style={{'--delay': `${i*100}ms`}}>
                <div className="tier-name">{t.name}</div>
                <div className="price">
                  {typeof (billing==='monthly'?t.monthly:t.yearly) === 'number' ? (
                    <><span className="num">${billing==='monthly'?t.monthly:t.yearly}</span><span className="per">/ user / month</span></>
                  ) : (
                    <span className="num" style={{fontSize:36}}>{t.monthly}</span>
                  )}
                </div>
                <div className="desc">{t.desc}</div>
                <hr/>
                <ul>
                  {t.features.map(([f, muted], j) => (
                    <li key={j} className={muted?'muted':''}><I.check style={{width:14, height:14}}/>{f}</li>
                  ))}
                </ul>
                <a href={t.name==='Scale'?'#':'Tesifye Tour.html'} className={`btn ${t.featured?'btn-primary':''}`}>{t.cta}<I.arrow style={{width:13, height:13}}/></a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compare */}
      <section className="section" style={{paddingTop:40}}>
        <div className="container">
          <div className="section-head reveal" style={{maxWidth:560}}>
            <h2 style={{fontSize:'clamp(28px, 3vw, 40px)'}}>Compare features</h2>
          </div>
          <div className="reveal" style={{background:'var(--bg-1)', border:'1px solid var(--border)', borderRadius:20, overflow:'hidden'}}>
            {[
              ['Test cases / month', '100', '10,000', 'Unlimited'],
              ['Projects', '3', 'Unlimited', 'Unlimited'],
              ['UX audit', 'Daily', 'Continuous', 'Continuous + custom rubric'],
              ['Persona friction', '—', '4 personas', 'Custom personas'],
              ['Sidekick chat', '—', '✓', '✓ with private context'],
              ['Export integrations', 'Markdown', 'Jira, Linear, GitHub', 'Custom + API'],
              ['SSO', '—', '—', '✓'],
              ['Self-hosted models', '—', '—', '✓'],
              ['Support', 'Community', 'Slack', 'Dedicated CSM'],
            ].map((row, i) => (
              <div key={i} style={{display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr 1fr', padding:'14px 24px', borderTop: i>0 ? '1px solid var(--border)' : 'none', fontSize:13, alignItems:'center'}}>
                <div style={{color:'var(--text-1)'}}>{row[0]}</div>
                <div>{row[1]}</div>
                <div style={{color:'var(--accent-2)', fontWeight:600}}>{row[2]}</div>
                <div>{row[3]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container">
          <div className="section-head reveal">
            <span className="eyebrow">FAQ</span>
            <h2 style={{marginTop:20}}>Questions, <span className="serif">answered.</span></h2>
          </div>
          <div className="faq">
            <FAQItem q="What does 'powered by GROQ' mean?" a="Tesifye runs every model call through GROQ's inference cloud. That's why generation feels instant — most prompts return in under 600ms. We orchestrate llama-3.3-70b, llama-4-scout, and a smaller Judge model behind the scenes, so you don't have to think about it."/>
            <FAQItem q="Do I need to write any prompts?" a="No. Every feature comes with curated prompt chains tuned by senior QA engineers. You drop in a screenshot or paste a PRD; we handle the rest."/>
            <FAQItem q="How do I export to Jira?" a="One click. Tesifye formats bugs and test cases into Jira-flavored markup, ADF, or CSV import. Linear and GitHub Issues are first-class too."/>
            <FAQItem q="What happens when I hit my plan's monthly limit?" a="Generation pauses and you keep everything you've made. You can upgrade in-place or wait for next month. Nothing is deleted."/>
            <FAQItem q="Is my data used to train models?" a="No. Tesifye does not train on customer data. On Scale, you can run inference against your own GROQ deployment for full data residency."/>
            <FAQItem q="Can I bring my own model?" a="On Scale yes — point Tesifye at a self-hosted llama-3.3 endpoint or any OpenAI-compatible inference server."/>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="big-cta reveal-zoom">
            <h2>Ready to <span className="serif gradient-text">see it live?</span></h2>
            <p>Open the interactive tour — no signup needed.</p>
            <div className="btn-row">
              <a href="Tesifye Tour.html" className="btn btn-primary">Launch tour<I.arrow style={{width:14, height:14}}/></a>
            </div>
          </div>
        </div>
      </section>

      <window.MFooter/>
    </>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useStateP(false);
  return (
    <div className={`faq-item reveal ${open?'open':''}`} onClick={()=>setOpen(!open)}>
      <div className="faq-q"><span>{q}</span><span className="toggle">+</span></div>
      <div className="faq-a">{a}</div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<PricingPage/>);
