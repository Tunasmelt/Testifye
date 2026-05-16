// features-a.jsx — Overview, Test Cases, UX Audit, Bug Report

const { useState, useEffect, useRef } = React;

// === OVERVIEW ===
function OverviewPage({ onNav }) {
  const I = window.Icons;
  const { PEBBLE_SCREENS } = window.MockData;
  const PhoneScreen = window.PhoneScreen;
  const stats = [
    { label: 'Test cases', value: '24', delta: '+6 this week', icon: 'testCases' },
    { label: 'UX score', value: 'B+', delta: '↑ 4 pts', icon: 'ux' },
    { label: 'Coverage gaps', value: '5', delta: '−2 resolved', icon: 'gap' },
    { label: 'Open bugs', value: '12', delta: '3 critical', icon: 'bug' },
  ];
  return (
    <div className="tf-fade-in">
      <div className="tf-page-header">
        <div>
          <div className="tf-page-title">
            <span className="tf-pill">✦ Project Brain</span>
            Pebble Travel
          </div>
          <div className="tf-page-sub">Mobile booking app · iOS + Android · Manual + automation testing. Last analyzed 3 minutes ago.</div>
        </div>
        <div className="tf-row">
          <button className="tf-btn"><I.upload size={14}/>Add screenshot</button>
          <button className="tf-btn tf-btn-primary"><I.sparkle size={14}/>Generate</button>
        </div>
      </div>

      <div className="tf-grid-4" style={{ marginBottom: 20 }}>
        {stats.map((s,i) => {
          const IC = I[s.icon];
          return (
            <div key={i} className="tf-card" style={{padding:18}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                <div className="tf-stat-label">{s.label}</div>
                <IC size={14} style={{color:'var(--accent-2)'}}/>
              </div>
              <div className="tf-stat" style={{marginTop:6}}>{s.value}</div>
              <div style={{fontSize:11, color:'var(--text-1)', marginTop:2}}>{s.delta}</div>
            </div>
          );
        })}
      </div>

      <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:20}}>
        <div className="tf-card">
          <div className="tf-card-head">
            <div className="tf-card-title"><I.layers size={14}/>Analyzed Screens <span className="tf-badge tf-badge-violet">{PEBBLE_SCREENS.length}</span></div>
            <button className="tf-btn tf-btn-sm tf-btn-ghost"><I.plus size={12}/>Add</button>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:10}}>
            {PEBBLE_SCREENS.map(s => (
              <div key={s.id} style={{position:'relative'}}>
                <PhoneScreen kind={s.thumb}/>
                {s.dirty && <div style={{position:'absolute', top:-4, right:-4, width:10, height:10, borderRadius:'50%', background:'var(--warning)', boxShadow:'0 0 0 3px var(--bg-0), 0 0 8px var(--warning)'}}/>}
                <div style={{fontSize:10, fontWeight:600, marginTop:6, color:'var(--text-0)'}}>{s.label}</div>
                <div style={{fontSize:9, color:'var(--text-1)', display:'flex', alignItems:'center', gap:4}}>
                  {s.verified ? <I.checkCircle size={10} style={{color:'var(--success)'}}/> : <I.alert size={10} style={{color:'var(--warning)'}}/>}
                  {s.elements} elements
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="tf-card">
          <div className="tf-card-head">
            <div className="tf-card-title"><I.zap size={14}/>Recent Activity</div>
          </div>
          <div className="tf-col" style={{gap:10}}>
            {[
              { t: '2m ago',  l: 'Generated 12 test cases', m: 'llama-3.3-70B · GROQ' },
              { t: '14m ago', l: 'UX audit complete (B+)',   m: 'Maverick + Judge' },
              { t: '1h ago',  l: '3 screenshots analyzed',   m: 'Scout · llama-4-scout' },
              { t: '3h ago',  l: 'PRD parsed (12 pages)',    m: 'Mixtral 8x7B · 32K ctx' },
            ].map((a,i) => (
              <div key={i} style={{display:'flex', gap:10, paddingBottom:10, borderBottom: i<3 ? '1px solid var(--border)' : 'none'}}>
                <div style={{width:6, height:6, borderRadius:'50%', background:'var(--accent)', marginTop:6, flexShrink:0, boxShadow:'0 0 8px var(--accent)'}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:12, fontWeight:500}}>{a.l}</div>
                  <div style={{fontSize:10, color:'var(--text-1)', fontFamily:'JetBrains Mono, monospace'}}>{a.m}</div>
                </div>
                <div style={{fontSize:10, color:'var(--text-2)'}}>{a.t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="tf-card">
        <div className="tf-card-head">
          <div className="tf-card-title"><I.sparkle size={14}/>Jump into a feature</div>
          <span className="tf-card-sub">10 modules · all powered by GROQ multi-stage pipeline</span>
        </div>
        <div className="tf-grid-4" style={{gap:10}}>
          {window.NAV_ITEMS.slice(1).map(item => {
            const IC = I[item.icon];
            return (
              <button key={item.id} onClick={()=>onNav(item.id)} style={{
                display:'flex', flexDirection:'column', alignItems:'flex-start', gap:8,
                padding:14, background:'var(--bg-1)', border:'1px solid var(--border)',
                borderRadius:12, color:'var(--text-0)', textAlign:'left', transition:'all 0.15s',
              }} onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent-strong)'; e.currentTarget.style.background='var(--bg-2)';}} onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--bg-1)';}}>
                <div style={{width:32, height:32, borderRadius:8, background:'var(--accent-glow)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--accent-2)'}}>
                  <IC size={16}/>
                </div>
                <div style={{fontSize:12, fontWeight:600}}>{item.label}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// === TEST CASE GENERATOR ===
function TestCasesPage() {
  const I = window.Icons;
  const { TEST_CASES } = window.MockData;
  const [generating, setGenerating] = useState(false);
  const [streamedCount, setStreamedCount] = useState(TEST_CASES.length);
  const [verifyingIds, setVerifyingIds] = useState([]);
  const [filter, setFilter] = useState('all');
  const [partial, setPartial] = useState(false);
  const [role, setRole] = useState('manual');

  const startGeneration = () => {
    setGenerating(true);
    setStreamedCount(0);
    setPartial(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setStreamedCount(i);
      // simulate occasional partial failure on the 8th item
      if (i === 8 && Math.random() < 0.0) { /* disabled randomness for predictability */ }
      if (i >= TEST_CASES.length) {
        clearInterval(interval);
        setGenerating(false);
        // Judge phase
        setVerifyingIds(TEST_CASES.map(t => t.id));
        setTimeout(()=>setVerifyingIds([]), 1400);
      }
    }, 320);
  };

  const triggerPartial = () => {
    setGenerating(true);
    setStreamedCount(0);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setStreamedCount(i);
      if (i >= 5) {
        clearInterval(interval);
        setGenerating(false);
        setPartial(true);
      }
    }, 320);
  };

  const filtered = TEST_CASES.filter(tc => filter === 'all' || tc.category === filter);
  const visible = filtered.slice(0, streamedCount);
  const skeletonCount = Math.max(0, Math.min(3, TEST_CASES.length - streamedCount));

  const cats = ['all','functional','edge','negative','accessibility','performance'];

  return (
    <div className="tf-fade-in">
      <div className="tf-page-header">
        <div>
          <div className="tf-page-title">
            <I.testCases size={20} style={{color:'var(--accent-2)'}}/>
            Test Case Generator
          </div>
          <div className="tf-page-sub">Scout → Generator → Judge pipeline. Streams structured test cases verified against analyzed screen elements.</div>
        </div>
        <div className="tf-row">
          <button className="tf-btn tf-btn-sm" onClick={triggerPartial}><I.alert size={12}/>Demo: partial fail</button>
          <button className="tf-btn tf-btn-primary" onClick={startGeneration} disabled={generating}>
            {generating ? <><span className="tf-spin"><I.refresh size={14}/></span>Generating…</> : <><I.sparkle size={14}/>Generate Suite</>}
          </button>
        </div>
      </div>

      {/* Config row */}
      <div className="tf-card" style={{ marginBottom: 16, padding: 14 }}>
        <div style={{display:'flex', gap:14, flexWrap:'wrap', alignItems:'center'}}>
          <div>
            <div className="tf-label" style={{marginBottom:4}}>Tester role</div>
            <div className="tf-tabs">
              {[
                ['manual','Manual'],
                ['automation','Automation'],
                ['pm','PM'],
                ['lead','QA Lead'],
              ].map(([k,v]) => (
                <button key={k} className={`tf-tab ${role===k?'active':''}`} onClick={()=>setRole(k)}>{v}</button>
              ))}
            </div>
          </div>
          <div style={{flex:1, minWidth:200}}>
            <div className="tf-label" style={{marginBottom:4}}>Focus areas</div>
            <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
              {['Auth','Payments','Forms','Search','Errors','A11y','Performance'].map((f,i) => (
                <span key={f} className={`tf-chip ${i<4 ? 'active' : ''}`}>{f}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Partial banner */}
      {partial && (
        <div className="tf-card tf-fade-in" style={{marginBottom:16, padding:14, borderColor:'var(--warning)', background:'rgba(251,191,36,0.05)'}}>
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <I.alert size={18} style={{color:'var(--warning)'}}/>
            <div style={{flex:1}}>
              <div style={{fontWeight:600, fontSize:13}}>Generation interrupted</div>
              <div style={{fontSize:12, color:'var(--text-1)'}}>5 of ~12 test cases generated. Network drop on llama-3.3-70b · falling back to Google Gemini.</div>
            </div>
            <button className="tf-btn tf-btn-sm" onClick={()=>setPartial(false)}>Keep partial</button>
            <button className="tf-btn tf-btn-sm tf-btn-primary" onClick={()=>{ setPartial(false); startGeneration(); }}>Resume</button>
          </div>
        </div>
      )}

      {/* Filter row */}
      <div className="tf-row" style={{marginBottom:14, justifyContent:'space-between'}}>
        <div style={{display:'flex', gap:6}}>
          {cats.map(c => (
            <button key={c} className={`tf-chip ${filter===c?'active':''}`} onClick={()=>setFilter(c)} style={{textTransform:'capitalize'}}>
              {c} {c==='all' && <span style={{opacity:0.6, marginLeft:4}}>{TEST_CASES.length}</span>}
            </button>
          ))}
        </div>
        <div style={{display:'flex', gap:6}}>
          <span className="tf-provider-badge"><span className="tf-dot"></span>Powered by GROQ</span>
          <button className="tf-btn tf-btn-sm"><I.download size={12}/>Export</button>
        </div>
      </div>

      {/* Test cases */}
      <div className="tf-col" style={{gap:8}}>
        {visible.map((tc, i) => (
          <div key={tc.id} className="tf-tcrow tf-fade-in" style={{animationDelay:`${i*30}ms`}}>
            <div className="tf-tcrow-id">{tc.id}</div>
            <div className="tf-tcrow-body">
              <div className="tf-tcrow-title">{tc.title}</div>
              <div className="tf-tcrow-meta">
                <span className={`tf-badge tf-badge-${tc.priority === 'critical' ? 'critical' : tc.priority === 'high' ? 'high' : tc.priority === 'medium' ? 'medium' : 'low'}`}>{tc.priority}</span>
                <span className="tf-chip">{tc.category}</span>
                <span style={{fontSize:11, color:'var(--text-1)'}}>· {tc.steps} steps · screen: <b style={{color:'var(--text-0)'}}>{tc.screen}</b></span>
                {!tc.verified && tc.note && (
                  <span className="tf-badge tf-badge-high" title={tc.note}><I.alert size={9}/>unverified</span>
                )}
              </div>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:6}}>
              {verifyingIds.includes(tc.id) ? (
                <span className="tf-badge tf-badge-violet"><span className="tf-spin" style={{display:'inline-flex'}}><I.refresh size={9}/></span>verifying</span>
              ) : tc.verified ? (
                <span className="tf-badge tf-badge-success"><I.check size={9}/>verified</span>
              ) : null}
              <button className="tf-btn tf-btn-icon tf-btn-ghost"><I.more size={13}/></button>
            </div>
          </div>
        ))}

        {Array.from({length: skeletonCount}).map((_, i) => (
          <div key={'sk'+i} className="tf-tcrow">
            <div className="tf-tcrow-id"><div className="tf-skeleton" style={{height:10, width:40}}/></div>
            <div className="tf-tcrow-body">
              <div className="tf-skeleton" style={{height:12, width:'70%', marginBottom:6}}/>
              <div className="tf-skeleton" style={{height:9, width:'45%'}}/>
            </div>
          </div>
        ))}

        {streamedCount === 0 && !generating && (
          <div style={{textAlign:'center', padding:'40px 20px', color:'var(--text-1)'}}>
            <I.sparkle size={28} style={{color:'var(--accent-2)', marginBottom:8}}/>
            <div style={{fontSize:14, fontWeight:600, color:'var(--text-0)'}}>Ready when you are</div>
            <div style={{fontSize:12, marginTop:4}}>Click Generate to stream test cases live.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// === UX AUDIT ===
function UXPage() {
  const I = window.Icons;
  const { UX_HEURISTICS, UX_ISSUES, A11Y_FLAGS } = window.MockData;
  const overall = 78;
  const grade = 'B+';

  return (
    <div className="tf-fade-in">
      <div className="tf-page-header">
        <div>
          <div className="tf-page-title"><I.ux size={20} style={{color:'var(--accent-2)'}}/>UX/UI Auditor</div>
          <div className="tf-page-sub">Nielsen's 10 Heuristics + WCAG 2.1 AA. Pre-AI screen metrics extract real contrast ratios from pixel data.</div>
        </div>
        <button className="tf-btn tf-btn-primary"><I.refresh size={14}/>Re-audit</button>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1.2fr 1fr 1fr', gap:16, marginBottom:16}}>
        {/* Score card */}
        <div className="tf-card" style={{padding:24, position:'relative', overflow:'hidden'}}>
          <div style={{position:'absolute', top:-30, right:-30, width:140, height:140, borderRadius:'50%', background:'var(--accent-glow)', filter:'blur(40px)'}}/>
          <div className="tf-stat-label">Overall UX Score</div>
          <div style={{display:'flex', alignItems:'baseline', gap:14, marginTop:6}}>
            <div className="tf-stat" style={{fontSize:54}}>{grade}</div>
            <div style={{fontSize:18, color:'var(--text-1)'}}>{overall}/100</div>
          </div>
          <div style={{display:'flex', gap:12, marginTop:14, fontSize:11}}>
            <span style={{color:'var(--success)'}}>↑ 4 pts since last audit</span>
            <span style={{color:'var(--text-2)'}}>·</span>
            <span style={{color:'var(--text-1)'}}>6 screens analyzed</span>
          </div>
          {/* Mini trend */}
          <svg viewBox="0 0 200 50" style={{width:'100%', height:50, marginTop:10, position:'relative', zIndex:1}}>
            <defs>
              <linearGradient id="grad1" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="var(--accent)" stopOpacity="0.3"/>
                <stop offset="1" stopColor="var(--accent)" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path d="M0 40 L30 35 L60 38 L90 28 L120 30 L150 22 L180 18 L200 14 L200 50 L0 50 Z" fill="url(#grad1)"/>
            <path d="M0 40 L30 35 L60 38 L90 28 L120 30 L150 22 L180 18 L200 14" stroke="var(--accent-2)" strokeWidth="1.5" fill="none"/>
            {[40,35,38,28,30,22,18,14].map((y,i) => (
              <circle key={i} cx={i*28.5} cy={y} r="2" fill="var(--accent-2)"/>
            ))}
          </svg>
        </div>

        {/* Heuristic radar (just bars) */}
        <div className="tf-card" style={{gridColumn:'span 2'}}>
          <div className="tf-card-head">
            <div className="tf-card-title"><I.layers size={14}/>Heuristic Breakdown</div>
            <span className="tf-card-sub">10 dimensions</span>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 16px'}}>
            {UX_HEURISTICS.map(h => (
              <div key={h.id} style={{display:'flex', alignItems:'center', gap:10}}>
                <div style={{fontSize:10, color:'var(--text-2)', width:14, fontFamily:'JetBrains Mono, monospace'}}>{h.id}</div>
                <div style={{fontSize:11, flex:1, color:'var(--text-1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{h.name}</div>
                <div style={{flex:'none', width:80, height:4, background:'var(--bg-3)', borderRadius:2, overflow:'hidden'}}>
                  <div style={{
                    width:`${h.score*10}%`, height:'100%',
                    background: h.score >= 8 ? 'var(--success)' : h.score >= 6 ? 'var(--accent)' : 'var(--warning)',
                  }}/>
                </div>
                <div style={{fontSize:11, fontWeight:600, fontFamily:'JetBrains Mono, monospace', width:24, textAlign:'right'}}>{h.score.toFixed(1)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Issues list */}
      <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:16}}>
        <div className="tf-card">
          <div className="tf-card-head">
            <div className="tf-card-title"><I.alert size={14}/>Issues Found <span className="tf-badge tf-badge-violet">{UX_ISSUES.length}</span></div>
            <div style={{display:'flex', gap:6}}>
              <span className="tf-chip active">All</span>
              <span className="tf-chip">Quick wins</span>
            </div>
          </div>
          <div className="tf-col" style={{gap:8}}>
            {UX_ISSUES.map(iss => (
              <div key={iss.id} style={{padding:14, background:'var(--bg-1)', border:'1px solid var(--border)', borderRadius:12}}>
                <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:6}}>
                  <span className="tf-tcrow-id" style={{paddingTop:0, width:'auto'}}>{iss.id}</span>
                  <span className={`tf-badge tf-badge-${iss.severity === 'critical' ? 'critical' : iss.severity === 'major' ? 'high' : 'medium'}`}>{iss.severity}</span>
                  <span className="tf-chip">H{iss.heuristic}</span>
                  <span style={{fontSize:11, color:'var(--text-1)'}}>· {iss.screen}</span>
                  <span style={{marginLeft:'auto'}} className={`tf-badge ${iss.effort==='quick-win' ? 'tf-badge-success' : 'tf-badge-medium'}`}>{iss.effort}</span>
                </div>
                <div style={{fontSize:13, fontWeight:500, marginBottom:4}}>{iss.description}</div>
                <div style={{fontSize:12, color:'var(--text-1)'}}><b style={{color:'var(--accent-2)'}}>Fix:</b> {iss.suggestion}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="tf-col">
          <div className="tf-card">
            <div className="tf-card-head">
              <div className="tf-card-title"><I.eye size={14}/>Pre-AI Pixel Metrics</div>
            </div>
            <div style={{fontSize:11, color:'var(--text-1)', marginBottom:10}}>Extracted client-side from screenshots — grounds AI in real data.</div>
            <div className="tf-col" style={{gap:8}}>
              <div style={{padding:10, background:'var(--bg-1)', border:'1px solid var(--border)', borderRadius:8}}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:11}}>
                  <span style={{color:'var(--text-1)'}}>Avg contrast (text)</span>
                  <span className="tf-mono" style={{color:'var(--success)'}}>5.8:1 ✓</span>
                </div>
              </div>
              <div style={{padding:10, background:'var(--bg-1)', border:'1px solid var(--border)', borderRadius:8}}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:11}}>
                  <span style={{color:'var(--text-1)'}}>Worst contrast pair</span>
                  <span className="tf-mono" style={{color:'var(--error)'}}>2.4:1 ✗</span>
                </div>
              </div>
              <div style={{padding:10, background:'var(--bg-1)', border:'1px solid var(--border)', borderRadius:8}}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:6}}>
                  <span style={{color:'var(--text-1)'}}>Dominant palette</span>
                  <span className="tf-mono" style={{color:'var(--text-1)'}}>5 hues</span>
                </div>
                <div style={{display:'flex', gap:4}}>
                  {['#E11D48','#FAFAFA','#0F0F12','#FCA5A5','#FB923C'].map(c => (
                    <div key={c} style={{flex:1, height:18, background:c, borderRadius:3}}/>
                  ))}
                </div>
              </div>
              <div style={{padding:10, background:'var(--bg-1)', border:'1px solid var(--border)', borderRadius:8}}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:11}}>
                  <span style={{color:'var(--text-1)'}}>Whitespace ratio</span>
                  <span className="tf-mono">48%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="tf-card">
            <div className="tf-card-head">
              <div className="tf-card-title"><I.alert size={14}/>A11y Flags</div>
              <span className="tf-card-sub">{A11Y_FLAGS.length}</span>
            </div>
            <div className="tf-col" style={{gap:8}}>
              {A11Y_FLAGS.map((f,i) => (
                <div key={i} style={{padding:10, background:'var(--bg-1)', border:'1px solid var(--border)', borderRadius:8}}>
                  <div style={{fontSize:11, fontWeight:600, display:'flex', justifyContent:'space-between'}}>
                    <span style={{textTransform:'capitalize'}}>{f.type.replace('_',' ')}</span>
                    <span className="tf-mono" style={{color:'var(--text-2)'}}>WCAG {f.criterion}</span>
                  </div>
                  <div style={{fontSize:10, color:'var(--text-1)', marginTop:3}}>{f.element} · {f.screen}</div>
                  <div style={{fontSize:10, color:'var(--text-1)', marginTop:3}}>{f.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.OverviewPage = OverviewPage;
window.TestCasesPage = TestCasesPage;
window.UXPage = UXPage;
