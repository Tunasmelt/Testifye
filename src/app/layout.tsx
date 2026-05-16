import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Tesifye — AI-Native QA for Modern Products', template: '%s | Tesifye' },
  description: 'Generate test cases, audit UX, and analyze requirements from screenshots, descriptions, and documents — powered by AI.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://tesifye.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Tesifye',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inject theme before first paint to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('tf-theme');
                if (t && t !== 'default') document.documentElement.setAttribute('data-theme', t);
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
