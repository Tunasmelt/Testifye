// phone-screens.jsx — Believable mobile app screens drawn in CSS/SVG
// Pebble Travel — a generic Airbnb/Booking-inspired stays app

const PScreenChrome = ({ children, time = '9:41', dark = false }) => (
  <div style={{
    width: '100%', height: '100%',
    background: dark ? '#0F0F12' : '#FAFAFA',
    color: dark ? '#fff' : '#0F0F12',
    fontFamily: 'Inter, sans-serif',
    fontSize: 9,
    overflow: 'hidden',
    position: 'relative',
  }}>
    {/* Status bar */}
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '6px 14px 2px', fontSize: 8, fontWeight: 600,
    }}>
      <span>{time}</span>
      <span>● ● ●</span>
    </div>
    {children}
  </div>
);

// Home / Discover screen — Airbnb-ish
const PScreenHome = () => (
  <PScreenChrome>
    <div style={{ padding: '4px 12px 8px' }}>
      {/* Search bar */}
      <div style={{
        background: '#fff', borderRadius: 24, padding: '6px 10px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 6,
        border: '1px solid #eee',
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', border: '1.2px solid #444' }}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 8 }}>Anywhere</div>
          <div style={{ fontSize: 7, color: '#888' }}>Any week · Add guests</div>
        </div>
        <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#E11D48', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize: 7 }}>≡</div>
      </div>
      {/* Category strip */}
      <div style={{ display: 'flex', gap: 10, marginTop: 8, overflow: 'hidden' }}>
        {['Beach','Cabin','City','Pool','Lake','Ski'].map((c,i) => (
          <div key={i} style={{ textAlign:'center', flex:'none' }}>
            <div style={{ width: 16, height: 16, background: '#E5E5E5', borderRadius: 4, margin: '0 auto 2px' }}/>
            <div style={{ fontSize: 7, color: i===0 ? '#000' : '#888', fontWeight: i===0 ? 600 : 400, borderBottom: i===0 ? '1.5px solid #000' : 'none' }}>{c}</div>
          </div>
        ))}
      </div>
    </div>
    {/* Listing card */}
    <div style={{ padding: '0 12px' }}>
      <div style={{
        width: '100%', aspectRatio: '1.2', borderRadius: 8,
        background: 'linear-gradient(135deg, #FCA5A5 0%, #FB923C 50%, #FCD34D 100%)',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: 6, right: 6, width: 12, height: 12, borderRadius: '50%', background: 'rgba(0,0,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize: 7 }}>♡</div>
        <div style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(255,255,255,0.95)', padding:'2px 6px', borderRadius: 4, fontSize: 7, fontWeight: 600 }}>Guest favorite</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <div style={{ fontSize: 8, fontWeight: 600 }}>Malibu Beach House</div>
        <div style={{ fontSize: 8 }}>★ 4.92</div>
      </div>
      <div style={{ fontSize: 7, color: '#888' }}>2 hrs from LA</div>
      <div style={{ fontSize: 8, fontWeight: 600, marginTop: 1 }}>$420 <span style={{ fontWeight: 400, color: '#666' }}>/ night</span></div>
    </div>
    {/* Bottom nav */}
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      borderTop: '1px solid #eee', background: '#fff',
      display: 'flex', justifyContent: 'space-around', padding: '6px 0',
    }}>
      {['Explore','Wish','Trips','Inbox','Profile'].map((t,i) => (
        <div key={i} style={{ textAlign: 'center', color: i===0 ? '#E11D48' : '#aaa' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'currentColor', opacity: i===0 ? 1 : 0.3, margin: '0 auto 1px' }}/>
          <div style={{ fontSize: 6, fontWeight: 500 }}>{t}</div>
        </div>
      ))}
    </div>
  </PScreenChrome>
);

const PScreenSearch = () => (
  <PScreenChrome>
    <div style={{ padding: '4px 12px' }}>
      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
        <div style={{width:14,height:14,borderRadius:'50%',background:'#eee',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9}}>‹</div>
        <div style={{ flex:1, background:'#fff', borderRadius:18, padding:'4px 8px', fontSize:7, border:'1px solid #eee' }}>Costa Rica · 5 nights · 2 guests</div>
      </div>
      {/* Filter chips */}
      <div style={{ display:'flex', gap:4, marginTop:6, overflow:'hidden' }}>
        {['Map','Filters','$$','Guest fave','Pool'].map((f,i)=>(
          <div key={i} style={{ padding:'2px 6px', borderRadius: 10, border: '1px solid #ddd', fontSize:7, background: i===1 ? '#000' : '#fff', color: i===1 ? '#fff' : '#000', flex:'none' }}>{f}</div>
        ))}
      </div>
      <div style={{ fontSize:7, color:'#666', marginTop:8, fontWeight:500 }}>340+ stays</div>
    </div>
    {[0,1].map(i => (
      <div key={i} style={{ padding: '6px 12px', display:'flex', gap:8 }}>
        <div style={{ width: 50, height: 40, borderRadius: 6, background: i===0 ? 'linear-gradient(135deg,#60A5FA,#3B82F6)' : 'linear-gradient(135deg,#34D399,#10B981)' }}/>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:8, fontWeight:600 }}>{i===0 ? 'Jungle Treehouse' : 'Beachfront Bungalow'}</div>
          <div style={{ fontSize:7, color:'#888' }}>Manuel Antonio · ★ 4.{i===0?'88':'95'}</div>
          <div style={{ fontSize:7, color:'#888' }}>4 guests · 2 beds</div>
          <div style={{ fontSize:8, fontWeight:600, marginTop:2 }}>${i===0 ? '180' : '290'} <span style={{fontWeight:400, color:'#666'}}>night</span></div>
        </div>
      </div>
    ))}
  </PScreenChrome>
);

