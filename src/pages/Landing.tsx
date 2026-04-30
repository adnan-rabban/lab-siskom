import { useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PracticumConfig } from '../engine/types';
import { amModulationConfig } from '../practicums/amModulation';
import { demodulationConfig } from '../practicums/demodulation';
import { fmModulationConfig } from '../practicums/fmModulation';

// ============================================================
// All practicums (Phase 2: AM + Demodulation available)
// ============================================================
const practicums: PracticumConfig[] = [
  amModulationConfig,
  demodulationConfig,
  fmModulationConfig,
  {
    id: 'digital-signals',
    title: 'Digital Signals',
    titleId: 'Sinyal Digital',
    moduleCode: 'TE03001',
    description: 'Demonstrate digital signal transmission including NRZ, telephone, and analog signals.',
    descriptionId: 'Memperagakan pengiriman sinyal digital termasuk NRZ, telepon, dan sinyal analog.',
    category: 'digital',
    status: 'coming-soon',
    requiredModules: [],
    requiredInstruments: [],
    requiredConnections: [],
    procedure: [],
    observationTargets: [],
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
    requiredModules: [],
    requiredInstruments: [],
    requiredConnections: [],
    procedure: [],
    observationTargets: [],
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
    requiredModules: [],
    requiredInstruments: [],
    requiredConnections: [],
    procedure: [],
    observationTargets: [],
  },
];

// ============================================================
// Animated Background Canvas
// ============================================================
function useWaveformBackground(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.clearRect(0, 0, w, h);

      // Subtle animated waveforms
      const waves = [
        { color: 'rgba(255, 92, 0, 0.04)', freq: 0.003, amp: 60, speed: 0.015, yOffset: h * 0.3 },
        { color: 'rgba(255, 92, 0, 0.025)', freq: 0.005, amp: 40, speed: 0.02, yOffset: h * 0.5 },
        { color: 'rgba(240, 239, 232, 0.02)', freq: 0.004, amp: 50, speed: 0.01, yOffset: h * 0.7 },
        { color: 'rgba(255, 138, 0, 0.02)', freq: 0.006, amp: 30, speed: 0.025, yOffset: h * 0.85 },
      ];

      for (const wave of waves) {
        ctx.beginPath();
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = 1.5;

        for (let x = 0; x < w; x += 2) {
          const y = wave.yOffset + Math.sin(x * wave.freq + time * wave.speed) * wave.amp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Grid dots
      const gridSize = 60;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
      for (let x = 0; x < w; x += gridSize) {
        for (let y = 0; y < h; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      time++;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [canvasRef]);
}

// ============================================================
// Landing Page Component
// ============================================================
export default function Landing() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  useWaveformBackground(canvasRef);

  const handleCardClick = useCallback(
    (practicum: PracticumConfig) => {
      if (practicum.status === 'available') {
        navigate(`/lab/${practicum.id}`);
      }
    },
    [navigate]
  );

  return (
    <div className="landing-page">
      <canvas ref={canvasRef} className="landing-bg-canvas" />

      <div className="landing-content">
        {/* Hero Section */}
        <header className="landing-header">
          <div className="landing-badge">
            <span style={{ fontSize: '14px' }}>⚡</span>
            Virtual Engineering Laboratory
          </div>
          <h1 className="landing-title">
            Laboratorium Teknik
            <br />
            <span style={{ color: '#FF5C00' }}>Virtual</span>
          </h1>
          <p className="landing-subtitle">
            Simulasi interaktif peralatan laboratorium PUDAK Scientific PTE-series
            untuk praktikum teknik telekomunikasi dan pemrosesan sinyal.
          </p>
          <p className="landing-pudak-credit">
            Based on <strong>PUDAK Scientific</strong> laboratory modules
          </p>
        </header>

        {/* Practicum Cards */}
        <section>
          <div className="practicum-grid">
            {practicums.map((p) => (
              <div
                key={p.id}
                className={`practicum-card ${p.status === 'coming-soon' ? 'coming-soon' : ''}`}
                onClick={() => handleCardClick(p)}
                role="button"
                tabIndex={p.status === 'available' ? 0 : -1}
                aria-label={`${p.titleId} (${p.moduleCode})`}
              >
                <div className="practicum-card-header">
                  <span className={`practicum-card-category ${p.category}`}>
                    {p.category}
                  </span>
                  <span className="practicum-card-code">{p.moduleCode}</span>
                </div>
                <h2 className="practicum-card-title">{p.titleId}</h2>
                <p className="practicum-card-desc">{p.descriptionId}</p>
                <div className="practicum-card-meta">
                  {p.requiredModules.slice(0, 3).map(m => (
                    <span key={m.nodeId} className="practicum-card-tag">{m.label}</span>
                  ))}
                  {p.requiredModules.length > 3 && (
                    <span className="practicum-card-tag">+{p.requiredModules.length - 3}</span>
                  )}
                </div>
                <span className={`practicum-card-status ${p.status}`}>
                  {p.status === 'available' ? '● Ready' : '○ Coming Soon'}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <p>Virtual Laboratory Simulator — PUDAK Scientific PTE Series</p>
          <p style={{ marginTop: '4px' }}>
            Built for online practical engineering sessions
          </p>
        </footer>
      </div>
    </div>
  );
}
