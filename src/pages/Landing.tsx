import { useState, useEffect, useRef } from 'react';
import { Clock, Menu, X, ArrowUpRight } from 'lucide-react';

interface Practicum {
  id: string;
  title: string;
  titleId: string;
  moduleCode: string;
  description: string;
  descriptionId: string;
  category: 'analog' | 'digital' | 'telecom';
  status: 'coming-soon';
  tags: string[];
}

const practicums: Practicum[] = [
  {
    id: 'am-modulation',
    title: 'AM Modulation',
    titleId: 'Modulasi AM',
    moduleCode: 'TE03002',
    description: 'Investigate amplitude modulation index, waveforms, and envelope detection.',
    descriptionId: 'Menyelidiki indeks modulasi amplitudo, bentuk gelombang, dan deteksi selubung.',
    category: 'analog',
    status: 'coming-soon',
    tags: ['Catu Daya', 'Sumber Sinyal', 'Penguat', 'Rangkaian Penala'],
  },
  {
    id: 'demodulation',
    title: 'AM Demodulation',
    titleId: 'Demodulasi AM',
    moduleCode: 'TE03003',
    description: 'Recover intelligence from amplitude modulated carrier using envelope detector circuit.',
    descriptionId: 'Mengembalikan sinyal informasi dari pembawa termodulasi amplitudo menggunakan detektor selubung.',
    category: 'analog',
    status: 'coming-soon',
    tags: ['Catu Daya', 'Sumber Sinyal', 'Penguat', 'Detektor'],
  },
  {
    id: 'fm-modulation',
    title: 'FM Modulation',
    titleId: 'Modulasi FM',
    moduleCode: 'TE03004',
    description: 'Analyze frequency modulation principles, frequency deviation, and modulation index.',
    descriptionId: 'Menganalisis prinsip modulasi frekuensi, deviasi frekuensi, dan indeks modulasi.',
    category: 'analog',
    status: 'coming-soon',
    tags: ['Catu Daya', 'Sumber Sinyal', 'Modulator FM'],
  },
  {
    id: 'digital-signals',
    title: 'Digital Signals',
    titleId: 'Sinyal Digital',
    moduleCode: 'TE03001',
    description: 'Demonstrate digital signal transmission including NRZ, telephone, and analog signals.',
    descriptionId: 'Memperagakan pengiriman sinyal digital termasuk NRZ, telepon, dan sinyal analog.',
    category: 'digital',
    status: 'coming-soon',
    tags: [],
  },
  {
    id: 'sample-and-hold',
    title: 'Sample and Hold',
    titleId: 'Sampling dan Penahanan',
    moduleCode: 'TE03005',
    description: 'Demonstrate sampling process and explain the effect of sampling frequency and pulse width.',
    descriptionId: 'Mendemonstrasikan proses sampling dan menjelaskan pengaruh frekuensi sampling serta lebar pulsa.',
    category: 'digital',
    status: 'coming-soon',
    tags: [],
  },
  {
    id: 'aliasing-multiplex',
    title: 'Aliasing & Multiplex Signaling',
    titleId: 'Aliasing dan Multiplex Signaling',
    moduleCode: 'TE03006',
    description: 'Identify aliasing problems and demonstrate time-division multiplex signal transmission.',
    descriptionId: 'Mengidentifikasi masalah aliasing dan mendemonstrasikan pengiriman dua sinyal dengan metode pencuplikan.',
    category: 'digital',
    status: 'coming-soon',
    tags: [],
  },
];

