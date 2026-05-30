'use client';

import { useState, useEffect } from 'react';

const MIN_WIDTH = 1024; // px

export default function NarrowScreenGuard({ children }: { children: React.ReactNode }) {
  const [isTooNarrow, setIsTooNarrow] = useState(false);
  const [dismissed, setDismissed]     = useState(false);
  const [mounted, setMounted]         = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsTooNarrow(window.innerWidth < MIN_WIDTH);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // SSR — render children dulu
  if (!mounted) return <>{children}</>;

  if (isTooNarrow && !dismissed) {
    return (
      <>
        {/* Render children di background (tetap ada di DOM) */}
        <div style={{ visibility: 'hidden', position: 'fixed', inset: 0 }} aria-hidden>
          {children}
        </div>

        {/* Warning overlay */}
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          backgroundColor: '#0F172A',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '24px',
          gap: '20px',
        }}>
          {/* Icon */}
          <div style={{ fontSize: 48 }}>⚠️</div>

          {/* Message */}
          <div style={{ textAlign: 'center', maxWidth: 380 }}>
            <h2 style={{
              fontSize: 20, fontWeight: 600, color: '#F1F5F9',
              marginBottom: 12, letterSpacing: '-0.02em',
            }}>
              Layar Terlalu Sempit
            </h2>
            <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7, margin: 0 }}>
              Halaman praktikum virtual membutuhkan layar minimal{' '}
              <strong style={{ color: '#94A3B8' }}>{MIN_WIDTH}px</strong> lebar.
              Gunakan <strong style={{ color: '#94A3B8' }}>laptop</strong>,{' '}
              <strong style={{ color: '#94A3B8' }}>tablet landscape</strong>, atau{' '}
              <strong style={{ color: '#94A3B8' }}>komputer</strong> untuk pengalaman terbaik.
            </p>
          </div>

          {/* Current width info */}
          <div style={{
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            borderRadius: 8, padding: '8px 16px',
            fontSize: 12, color: '#475569', fontFamily: 'monospace',
          }}>
            Lebar saat ini:{' '}
            <span style={{ color: '#F59E0B' }}>
              {typeof window !== 'undefined' ? window.innerWidth : 0}px
            </span>
            {' '}/ Minimum: <span style={{ color: '#10B981' }}>{MIN_WIDTH}px</span>
          </div>

          {/* Dismiss (lanjut meskipun sempit) */}
          <button
            onClick={() => setDismissed(true)}
            style={{
              marginTop: 8, padding: '8px 20px',
              backgroundColor: 'transparent',
              border: '1px solid #334155',
              borderRadius: 6, cursor: 'pointer',
              fontSize: 12, color: '#475569',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#94A3B8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
          >
            Lanjutkan saja →
          </button>
        </div>
      </>
    );
  }

  return <>{children}</>;
}