const PScreenDetail = () => (
  <PScreenChrome>
    <div style={{
      width:'100%', aspectRatio:'1.5',
      background: 'linear-gradient(135deg, #A78BFA 0%, #EC4899 60%, #F59E0B 100%)',
      position:'relative',
    }}>
      <div style={{ position:'absolute', top:6, left:8, width:14, height:14, borderRadius:'50%', background:'rgba(255,255,255,0.9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9 }}>‹</div>
      <div style={{ position:'absolute', top:6, right:8, display:'flex', gap:4 }}>
        <div style={{ width:14, height:14, borderRadius:'50%', background:'rgba(255,255,255,0.9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8 }}>↑</div>
        <div style={{ width:14, height:14, borderRadius:'50%', background:'rgba(255,255,255,0.9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8 }}>♡</div>
      </div>
      <div style={{ position:'absolute', bottom:4, right:8, background:'rgba(0,0,0,0.5)', color:'#fff', padding:'1px 5px', borderRadius:8, fontSize:6 }}>1/12</div>
    </div>
    <div style={{ padding: '6px 10px' }}>
      <div style={{ fontSize:9, fontWeight:700 }}>Cliffside Villa with Infinity Pool</div>
      <div style={{ fontSize:7, color:'#666', marginTop:1 }}>Santorini, Greece</div>
      <div style={{ display:'flex', gap:4, marginTop:3, fontSize:7, color:'#444' }}>
        <span>★ 4.97 · 124 reviews</span>
      </div>
      <div style={{ height: 1, background:'#eee', margin:'6px 0' }}/>
      <div style={{ fontSize:8, fontWeight:600 }}>Entire villa hosted by Maria</div>
      <div style={{ fontSize:7, color:'#666' }}>6 guests · 3 beds · 2 baths</div>
    </div>
    <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'6px 10px', background:'#fff', borderTop:'1px solid #eee', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div>
        <div style={{ fontSize:9, fontWeight:700 }}>$685 <span style={{fontWeight:400, color:'#666', fontSize:7}}>/night</span></div>
        <div style={{ fontSize:6, color:'#666', textDecoration:'underline' }}>Mar 12 – 17</div>
      </div>
      <div style={{ background:'#E11D48', color:'#fff', padding:'5px 14px', borderRadius:6, fontSize:8, fontWeight:600 }}>Reserve</div>
    </div>
  </PScreenChrome>
);

const PScreenCheckout = () => (
  <PScreenChrome>
    <div style={{ padding:'4px 10px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <div style={{width:12,height:12,fontSize:9}}>‹</div>
        <div style={{ fontSize:9, fontWeight:700 }}>Confirm and pay</div>
      </div>
      <div style={{ marginTop:6, padding:6, background:'#fff', borderRadius:6, border:'1px solid #eee', display:'flex', gap:6 }}>
        <div style={{ width:30, height:30, borderRadius:4, background:'linear-gradient(135deg,#A78BFA,#EC4899)' }}/>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:7, fontWeight:600 }}>Cliffside Villa</div>
          <div style={{ fontSize:6, color:'#888' }}>Mar 12–17 · 2 guests</div>
        </div>
      </div>
      <div style={{ fontSize:8, fontWeight:600, marginTop:8 }}>Pay with</div>
      <div style={{ marginTop:4, padding:6, background:'#000', color:'#fff', borderRadius:5, textAlign:'center', fontSize:9, fontWeight:600 }}>Apple Pay</div>
      <div style={{ marginTop:3, padding:6, background:'#fff', borderRadius:5, border:'1px solid #ddd', display:'flex', alignItems:'center', gap:5 }}>
        <div style={{ width:14, height:10, background:'#1A1F71', borderRadius:1 }}/>
        <div style={{ flex:1, fontSize:7 }}>•••• 4242</div>
        <div style={{ width:8, height:8, borderRadius:'50%', border:'1.5px solid #E11D48' }}/>
      </div>
      <div style={{ marginTop:6, fontSize:7, color:'#666', fontWeight:600 }}>Price details</div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:7, marginTop:2 }}><span>$685 × 5 nights</span><span>$3,425</span></div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:7 }}><span>Cleaning fee</span><span>$120</span></div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:7, fontWeight:700, borderTop:'1px solid #eee', paddingTop:2, marginTop:2 }}><span>Total (USD)</span><span>$3,545</span></div>
    </div>
    <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:6, background:'#fff', borderTop:'1px solid #eee' }}>
      <div style={{ background:'#E11D48', color:'#fff', padding:5, borderRadius:5, textAlign:'center', fontSize:8, fontWeight:600 }}>Confirm and pay</div>
    </div>
  </PScreenChrome>
);

