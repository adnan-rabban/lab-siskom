import { Clock, ArrowUpRight } from 'lucide-react';

interface MobileMenuProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  time: string;
}

export default function MobileMenu({ mobileMenuOpen, setMobileMenuOpen, time }: MobileMenuProps) {
  return (
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
  );
}
