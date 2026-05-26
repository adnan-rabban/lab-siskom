import type { Metadata, Viewport } from 'next';
import '../index.css';
import '../components/pages.css';

export const metadata: Metadata = {
  title: 'Laboratorium Teknik Virtual — PUDAK Scientific Simulator',
  description: 'Virtual Engineering Laboratory Simulator — Interactive PUDAK Scientific PTE-series module simulations for online telecommunications and signal processing practicals.',
  authors: [{ name: 'Virtual Lab Engineering' }],
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0C0C0C',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        {/* DNS prefetch + preconnect for Google Fonts */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Critical font: Inter */}
        <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" />

        {/* Material Symbols */}
        <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />
      </head>
      <body className="loaded">
        {/* Mobile Guard Screen */}
        <div className="mobile-guard" id="mobile-guard" role="alert">
          <div className="mobile-guard-icon">🖥️</div>
          <h2>Desktop atau Tablet Diperlukan</h2>
          <p>
            Virtual Laboratory Simulator membutuhkan layar yang lebih besar untuk pengalaman terbaik.
            Silakan buka pada desktop atau tablet (landscape).
          </p>
          <p style={{ marginTop: '8px', fontSize: '0.75rem' }}>
            Desktop or tablet required for the best experience.
            Please open on a larger screen.
          </p>
          <div className="mobile-guard-badge">Min. 768px viewport width</div>
        </div>

        <div id="root">{children}</div>
      </body>
    </html>
  );
}
