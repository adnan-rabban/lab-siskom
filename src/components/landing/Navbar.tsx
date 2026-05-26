import { Clock, Menu, X, ArrowUpRight } from 'lucide-react';
import ThemeToggler from './ThemeToggler';

interface NavbarProps {
  time: string;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export default function Navbar({ time, mobileMenuOpen, setMobileMenuOpen }: NavbarProps) {
  return (
    <div className={`navbar-wrapper ${mobileMenuOpen ? 'z-[60]' : 'z-20'}`}>
      <nav className="navbar">
        {/* Logo */}
        <a href="/" className="logo-link" aria-label="Virtual Lab Logo">
          <svg viewBox="0 0 40 40" className="logo-svg">
            <path d="M20 0C25.3043 4.00466e-07 30.3919 2.10669 34.1426 5.85742C34.8157 6.53058 35.4354 7.24719 36 8H20C16.8174 8 13.7651 9.26421 11.5146 11.5146C9.26421 13.7651 8 16.8174 8 20H20L36.9102 9.31934C38.1656 11.3074 39.0611 13.5027 39.5547 15.8027L32 20H40L39.9941 20.4971C39.8669 25.6213 37.776 30.5092 34.1426 34.1426C30.3919 37.8933 25.3043 40 20 40C14.6957 40 9.60815 37.8933 5.85742 34.1426C5.18426 33.4694 4.56459 32.7528 4 32H20C23.1826 32 26.2349 30.7358 28.4854 28.4854C30.5952 26.3755 31.8383 23.5608 31.9854 20.5947L32 20H20L3.08984 30.6787C1.83452 28.6906 0.941002 26.4951 0.447266 24.1953L8 20H0C8.00931e-07 14.6957 2.1067 9.60815 5.85742 5.85742C9.60815 2.1067 14.6957 -5.79361e-10 20 0Z" />
          </svg>
        </a>

        {/* Right-side availability / Clock / CTA */}
        <div className="nav-right">
          <span className="nav-availability">E-Learning SisKom</span>
          <ThemeToggler />
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
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span>{mobileMenuOpen ? 'Close' : 'Menu'}</span>
          {mobileMenuOpen ? <X size={14} /> : <Menu size={14} />}
        </button>
      </nav>
    </div>
  );
}
