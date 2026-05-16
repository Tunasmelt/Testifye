import Link from 'next/link';

function LogoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={16} height={16} style={{ color: 'white' }}>
      <path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function MarketingFooter() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <Link href="/" className="logo">
              <span className="logo-mark"><LogoIcon /></span>
              <span>Tesifye</span>
            </Link>
            <p className="footer-tag">
              AI testing partner — from PRD parsing to bug-ready tickets.
              Built on GROQ for sub-second turnaround.
            </p>
          </div>

          <div className="footer-col">
            <h4>Product</h4>
            <ul>
              <li><Link href="/#features">Features</Link></li>
              <li><Link href="/pricing">Pricing</Link></li>
              <li><Link href="/register">Get started</Link></li>
              <li><Link href="#">Changelog</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Solutions</h4>
            <ul>
              <li><Link href="#">For Manual QA</Link></li>
              <li><Link href="#">For Automation</Link></li>
              <li><Link href="#">For PMs</Link></li>
              <li><Link href="#">For Agencies</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li><Link href="/about">About</Link></li>
              <li><Link href="#">Blog</Link></li>
              <li><Link href="#">Careers</Link></li>
              <li><Link href="#">Press kit</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Resources</h4>
            <ul>
              <li><Link href="#">Docs</Link></li>
              <li><Link href="#">API</Link></li>
              <li><Link href="#">Templates</Link></li>
              <li><Link href="#">Status</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2025 Tesifye Labs. Crafted with care.</span>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link href="#" style={{ color: 'inherit' }}>Privacy</Link>
            <Link href="#" style={{ color: 'inherit' }}>Terms</Link>
            <Link href="#" style={{ color: 'inherit' }}>Security</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
