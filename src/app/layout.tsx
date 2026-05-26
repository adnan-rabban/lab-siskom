import type { Metadata, Viewport } from 'next';
import '../index.css';


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
          <div className="mobile-guard-glow" />
          <div className="mobile-guard-grid-bg" />
          
          <div className="mobile-guard-card">
            <div className="mobile-guard-header-line" />
            <div className="mobile-guard-status">
              <span className="status-dot"></span>
              <span className="status-text font-mono">SYSTEM BLOCK // RESOLUTION LIMIT</span>
            </div>
            
            <div className="mobile-guard-icon-container">
              <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mobile-guard-svg">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
                <path d="M6 10h3V7M18 10h-3v3" />
              </svg>
            </div>
            
            <h2>Layar Lebih Besar Diperlukan</h2>
            
            <p className="description-primary">
              Virtual Laboratory Simulator memerlukan resolusi layar desktop atau tablet (landscape) untuk memuat panel kontrol instrumen teknik secara presisi.
            </p>
            
            <div className="mobile-guard-specs font-mono">
              <div className="spec-row">
                <span className="spec-label">MIN_WIDTH:</span>
                <span className="spec-val text-accent">768PX</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">CURRENT_STATE:</span>
                <span className="spec-val">UNSUPPORTED_VIEWPORT</span>
              </div>
            </div>
            
            <div className="mobile-guard-footer font-mono">
              PUDAK SCIENTIFIC SIMULATOR v1.0.0
            </div>
          </div>
        </div>

        <div id="root">{children}</div>
      </body>
    </html>
  );
}