export default function Landing() {
  const [time, setTime] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update clock time every second
  useEffect(() => {
    const updateTime = () => {
      setTime(
        new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Track cursor position to update CSS properties for WebGL-style glow effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      container.style.setProperty('--mouse-x', `${x}px`);
      container.style.setProperty('--mouse-y', `${y}px`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      <div ref={containerRef} className="landing-page">
        {/* --- Background Shaders --- */}
        <div className="shader-container">
          <div className="shader-swirl" />
          <div className="shader-chromaflow" />
          <div className="shader-flutedglass" />
          <div className="shader-filmgrain" />
        </div>

        {/* --- Navigation Pill Bar --- */}
        <div className={`navbar-wrapper ${mobileMenuOpen ? 'z-[60]' : 'z-20'}`}>
          <nav className="navbar">
            {/* Logo */}
            <a href="/" className="logo-link" aria-label="Virtual Lab Logo">
              <svg viewBox="0 0 40 40" className="logo-svg">
                <path d="M20 0C25.3043 4.00466e-07 30.3919 2.10669 34.1426 5.85742C34.8157 6.53058 35.4354 7.24719 36 8H20C16.8174 8 13.7651 9.26421 11.5146 11.5146C9.26421 13.7651 8 16.8174 8 20H20L36.9102 9.31934C38.1656 11.3074 39.0611 13.5027 39.5547 15.8027L32 20H40L39.9941 20.4971C39.8669 25.6213 37.776 30.5092 34.1426 34.1426C30.3919 37.8933 25.3043 40 20 40C14.6957 40 9.60815 37.8933 5.85742 34.1426C5.18426 33.4694 4.56459 32.7528 4 32H20C23.1826 32 26.2349 30.7358 28.4854 28.4854C30.5952 26.3755 31.8383 23.5608 31.9854 20.5947L32 20H20L3.08984 30.6787C1.83452 28.6906 0.941002 26.4951 0.447266 24.1953L8 20H0C8.00931e-07 14.6957 2.1067 9.60815 5.85742 5.85742C9.60815 2.1067 14.6957 -5.79361e-10 20 0Z" />
              </svg>
            </a>

            {/* Links */}
            <div className="nav-links">
              <a href="#semua-modul" className="nav-link">Semua Modul</a>
              <a href="#sinyal-analog" className="nav-link">Sinyal Analog</a>
              <a href="#sinyal-digital" className="nav-link">Sinyal Digital</a>
            </div>

            {/* Right-side availability / Clock / CTA */}
            <div className="nav-right">
              <span className="nav-availability">E-Learning SisKom</span>
              <span className="nav-clock">
                <Clock size={14} />
                <span>{time || '12:00'} WIB</span>
              </span>
              <button className="btn-hover-group cta-button">
                <span className="text-scroll-container">
                  <span className="text-scroll-inner">
                    <span className="scroll-text-line">Hubungi Asisten</span>
                    <span className="scroll-text-line">Hubungi Asisten</span>
                  </span>
                </span>
                <span className="arrow-circle">
                  <ArrowUpRight size={12} />
                </span>
              </button>
            </div>

            {/* Mobile Menu Toggle button */}
            <button 
              className="mobile-menu-btn" 
              onClick={() => setMobileMenuOpen(prev => !prev)}
            >
              <span>{mobileMenuOpen ? 'Close' : 'Menu'}</span>
              {mobileMenuOpen ? <X size={14} /> : <Menu size={14} />}
            </button>
          </nav>
        </div>

        {/* --- Grid Layout Container --- */}
        <div className="page-grid">
          {/* Row 1 */}
          <div className="grid-cell cell-border-b"></div>
          <div className="grid-cell cell-border-b cell-border-x cell-header">
            <header className="landing-header">
              <div className="landing-badge">Virtual Engineering Laboratory</div>
              <h1 className="landing-title">Laboratorium Teknik Virtual</h1>
              <p className="landing-subtitle">
                Simulasi interaktif peralatan laboratorium PUDAK Scientific PTE-series untuk praktikum teknik telekomunikasi.
              </p>
            </header>
          </div>
          <div className="grid-cell cell-border-b"></div>

          {/* Row 2 */}
          <div className="grid-cell cell-border-b"></div>
          <div className="grid-cell cell-border-b cell-border-x cell-grid">
            <div className="practicum-grid">
              {practicums.map((p) => (
                <div
                  key={p.id}
                  className="practicum-card coming-soon"
                  role="button"
                  tabIndex={-1}
                  aria-label={`${p.titleId} (${p.moduleCode})`}
                >
                  <div className="practicum-card-header">
                    <span className={`practicum-card-category ${p.category}`}>
                      {p.category}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="practicum-card-status coming-soon">
                        ○ Coming Soon
                      </span>
                      <span className="practicum-card-code">{p.moduleCode}</span>
                    </div>
                  </div>
                  <h2 className="practicum-card-title">{p.titleId}</h2>
                  <p className="practicum-card-desc">{p.descriptionId}</p>
                  <div className="practicum-card-meta">
                    {p.tags.slice(0, 3).map((tag, tIdx) => (
                      <span key={tIdx} className="practicum-card-tag">{tag}</span>
                    ))}
                    {p.tags.length > 3 && (
                      <span className="practicum-card-tag">+{p.tags.length - 3}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid-cell cell-border-b"></div>

          {/* Row 3 */}
          <div className="grid-cell"></div>
          <div className="grid-cell cell-border-x cell-footer">
            <footer className="landing-footer">
              <p>Based on PUDAK Scientific Laboratory Modules · Built for online practical sessions</p>
            </footer>
          </div>
          <div className="grid-cell"></div>
        </div>
      </div>

      {/* --- Mobile Menu Overlay Sheet --- */}
      <div className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-backdrop" onClick={() => setMobileMenuOpen(false)} />
        <div className="mobile-menu-sheet">
          <div className="mobile-menu-header">
            <span className="nav-clock">
              <Clock size={14} />
              <span>{time || '12:00'} WIB</span>
            </span>
          </div>

          <div className="mobile-menu-links">
            <a href="#semua-modul" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>Semua Modul</a>
            <a href="#sinyal-analog" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>Sinyal Analog</a>
            <a href="#sinyal-digital" className="mobile-menu-link" onClick={() => setMobileMenuOpen(false)}>Sinyal Digital</a>
          </div>

          <div className="mobile-menu-footer">
            <button className="btn-hover-group mobile-cta-btn">
              <span className="text-scroll-container">
                <span className="text-scroll-inner">
                  <span className="scroll-text-line">Hubungi Asisten</span>
                  <span className="scroll-text-line">Hubungi Asisten</span>
                </span>
              </span>
              <span className="arrow-circle">
                <ArrowUpRight size={14} />
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