const PScreenConfirm = () => (
  <PScreenChrome dark>
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', padding:'0 12px', textAlign:'center' }}>
      <div style={{ width:36, height:36, borderRadius:'50%', background:'#34D399', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, color:'#000', fontWeight:700, marginBottom:8 }}>✓</div>
      <div style={{ fontSize:11, fontWeight:700 }}>You're going to Greece!</div>
      <div style={{ fontSize:7, color:'#999', marginTop:3 }}>Booking #PT-49281 confirmed.</div>
      <div style={{ marginTop:12, padding:'5px 12px', border:'1px solid #fff', borderRadius:5, fontSize:8 }}>View itinerary</div>
    </div>
  </PScreenChrome>
);

const PScreenProfile = () => (
  <PScreenChrome>
    <div style={{ padding:'4px 10px' }}>
      <div style={{ fontSize:11, fontWeight:700 }}>Profile</div>
      <div style={{ marginTop:6, display:'flex', alignItems:'center', gap:6 }}>
        <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#F472B6,#A78BFA)' }}/>
        <div>
          <div style={{ fontSize:8, fontWeight:600 }}>Sam Mendez</div>
          <div style={{ fontSize:7, color:'#888' }}>Show profile ›</div>
        </div>
      </div>
      <div style={{ marginTop:8 }}>
        {['Personal info','Payments','Notifications','Privacy','Help'].map((label,i) => (
          <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #eee', fontSize:8 }}>
            <span>{label}</span>
            <span style={{ color:'#aaa' }}>›</span>
          </div>
        ))}
      </div>
    </div>
  </PScreenChrome>
);

const PHONE_SCREEN_MAP = {
  home: PScreenHome,
  search: PScreenSearch,
  detail: PScreenDetail,
  checkout: PScreenCheckout,
  confirmation: PScreenConfirm,
  profile: PScreenProfile,
};

function PhoneScreen({ kind, size = 'thumb' }) {
  const Comp = PHONE_SCREEN_MAP[kind] || PScreenHome;
  return (
    <div className={size === 'thumb' ? 'tf-screen-thumb' : 'tf-screen'} style={{ background:'#fff' }}>
      <Comp />
    </div>
  );
}

window.PhoneScreen = PhoneScreen;
