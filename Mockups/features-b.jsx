// features-b.jsx — Bug, Gaps, Link, Data, Persona, i18n, Sidekick, Export

const { useState: useStateB, useEffect: useEffectB, useRef: useRefB } = React;

// === BUG REPORT FORMATTER ===
function BugReportPage() {
  const I = window.Icons;
  const [raw, setRaw] = useStateB("checkout broken on my pixel - tapped pay apple pay popup came up, dismissed it, now stuck loading spinner forever. tried again, same. wifi was fine. version 4.2.1");
  const [formatted, setFormatted] = useStateB(null);
  const [loading, setLoading] = useStateB(false);
  const [target, setTarget] = useStateB('jira');

  const formatBug = async () => {
    setLoading(true);
    setFormatted(null);
    try {
      const res = await window.claude.complete(`You are a senior QA engineer. Convert this raw bug note into a structured ${target} ticket. Reply ONLY with valid JSON, no prose, no markdown fences. Schema: {"title":"[BUG] short concise title", "severity":"blocker|critical|major|minor|trivial", "priority":"P0|P1|P2|P3|P4", "component":"e.g. Checkout", "environment":{"platform":"...","browser":"...","os":"...","app_version":"..."}, "steps_to_reproduce":["step 1","step 2"], "expected_result":"...", "actual_result":"...", "frequency":"always|often|sometimes|rarely|once", "root_cause_hypothesis":"...", "labels":["label1"]}\n\nRaw note: ${raw}`);
      const json = JSON.parse(res.replace(/```json|```/g,'').trim());
      setFormatted(json);
    } catch (e) {
      // fallback mock
      setFormatted({
        title: '[BUG] Checkout stuck on infinite loading after Apple Pay dismissal',
        severity: 'critical', priority: 'P1', component: 'Checkout',
        environment: { platform:'Android', browser:'N/A (native app)', os:'Android 14', app_version:'4.2.1' },
        steps_to_reproduce: [
          'Open app on Pixel device, sign in',
          'Add a stay to checkout',
          'Tap "Apple Pay" button',
          'Dismiss the Apple Pay sheet',
          'Observe: loading spinner shows indefinitely',
        ],
        expected_result: 'Returning from Apple Pay sheet should restore the payment method picker.',
        actual_result: 'Loading spinner persists. UI is unresponsive. No error shown.',
        frequency: 'always',
        root_cause_hypothesis: 'Payment-state machine likely missing transition for sheet-dismissed event.',
        labels: ['checkout','payments','android','pixel'],
      });
    }
    setLoading(false);
  };

  return (
    <div className="tf-fade-in">
      <div className="tf-page-header">
        <div>
          <div className="tf-page-title"><I.bug size={20} style={{color:'var(--accent-2)'}}/>Bug Report Formatter</div>
          <div className="tf-page-sub">Paste messy notes from a testing session — get ticket-ready bug reports for Jira, GitHub, or Linear.</div>
        </div>
        <span className="tf-provider-badge"><span className="tf-dot"></span>llama-3.1-8b · live</span>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1.3fr', gap:16}}>
        <div className="tf-card">
          <div className="tf-card-head">
            <div className="tf-card-title"><I.copy size={14}/>Raw Note</div>
            <div className="tf-tabs">
              {[['jira','Jira'],['github','GitHub'],['linear','Linear']].map(([k,v]) => (
                <button key={k} className={`tf-tab ${target===k?'active':''}`} onClick={()=>setTarget(k)}>{v}</button>
              ))}
            </div>
          </div>
          <textarea className="tf-textarea" style={{minHeight:200}} value={raw} onChange={e=>setRaw(e.target.value)} placeholder="Paste your testing notes here..."/>
          <button className="tf-btn tf-btn-primary" style={{marginTop:12, width:'100%', justifyContent:'center'}} onClick={formatBug} disabled={loading || !raw.trim()}>
            {loading ? <><span className="tf-spin"><I.refresh size={14}/></span>Polishing…</> : <><I.sparkle size={14}/>Format Bug Report</>}
          </button>
        </div>

        <div className="tf-card">
          <div className="tf-card-head">
            <div className="tf-card-title"><I.checkCircle size={14}/>Formatted Ticket</div>
            {formatted && <button className="tf-btn tf-btn-sm"><I.copy size={12}/>Copy</button>}
          </div>
          {!formatted && !loading && (
            <div style={{textAlign:'center', padding:'40px 20px', color:'var(--text-1)'}}>
              <I.bug size={28} style={{color:'var(--text-2)', marginBottom:8}}/>
              <div style={{fontSize:13}}>Formatted bug appears here.</div>
            </div>
          )}
          {loading && (
            <div className="tf-col" style={{gap:8}}>
              <div className="tf-skeleton" style={{height:18, width:'80%'}}/>
              <div className="tf-skeleton" style={{height:12, width:'40%'}}/>
              <div className="tf-skeleton" style={{height:60, width:'100%', marginTop:8}}/>
            </div>
          )}
          {formatted && (
            <div className="tf-col tf-fade-in" style={{gap:10}}>
              <div style={{fontSize:14, fontWeight:600, lineHeight:1.4}}>{formatted.title}</div>
              <div className="tf-row" style={{flexWrap:'wrap', gap:6}}>
                <span className={`tf-badge tf-badge-${formatted.severity==='critical'?'critical':formatted.severity==='major'?'high':'medium'}`}>{formatted.severity}</span>
                <span className="tf-chip">{formatted.priority}</span>
                <span className="tf-chip">{formatted.component}</span>
                <span className="tf-chip">{formatted.frequency}</span>
              </div>
              <div style={{padding:10, background:'var(--bg-1)', borderRadius:8, fontSize:11, fontFamily:'JetBrains Mono, monospace', color:'var(--text-1)'}}>
                {formatted.environment.platform} · {formatted.environment.os} · v{formatted.environment.app_version}
              </div>
              <div>
                <div className="tf-label">Steps to reproduce</div>
                <ol style={{paddingLeft:20, fontSize:12, lineHeight:1.6, color:'var(--text-1)'}}>
                  {formatted.steps_to_reproduce.map((s,i) => <li key={i}>{s}</li>)}
                </ol>
              </div>
              <div className="tf-grid-2">
                <div>
                  <div className="tf-label">Expected</div>
                  <div style={{fontSize:12, color:'var(--text-1)', lineHeight:1.5}}>{formatted.expected_result}</div>
                </div>
                <div>
                  <div className="tf-label">Actual</div>
                  <div style={{fontSize:12, color:'var(--error)', lineHeight:1.5}}>{formatted.actual_result}</div>
                </div>
              </div>
              {formatted.root_cause_hypothesis && (
                <div style={{padding:10, background:'var(--accent-glow)', borderRadius:8, fontSize:11, color:'var(--text-0)', borderLeft:'2px solid var(--accent)'}}>
                  <b style={{color:'var(--accent-2)'}}>Hypothesis: </b>{formatted.root_cause_hypothesis}
                </div>
              )}
              <div className="tf-row" style={{flexWrap:'wrap', gap:5}}>
                {(formatted.labels||[]).map(l => <span key={l} className="tf-chip">#{l}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// === GAP FINDER ===
function GapsPage() {
  const I = window.Icons;
  const { PRD_FINDINGS } = window.MockData;
  return (
    <div className="tf-fade-in">
      <div className="tf-page-header">
        <div>
          <div className="tf-page-title"><I.gap size={20} style={{color:'var(--accent-2)'}}/>Requirement Gap Finder</div>
          <div className="tf-page-sub">PRD parsed: <b>Pebble Travel — v1.0 Spec.pdf</b> · 12 pages · 47 requirements identified.</div>
        </div>
        <button className="tf-btn"><I.upload size={14}/>Replace PRD</button>
      </div>

      <div className="tf-grid-4" style={{marginBottom:16}}>
        {[
          {label:'Total findings', value:PRD_FINDINGS.length, color:'var(--accent-2)'},
          {label:'Contradictions', value:1, color:'var(--error)'},
          {label:'Untestable reqs', value:1, color:'var(--warning)'},
          {label:'Ambiguities', value:1, color:'var(--info)'},
        ].map((s,i) => (
          <div key={i} className="tf-card" style={{padding:18}}>
            <div className="tf-stat-label">{s.label}</div>
            <div className="tf-stat" style={{marginTop:6, color:s.color}}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="tf-card">
        <div className="tf-card-head">
          <div className="tf-card-title"><I.alert size={14}/>Findings</div>
          <span className="tf-card-sub">Sorted by severity</span>
        </div>
        <div className="tf-col" style={{gap:8}}>
          {PRD_FINDINGS.map(f => (
            <div key={f.id} style={{padding:14, background:'var(--bg-1)', border:'1px solid var(--border)', borderRadius:12}}>
              <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap'}}>
                <span className="tf-tcrow-id" style={{paddingTop:0, width:'auto'}}>{f.id}</span>
                <span className={`tf-badge tf-badge-${f.severity==='critical'?'critical':f.severity==='high'?'high':'medium'}`}>{f.severity}</span>
                <span className="tf-chip" style={{textTransform:'capitalize'}}>{f.type.replace(/_/g,' ')}</span>
                <span className="tf-mono" style={{fontSize:10, color:'var(--text-2)', marginLeft:'auto'}}>{f.location}</span>
              </div>
              <div style={{fontSize:13, fontWeight:500, marginBottom:4}}>{f.description}</div>
              <div style={{fontSize:12, color:'var(--text-1)'}}><b style={{color:'var(--accent-2)'}}>Suggestion:</b> {f.suggestion}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// === SEMANTIC LINK ===
function SemanticLinkPage() {
  const I = window.Icons;
  const { SEMANTIC_LINKS } = window.MockData;
  const statusMap = {
    verified: { color:'success', icon:'checkCircle', label:'Verified' },
    missing:  { color:'critical', icon:'alert', label:'Missing in UI' },
    mismatch: { color:'high', icon:'alert', label:'Mismatch' },
    untested: { color:'medium', icon:'info', label:'Untested' },
  };
  return (
    <div className="tf-fade-in">
      <div className="tf-page-header">
        <div>
          <div className="tf-page-title"><I.link size={20} style={{color:'var(--accent-2)'}}/>Semantic Link · PRD ↔ UI</div>
          <div className="tf-page-sub">Cross-references requirements from your PRD against analyzed screen elements. Surfaces "missing feature" bugs before launch.</div>
        </div>
        <button className="tf-btn tf-btn-primary"><I.refresh size={14}/>Re-link</button>
      </div>

      <div className="tf-grid-4" style={{marginBottom:16}}>
        {Object.entries(statusMap).map(([k,v]) => {
          const count = SEMANTIC_LINKS.filter(l => l.status === k).length;
          const IC = I[v.icon];
          return (
            <div key={k} className="tf-card" style={{padding:14, display:'flex', alignItems:'center', gap:12}}>
              <div style={{width:36, height:36, borderRadius:10, background:`var(--${v.color === 'success' ? 'success' : 'accent-glow'})`, display:'flex', alignItems:'center', justifyContent:'center', color:`var(--${v.color === 'success' ? 'bg-0' : 'accent-2'})`}}><IC size={18}/></div>
              <div>
                <div className="tf-stat" style={{fontSize:22}}>{count}</div>
                <div style={{fontSize:11, color:'var(--text-1)'}}>{v.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="tf-card">
        <div style={{display:'grid', gridTemplateColumns:'1.5fr 100px 1.2fr 100px 80px', padding:'8px 14px', borderBottom:'1px solid var(--border)', fontSize:10, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:600}}>
          <div>Requirement</div><div>PRD §</div><div>Matched UI</div><div>Status</div><div>Conf.</div>
        </div>
        {SEMANTIC_LINKS.map((l,i) => {
          const meta = statusMap[l.status];
          return (
            <div key={i} style={{display:'grid', gridTemplateColumns:'1.5fr 100px 1.2fr 100px 80px', alignItems:'center', padding:'12px 14px', borderBottom: i < SEMANTIC_LINKS.length-1 ? '1px solid var(--border)' : 'none', gap:10}}>
              <div>
                <div style={{fontSize:13, fontWeight:500}}>{l.req}</div>
                {l.note && <div style={{fontSize:11, color:'var(--text-1)', marginTop:2}}>{l.note}</div>}
              </div>
              <div className="tf-mono" style={{fontSize:11, color:'var(--text-1)'}}>{l.loc}</div>
              <div style={{fontSize:12, color:l.element ? 'var(--text-0)' : 'var(--text-2)'}}>{l.element || '—'} {l.screen && <span style={{color:'var(--text-2)'}}>· {l.screen}</span>}</div>
              <div><span className={`tf-badge tf-badge-${meta.color}`}>{meta.label}</span></div>
              <div className="tf-mono" style={{fontSize:11, color: l.confidence > 0.8 ? 'var(--success)' : l.confidence > 0.5 ? 'var(--warning)' : 'var(--text-2)'}}>{l.confidence ? l.confidence.toFixed(2) : '—'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// === TEST DATA ===
function TestDataPage() {
  const I = window.Icons;
  const [domain, setDomain] = useStateB('e-commerce');
  const [count, setCount] = useStateB(50);
  const sampleData = [
    { id: 1, name: 'Aisha Bello',          email: 'aisha.b@example.com',     country: 'NG', cart: 4, total: '$184.20', status: 'valid' },
    { id: 2, name: 'Lars Müller',          email: 'l.mueller@bsp.de',        country: 'DE', cart: 2, total: '€89.50',  status: 'valid' },
    { id: 3, name: 'Yuki Tanaka',          email: 'yuki@example.jp',         country: 'JP', cart: 7, total: '¥18,400', status: 'valid' },
    { id: 4, name: '\'); DROP TABLE--',    email: 'edge@bad.com',            country: 'US', cart: 1, total: '$12.00',  status: 'edge' },
    { id: 5, name: '👋‍ very long name 🎉',  email: 'unicode@test.io',          country: 'BR', cart: 3, total: 'R$420',   status: 'edge' },
    { id: 6, name: 'María García',         email: 'maria.g+test@ñame.es',    country: 'ES', cart: 0, total: '€0.00',   status: 'edge' },
    { id: 7, name: 'João Silva',           email: 'joao@example.com.br',     country: 'BR', cart: 5, total: 'R$310',   status: 'valid' },
    { id: 8, name: '',                     email: 'invalid-email',           country: '??', cart: 2, total: '$NaN',    status: 'invalid' },
  ];
  return (
    <div className="tf-fade-in">
      <div className="tf-page-header">
        <div>
          <div className="tf-page-title"><I.data size={20} style={{color:'var(--accent-2)'}}/>Synthetic Test Data</div>
          <div className="tf-page-sub">Hybrid generation: 80% via faker.js (cost-free), 20% AI-crafted edge cases. Locale-aware.</div>
        </div>
        <div className="tf-row">
          <button className="tf-btn"><I.download size={14}/>CSV</button>
          <button className="tf-btn"><I.download size={14}/>JSON</button>
          <button className="tf-btn tf-btn-primary"><I.refresh size={14}/>Regenerate</button>
        </div>
      </div>

      <div className="tf-card" style={{marginBottom:16, padding:14}}>
        <div className="tf-row" style={{gap:18, flexWrap:'wrap'}}>
          <div>
            <div className="tf-label">Domain</div>
            <div className="tf-tabs">
              {['e-commerce','fintech','healthcare','social','SaaS'].map(d => (
                <button key={d} className={`tf-tab ${domain===d?'active':''}`} onClick={()=>setDomain(d)}>{d}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="tf-label">Count</div>
            <div className="tf-tabs">
              {[10,50,100,500].map(c => (
                <button key={c} className={`tf-tab ${count===c?'active':''}`} onClick={()=>setCount(c)}>{c}</button>
              ))}
            </div>
          </div>
          <div style={{flex:1, minWidth:180}}>
            <div className="tf-label">Edge case mix</div>
            <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
              {['Unicode','SQL inj','Empty','Long names','Multi-locale'].map((c,i) => (
                <span key={c} className={`tf-chip ${i<4 ? 'active':''}`}>{c}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="tf-card" style={{padding:0, overflow:'hidden'}}>
        <div style={{display:'grid', gridTemplateColumns:'40px 1.4fr 1.6fr 60px 80px 90px 80px', padding:'10px 16px', borderBottom:'1px solid var(--border)', fontSize:10, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:600, background:'var(--bg-2)'}}>
          <div>#</div><div>Name</div><div>Email</div><div>CC</div><div>Cart</div><div>Total</div><div>Tag</div>
        </div>
        {sampleData.map((d,i) => (
          <div key={d.id} style={{display:'grid', gridTemplateColumns:'40px 1.4fr 1.6fr 60px 80px 90px 80px', padding:'10px 16px', borderBottom: i<sampleData.length-1?'1px solid var(--border)':'none', fontSize:12, alignItems:'center', fontFamily:d.status!=='valid'?'JetBrains Mono, monospace':'inherit'}}>
            <div className="tf-mono" style={{color:'var(--text-2)', fontSize:11}}>{d.id}</div>
            <div style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{d.name || <i style={{color:'var(--text-2)'}}>(empty)</i>}</div>
            <div style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color:'var(--text-1)'}}>{d.email}</div>
            <div className="tf-mono" style={{fontSize:11}}>{d.country}</div>
            <div className="tf-mono" style={{fontSize:11}}>{d.cart}</div>
            <div className="tf-mono" style={{fontSize:11}}>{d.total}</div>
            <div>
              <span className={`tf-badge ${d.status==='valid'?'tf-badge-success':d.status==='edge'?'tf-badge-violet':'tf-badge-critical'}`}>{d.status}</span>
            </div>
          </div>
        ))}
        <div style={{padding:'10px 16px', fontSize:11, color:'var(--text-1)', display:'flex', justifyContent:'space-between', background:'var(--bg-2)'}}>
          <span>Showing 8 of {count}</span>
          <span>Generated in 0.42s · 2 GROQ calls + faker.js</span>
        </div>
      </div>
    </div>
  );
}

// === PERSONA FRICTION ===
function PersonaPage() {
  const I = window.Icons;
  const { PERSONAS } = window.MockData;
  const [active, setActive] = useStateB('first-time');
  const friction = {
    'first-time': [
      { screen:'Home', element:'Search bar', type:'cognitive_load', severity:'frustrating', desc:'Too many filter options on first encounter — paralysis', sug:'Progressive disclosure: show 3 popular destinations first.' },
      { screen:'Stay Detail', element:'Booking CTA', type:'trust_issue', severity:'frustrating', desc:'No visible cancellation policy near "Reserve" button', sug:'Surface "Free cancellation" badge above CTA.' },
      { screen:'Checkout', element:'Card form', type:'missing_affordance', severity:'blocking', desc:'No "Why do you need my card now?" explanation before charge', sug:'Add inline microcopy: "We won\'t charge until host confirms."' },
    ],
    'power': [
      { screen:'Search', element:'Filter chips', type:'cognitive_load', severity:'minor', desc:'No keyboard shortcut to apply common filter combos', sug:'Add ⌘+1, ⌘+2 for saved filter presets.' },
      { screen:'Profile', element:'Trips list', type:'missing_affordance', severity:'annoying', desc:'No bulk actions for past trips', sug:'Multi-select with shift-click; bulk archive/export.' },
    ],
    'elderly': [
      { screen:'Search', element:'Close (×) chip button', type:'accessibility', severity:'frustrating', desc:'Touch target 24×24px — below HIG minimum 44px', sug:'Increase to 48×48px touch target.' },
      { screen:'Stay Detail', element:'Date picker', type:'confusion', severity:'frustrating', desc:'Calendar navigation arrows unclear; no month label', sug:'Larger arrows + always-visible month/year heading.' },
      { screen:'Checkout', element:'CVV field', type:'confusion', severity:'frustrating', desc:'No explanation of what CVV is or where to find it', sug:'Inline tooltip with card illustration.' },
    ],
    'low-vision': [
      { screen:'Stay Detail', element:'Price text', type:'accessibility', severity:'blocking', desc:'White text on hero image — 2.4:1 contrast', sug:'Add semi-opaque scrim behind price overlay.' },
      { screen:'Search', element:'Filter chips', type:'accessibility', severity:'frustrating', desc:'Active state indicated by color only (red text)', sug:'Add icon or border weight change on active filter.' },
    ],
  };
  const score = { 'first-time': 64, 'power': 81, 'elderly': 52, 'low-vision': 48 };
  const dropOff = { 'first-time': 'medium', 'power': 'low', 'elderly': 'high', 'low-vision': 'high' };
  const items = friction[active] || [];

  return (
    <div className="tf-fade-in">
      <div className="tf-page-header">
        <div>
          <div className="tf-page-title"><I.persona size={20} style={{color:'var(--accent-2)'}}/>Persona Friction</div>
          <div className="tf-page-sub">AI roleplays each persona browsing your screens. Identifies element-level friction with severity + drop-off risk.</div>
        </div>
      </div>

      <div className="tf-grid-4" style={{marginBottom:16}}>
        {PERSONAS.map(p => (
          <button key={p.id} className="tf-card" onClick={()=>setActive(p.id)} style={{
            padding:16, textAlign:'left', cursor:'pointer',
            borderColor: active===p.id ? 'var(--accent)' : 'var(--border)',
            boxShadow: active===p.id ? '0 0 0 3px var(--accent-glow)' : 'none',
          }}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8}}>
              <div style={{width:32, height:32, borderRadius:'50%', background:'var(--accent-glow)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--accent-2)'}}>
                <I.persona size={16}/>
              </div>
              <span className={`tf-badge tf-badge-${dropOff[p.id]==='high'?'critical':dropOff[p.id]==='medium'?'high':'success'}`}>{dropOff[p.id]} risk</span>
            </div>
            <div style={{fontSize:13, fontWeight:600}}>{p.name}</div>
            <div style={{fontSize:11, color:'var(--text-1)', marginTop:2, lineHeight:1.4}}>{p.empathy}</div>
            <div style={{display:'flex', alignItems:'center', gap:8, marginTop:10}}>
              <div style={{flex:1, height:4, background:'var(--bg-3)', borderRadius:2, overflow:'hidden'}}>
                <div style={{width:`${score[p.id]}%`, height:'100%', background: score[p.id]>=70?'var(--success)':score[p.id]>=55?'var(--warning)':'var(--error)'}}/>
              </div>
              <div className="tf-mono" style={{fontSize:11, fontWeight:600}}>{score[p.id]}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="tf-card">
        <div className="tf-card-head">
          <div className="tf-card-title"><I.alert size={14}/>Friction Points · {PERSONAS.find(p=>p.id===active)?.name}</div>
          <span className="tf-card-sub">{items.length} found</span>
        </div>
        <div className="tf-col" style={{gap:8}}>
          {items.map((f,i) => (
            <div key={i} style={{padding:14, background:'var(--bg-1)', border:'1px solid var(--border)', borderRadius:12}}>
              <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap'}}>
                <span className={`tf-badge tf-badge-${f.severity==='blocking'?'critical':f.severity==='frustrating'?'high':'medium'}`}>{f.severity}</span>
                <span className="tf-chip" style={{textTransform:'capitalize'}}>{f.type.replace(/_/g,' ')}</span>
                <span style={{fontSize:11, color:'var(--text-1)'}}>{f.screen} · <b style={{color:'var(--text-0)'}}>{f.element}</b></span>
              </div>
              <div style={{fontSize:13, marginBottom:4}}>{f.desc}</div>
              <div style={{fontSize:12, color:'var(--text-1)'}}><b style={{color:'var(--accent-2)'}}>Suggestion:</b> {f.sug}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// === I18N AUDIT ===
function I18nPage() {
  const I = window.Icons;
  const { I18N_FINDINGS } = window.MockData;
  return (
    <div className="tf-fade-in">
      <div className="tf-page-header">
        <div>
          <div className="tf-page-title"><I.globe size={20} style={{color:'var(--accent-2)'}}/>Internationalization Audit</div>
          <div className="tf-page-sub">Checks for RTL, text expansion, locale-specific formatting, and cultural assumptions.</div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:16, marginBottom:16}}>
        <div className="tf-card">
          <div className="tf-card-head">
            <div className="tf-card-title"><I.layers size={14}/>Readiness</div>
          </div>
          <div className="tf-stat" style={{color:'var(--warning)'}}>Partially Ready</div>
          <div style={{fontSize:30, color:'var(--text-1)', fontWeight:700, marginTop:4}}>61<span style={{fontSize:14, color:'var(--text-2)'}}>/100</span></div>
          <div style={{height:6, background:'var(--bg-3)', borderRadius:3, overflow:'hidden', marginTop:14}}>
            <div style={{width:'61%', height:'100%', background:'linear-gradient(90deg, var(--warning), var(--accent))'}}/>
          </div>
          <div style={{fontSize:11, color:'var(--text-1)', marginTop:14}}>Recommended test locales</div>
          <div style={{display:'flex', gap:5, flexWrap:'wrap', marginTop:6}}>
            {['en-US','en-GB','de-DE','fr-FR','ar-SA','ja-JP','pt-BR'].map(l => (
              <span key={l} className="tf-chip">{l}</span>
            ))}
          </div>
        </div>
        <div className="tf-card">
          <div className="tf-card-head">
            <div className="tf-card-title"><I.alert size={14}/>Findings <span className="tf-badge tf-badge-violet">{I18N_FINDINGS.length}</span></div>
          </div>
          <div className="tf-col" style={{gap:8}}>
            {I18N_FINDINGS.map((f,i) => (
              <div key={i} style={{padding:12, background:'var(--bg-1)', border:'1px solid var(--border)', borderRadius:10}}>
                <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap'}}>
                  <span className={`tf-badge tf-badge-${f.severity==='critical'?'critical':f.severity==='major'?'high':'medium'}`}>{f.severity}</span>
                  <span className="tf-chip" style={{textTransform:'capitalize'}}>{f.category.replace(/_/g,' ')}</span>
                  <span style={{fontSize:11, color:'var(--text-1)'}}>{f.screen} · <b style={{color:'var(--text-0)'}}>{f.element}</b></span>
                </div>
                <div style={{fontSize:12, marginBottom:4}}>{f.detail}</div>
                <div style={{display:'flex', gap:4, flexWrap:'wrap'}}>
                  {f.locales.map(l => <span key={l} className="tf-chip" style={{fontSize:10}}>{l}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// === SIDEKICK CHAT (panel + page) ===
function SidekickChat({ embedded = false }) {
  const I = window.Icons;
  const { CHAT_PRESETS } = window.MockData;
  const [messages, setMessages] = useStateB([
    { role:'system', text:`Hi! I'm scoped to your **Pebble Travel** project. I know your 6 analyzed screens, 24 test cases, and the latest UX audit. Ask me anything QA-related.` },
  ]);
  const [input, setInput] = useStateB('');
  const [streaming, setStreaming] = useStateB(false);
  const scrollRef = useRefB();

  useEffectB(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streaming]);

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q || streaming) return;
    setMessages(m => [...m, { role:'user', text:q }, { role:'assistant', text:'', streaming:true }]);
    setInput('');
    setStreaming(true);
    try {
      const reply = await window.claude.complete(`You are Tesifye Sidekick, scoped to a project called "Pebble Travel" — a mobile travel booking app for iOS+Android. Context: 6 screens analyzed (Home, Search, Stay Detail, Checkout, Confirmation, Profile), 24 test cases generated, UX score is B+ (78/100), top issues are around error recovery and 3DS confirmation flow. The user role is manual tester. Reply concisely (2-4 short paragraphs max), in markdown, focused on QA insight. Do not be generic. Question: ${q}`);
      setMessages(m => {
        const copy = [...m];
        copy[copy.length-1] = { role:'assistant', text: reply };
        return copy;
      });
    } catch (e) {
      setMessages(m => {
        const copy = [...m];
        copy[copy.length-1] = { role:'assistant', text: 'Sorry — couldn\'t reach the model. Try again in a moment.' };
        return copy;
      });
    }
    setStreaming(false);
  };

  return (
    <div style={{display:'flex', flexDirection:'column', height: embedded ? 'calc(100vh - 110px)' : '100%'}}>
      {!embedded && (
        <div className="tf-page-header">
          <div>
            <div className="tf-page-title"><I.chat size={20} style={{color:'var(--accent-2)'}}/>Sidekick</div>
            <div className="tf-page-sub">Project-aware chat. Knows your scope, screens, and every artifact you've generated.</div>
          </div>
        </div>
      )}
      <div ref={scrollRef} style={{flex:1, overflowY:'auto', padding: embedded ? 0 : '0 0 16px', display:'flex', flexDirection:'column', gap:12}}>
        {messages.map((m,i) => (
          <div key={i} className="tf-fade-in" style={{display:'flex', gap:10, alignItems:'flex-start', flexDirection: m.role==='user'?'row-reverse':'row'}}>
            <div style={{
              width:28, height:28, borderRadius:8,
              background: m.role==='user'?'var(--bg-3)':'linear-gradient(135deg, var(--accent), #6366F1)',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              fontSize:11, fontWeight:600,
            }}>
              {m.role==='user'?'SM':<I.sparkle size={14}/>}
            </div>
            <div style={{
              maxWidth: '78%',
              padding:'10px 14px',
              background: m.role==='user'?'var(--accent-glow)':'var(--bg-2)',
              border: m.role==='user'?'1px solid var(--accent-strong)':'1px solid var(--border)',
              borderRadius: 12,
              fontSize:13, lineHeight:1.55,
              whiteSpace:'pre-wrap', wordBreak:'break-word',
              color: m.role==='user'?'var(--text-0)':'var(--text-0)',
            }}>
              {m.streaming && !m.text ? (
                <div style={{display:'flex', alignItems:'center', gap:5, height:14}}>
                  <span className="tf-typing-dot"/><span className="tf-typing-dot"/><span className="tf-typing-dot"/>
                </div>
              ) : <SimpleMarkdown text={m.text}/>}
            </div>
          </div>
        ))}
      </div>
      {messages.length <= 1 && (
        <div style={{padding:'10px 0', display:'flex', gap:6, flexWrap:'wrap'}}>
          {CHAT_PRESETS.map(p => (
            <button key={p} className="tf-chip" style={{cursor:'pointer'}} onClick={()=>send(p)}>{p}</button>
          ))}
        </div>
      )}
      <div style={{display:'flex', gap:8, padding:'10px 0 0', borderTop:'1px solid var(--border)'}}>
        <input
          className="tf-input"
          placeholder="Ask Sidekick about your project…"
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==='Enter' && send()}
          disabled={streaming}
        />
        <button className="tf-btn tf-btn-primary" onClick={()=>send()} disabled={streaming || !input.trim()}>
          <I.send size={14}/>
        </button>
      </div>
    </div>
  );
}

// Tiny markdown renderer for **bold**, `code`, line breaks
function SimpleMarkdown({ text }) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((p,i) => {
        if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2,-2)}</strong>;
        if (p.startsWith('`') && p.endsWith('`')) return <code key={i} style={{background:'var(--bg-3)', padding:'1px 5px', borderRadius:4, fontSize:11, fontFamily:'JetBrains Mono, monospace'}}>{p.slice(1,-1)}</code>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

// === EXPORT PAGE ===
function ExportPage() {
  const I = window.Icons;
  const formats = [
    { id:'md', label:'Markdown', desc:'Universal, human-readable', icon:'copy', color:'var(--accent-2)' },
    { id:'csv', label:'CSV', desc:'For Jira import / spreadsheets', icon:'data', color:'var(--info)' },
    { id:'json', label:'JSON', desc:'Automation fixtures', icon:'layers', color:'var(--success)' },
    { id:'gherkin', label:'Gherkin (.feature)', desc:'Cucumber/BDD ready', icon:'testCases', color:'var(--warning)' },
    { id:'jira', label:'Jira Markup', desc:'One-click paste', icon:'bug', color:'var(--error)' },
    { id:'linear', label:'Linear', desc:'Linear API formatting', icon:'bug', color:'#A78BFA' },
  ];
  return (
    <div className="tf-fade-in">
      <div className="tf-page-header">
        <div>
          <div className="tf-page-title"><I.export size={20} style={{color:'var(--accent-2)'}}/>Export Engine</div>
          <div className="tf-page-sub">Pick a format. We'll bundle your latest artifacts into a downloadable file.</div>
        </div>
      </div>

      <div className="tf-grid-3" style={{marginBottom:20}}>
        {formats.map(f => {
          const IC = I[f.icon];
          return (
            <div key={f.id} className="tf-card" style={{padding:18}}>
              <div style={{display:'flex', alignItems:'center', gap:10}}>
                <div style={{width:32, height:32, borderRadius:8, background:'var(--bg-3)', display:'flex', alignItems:'center', justifyContent:'center', color:f.color}}><IC size={16}/></div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13, fontWeight:600}}>{f.label}</div>
                  <div style={{fontSize:11, color:'var(--text-1)'}}>{f.desc}</div>
                </div>
              </div>
              <button className="tf-btn" style={{marginTop:14, width:'100%', justifyContent:'center'}}>
                <I.download size={13}/>Download
              </button>
            </div>
          );
        })}
      </div>

      <div className="tf-card">
        <div className="tf-card-head">
          <div className="tf-card-title"><I.layers size={14}/>What's included</div>
        </div>
        <div className="tf-grid-3">
          {[
            {label:'Test cases', count:24, on:true},
            {label:'UX issues', count:5, on:true},
            {label:'Bug reports', count:12, on:true},
            {label:'PRD findings', count:5, on:false},
            {label:'Persona friction', count:10, on:false},
            {label:'Test data sets', count:50, on:false},
          ].map((x,i) => (
            <div key={i} style={{padding:12, background:'var(--bg-1)', borderRadius:8, border:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10}}>
              <div style={{width:32, height:18, borderRadius:9, background: x.on?'var(--accent)':'var(--bg-3)', position:'relative', flexShrink:0, transition:'all 0.15s'}}>
                <div style={{position:'absolute', width:14, height:14, borderRadius:'50%', background:'#fff', top:2, left: x.on?16:2, transition:'all 0.15s'}}/>
              </div>
              <div style={{flex:1, fontSize:12}}>{x.label}</div>
              <div className="tf-mono" style={{fontSize:11, color:'var(--text-1)'}}>{x.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.BugReportPage = BugReportPage;
window.GapsPage = GapsPage;
window.SemanticLinkPage = SemanticLinkPage;
window.TestDataPage = TestDataPage;
window.PersonaPage = PersonaPage;
window.I18nPage = I18nPage;
window.SidekickChat = SidekickChat;
window.ExportPage = ExportPage;
