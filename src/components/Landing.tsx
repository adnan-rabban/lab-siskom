"use client";

import { useState, useEffect, useRef } from 'react';

// Import subcomponents
import BackgroundShaders from './landing/BackgroundShaders';
import Navbar from './landing/Navbar';
import Header from './landing/Header';
import PracticumGrid from './landing/PracticumGrid';
import Footer from './landing/Footer';
import MobileMenu from './landing/MobileMenu';

// Import data
import { practicums } from './landing/data';

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
        <BackgroundShaders />

        {/* --- 4-Row Blueprint Grid Layout --- */}
        <div className="page-grid">
          {/* Row 1: Navbar */}
          <div className="grid-cell cell-border-b"></div>
          <div className="grid-cell cell-border-b cell-border-x cell-navbar">
            <Navbar 
              time={time} 
              mobileMenuOpen={mobileMenuOpen} 
              setMobileMenuOpen={setMobileMenuOpen} 
            />
          </div>
          <div className="grid-cell cell-border-b"></div>

          {/* Row 2: Header */}
          <div className="grid-cell cell-border-b"></div>
          <div className="grid-cell cell-border-b cell-border-x cell-header">
            <Header />
          </div>
          <div className="grid-cell cell-border-b"></div>

          {/* Row 3: Cards */}
          <div className="grid-cell cell-border-b"></div>
          <div className="grid-cell cell-border-b cell-border-x cell-grid">
            <PracticumGrid practicums={practicums} />
          </div>
          <div className="grid-cell cell-border-b"></div>

          {/* Row 4: Footer */}
          <div className="grid-cell"></div>
          <div className="grid-cell cell-border-x cell-footer">
            <Footer />
          </div>
          <div className="grid-cell"></div>
        </div>
      </div>

      {/* --- Mobile Menu Overlay Sheet --- */}
      <MobileMenu 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen} 
        time={time} 
      />
    </>
  );
}
