'use client';
// ============================================================
// MODULE — ModuleLayout
// Layout 3-zone untuk halaman modul:
// [Panduan] | [Workbench Canvas] | (Signal Monitor overlay)
// ============================================================

import Link from 'next/link';
import { useEffect } from 'react';
import { useModuleStore } from '../../store/moduleStore';
import { useWorkbenchStore } from '../../store/workbenchStore';
import { ModuleConfig } from '../../types/modules';
import { MODULE_META } from '../../types/modules';
import GuidePanel from './GuidePanel';
import StepIndicator from './StepIndicator';
import SignalMonitor from './SignalMonitor';
import WorkbenchCanvas from '../workbench/WorkbenchCanvas';
import { PudakAnalog } from '../instruments/PudakModule';
import { PudakSampleHoldMux } from '../instruments/PudakModule';
import { PudakDigital } from '../instruments/PudakModule';

interface ModuleLayoutProps {
  config: ModuleConfig;
}

// Tentukan PUDAK component berdasarkan modul
function PudakForModule({ moduleId }: { moduleId: string }) {
  if (moduleId === 'am')         return <PudakAnalog moduleType="am" />;
  if (moduleId === 'fm')         return <PudakAnalog moduleType="fm" />;
  if (moduleId === 'demodulasi') return <PudakAnalog moduleType="demodulasi" />;
  if (moduleId === 'digital')    return <PudakDigital />;
  if (moduleId === 'sample_hold' || moduleId === 'aliasing') return <PudakSampleHoldMux />;
  return null;
}

export default function ModuleLayout({ config }: ModuleLayoutProps) {
  const { setModule, resetModule } = useModuleStore();
  const { resetWorkbench }         = useWorkbenchStore();
  const meta = MODULE_META[config.id];

  // Initialize modul saat mount
  useEffect(() => {
    setModule(config.id);
    return () => resetModule();
  }, [config.id, setModule, resetModule]);

  // Konfigurasi instrumen berdasarkan modul
  const workbenchConfig = {
    showAFG1: config.instruments.some(i => i.instrumentId === 'afg1'),
    showAFG2: config.instruments.some(i => i.instrumentId === 'afg2'),
    showOsc:  config.instruments.some(i => i.instrumentId === 'osc'),
    showGFC:  config.instruments.some(i => i.instrumentId === 'gfc'),
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100vw',
      height: '100vh',
      backgroundColor: '#0F172A',
      overflow: 'hidden',
    }}>

      {/* Navbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 16px',
        height: 44,
        backgroundColor: '#0B1222',
        borderBottom: '1px solid #1E293B',
        flexShrink: 0,
      }}>
        {/* Back to home */}
        <Link
          href="/"
          style={{
            fontSize: 11, color: '#475569',
            textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 8px',
            border: '1px solid #1E293B',
            borderRadius: 4,
            transition: 'color 0.1s',
          }}
        >
          ← Beranda
        </Link>

        {/* Module badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '3px 10px',
          backgroundColor: meta.color + '18',
          border: `1px solid ${meta.color}40`,
          borderRadius: 6,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: meta.color }} />
          <span style={{ fontSize: 12, color: meta.color, fontWeight: 600 }}>
            {config.title}
          </span>
          <span style={{ fontSize: 10, color: '#475569' }}>— {meta.subtitle}</span>
        </div>

        {/* Step indicator */}
        <div style={{ flex: 1 }}>
          <StepIndicator config={config} />
        </div>

        {/* Reset button */}
        <button
          onClick={() => { resetModule(); resetWorkbench(); }}
          style={{
            fontSize: 10, color: '#475569',
            backgroundColor: '#1E293B', border: '1px solid #334155',
            borderRadius: 4, padding: '4px 8px', cursor: 'pointer',
          }}
        >
          ↺ Reset
        </button>
      </div>

      {/* Body: GuidePanel + Workbench */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Guide panel kiri */}
        <GuidePanel config={config} />

        {/* Workbench utama */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <WorkbenchCanvas
            config={workbenchConfig}
            pudakSlot={<PudakForModule moduleId={config.id} />}
          />

          {/* Signal monitor overlay */}
          <SignalMonitor />
        </div>
      </div>
    </div>
  );
}