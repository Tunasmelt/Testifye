// marketing-shared.jsx — shared icons, helpers, nav, footer
const { useState: useStateM, useEffect: useEffectM, useRef: useRefM } = React;

const MIcon = {
  logo: (p)=> <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  arrow: (p)=> <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  check: (p)=> <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  spark: (p)=> <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>,
  flask: (p)=> <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M9 3h6M10 3v5l-5 11a2 2 0 002 3h10a2 2 0 002-3l-5-11V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  eye: (p)=> <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>,
  bug: (p)=> <svg viewBox="0 0 24 24" fill="none" {...p}><rect x="7" y="9" width="10" height="11" rx="5" stroke="currentColor" strokeWidth="1.8"/><path d="M9 6l-1-2M15 6l1-2M3 13h4M17 13h4M5 9l3 1M19 9l-3 1M5 18l3-2M19 18l-3-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  link: (p)=> <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7L11 7M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7L13 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  data: (p)=> <svg viewBox="0 0 24 24" fill="none" {...p}><ellipse cx="12" cy="6" rx="8" ry="3" stroke="currentColor" strokeWidth="1.8"/><path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" stroke="currentColor" strokeWidth="1.8"/></svg>,
  user: (p)=> <svg viewBox="0 0 24 24" fill="none" {...p}><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8"/></svg>,
  globe: (p)=> <svg viewBox="0 0 24 24" fill="none" {...p}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" stroke="currentColor" strokeWidth="1.8"/></svg>,
  chat: (p)=> <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M21 12a8 8 0 01-11.5 7.2L4 21l1.8-5.5A8 8 0 1121 12z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  download: (p)=> <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M12 4v12m0 0l-5-5m5 5l5-5M5 20h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  shield: (p)=> <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  bolt: (p)=> <svg viewBox="0 0 24 24" fill="none" {...p}><path d="M13 2L3 14h7l-1 8 11-13h-7l0-7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
};

function MNav({ active }) {
  const [scrolled, setScrolled] = useStateM(false);
  useEffectM(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <nav className={`nav ${scrolled?'scrolled':''}`}>
      <div className="container nav-inner">
        <a href="Tesifye Landing.html" className="logo">
          <span className="logo-mark"><MIcon.logo/></span>
          <span>Tesifye</span>
        </a>
        <div className="nav-links">
          <a href="Tesifye Landing.html#features" className={active==='features'?'active':''}>Features</a>
          <a href="Tesifye Pricing.html" className={active==='pricing'?'active':''}>Pricing</a>
          <a href="Tesifye About.html" className={active==='about'?'active':''}>About</a>
          <a href="Tesifye Tour.html">Live Demo</a>
        </div>
        <div className="nav-cta">
          <a href="#" className="btn btn-ghost btn-sm">Sign in</a>
          <a href="Tesifye Tour.html" className="btn btn-primary btn-sm">Try free<MIcon.arrow style={{width:13, height:13}}/></a>
        </div>
      </div>
    </nav>
  );
}

function MFooter() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <a href="Tesifye Landing.html" className="logo">
              <span className="logo-mark"><MIcon.logo/></span>
              <span>Tesifye</span>
            </a>
            <p className="footer-tag">AI testing partner — from PRD parsing to bug-ready tickets. Built on GROQ for sub-second turnaround.</p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <ul>
              <li><a href="Tesifye Landing.html#features">Features</a></li>
              <li><a href="Tesifye Pricing.html">Pricing</a></li>
              <li><a href="Tesifye Tour.html">Live demo</a></li>
              <li><a href="#">Changelog</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Solutions</h4>
            <ul>
              <li><a href="#">For Manual QA</a></li>
              <li><a href="#">For Automation</a></li>
              <li><a href="#">For PMs</a></li>
              <li><a href="#">For Agencies</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li><a href="Tesifye About.html">About</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Press kit</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <ul>
              <li><a href="#">Docs</a></li>
              <li><a href="#">API</a></li>
              <li><a href="#">Templates</a></li>
              <li><a href="#">Status</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 Tesifye Labs. Crafted with care.</span>
          <div style={{display:'flex', gap:24}}>
            <a href="#" style={{color:'inherit'}}>Privacy</a>
            <a href="#" style={{color:'inherit'}}>Terms</a>
            <a href="#" style={{color:'inherit'}}>Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Scroll-reveal hook: applies .in to all .reveal/.reveal-zoom/.reveal-left when they enter viewport
function useScrollReveal() {
  useEffectM(() => {
    const items = document.querySelectorAll('.reveal, .reveal-zoom, .reveal-left');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    items.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// Animated number that counts up when revealed
function CountUp({ to, duration = 1400, suffix = '', prefix = '' }) {
  const [val, setVal] = useStateM(0);
  const ref = useRefM();
  useEffectM(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const start = performance.now();
          const animate = (now) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setVal(to * eased);
            if (t < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
          io.disconnect();
        }
      });
    }, { threshold: 0.4 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [to, duration]);
  const display = Number.isInteger(to) ? Math.round(val).toLocaleString() : val.toFixed(1);
  return <span ref={ref}>{prefix}{display}{suffix}</span>;
}

window.MIcon = MIcon;
window.MNav = MNav;
window.MFooter = MFooter;
window.useScrollReveal = useScrollReveal;
window.CountUp = CountUp;
