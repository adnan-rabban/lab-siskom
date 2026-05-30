'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useModuleStore } from '../../store/moduleStore';
import { useWorkbenchStore } from '../../store/workbenchStore';
import { ModuleConfig, MODULE_META } from '../../types/modules';
import GuidePanel from './GuidePanel';
import StepIndicator from './StepIndicator';
import SignalMonitor from './SignalMonitor';
import WorkbenchCanvas from '../workbench/WorkbenchCanvas';
import { PudakAnalog, PudakSampleHoldMux, PudakDigital } from '../instruments/PudakModule';
import NarrowScreenGuard from '../NarrowScreenGuard';
import KeyboardShortcuts from '../KeyboardShortcuts';

interface ModuleLayoutProps {
  config: ModuleConfig;
}

function PudakForModule({ moduleId }: { moduleId: string }) {
  if (moduleId === 'am')          return <PudakAnalog moduleType="am" />;
  if (moduleId === 'fm')          return <PudakAnalog moduleType="fm" />;
  if (moduleId === 'demodulasi')  return <PudakAnalog moduleType="demodulasi" />;
  if (moduleId === 'digital')     return <PudakDigital />;
  if (moduleId === 'sample_hold' || moduleId === 'aliasing') return <PudakSampleHoldMux />;
  return null;
}

export default function ModuleLayout({ config }: ModuleLayoutProps) {
  const { setModule, resetModule, toggleGuidePanel } = useModuleStore();
  const { resetWorkbench } = useWorkbenchStore();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const meta = MODULE_META[config.id];

  useEffect(() => {
    setModule(config.id);
    return () => resetModule();
  }, [config.id, setModule, resetModule]);

  const workbenchConfig = {
    showAFG1: config.instruments.some(i => i.instrumentId === 'afg1'),
    showAFG2: config.instruments.some(i => i.instrumentId === 'afg2'),
    showOsc:  config.instruments.some(i => i.instrumentId === 'osc'),
    showGFC:  config.instruments.some(i => i.instrumentId === 'gfc'),
  };

  return (
    <NarrowScreenGuard>
      {/* Keyboard handler — mounts once, pure behavior */}
      <KeyboardShortcuts onToggleGuide={toggleGuidePanel} />

      <div style={{
        display: 'flex', flexDirection: 'column',
        width: '100vw', height: '100vh',
        backgroundColor: '#0F172A', overflow: 'hidden',
      }}>

        {/* Navbar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 14px', height: 44,
          backgroundColor: '#0B1222',
          borderBottom: '1px solid #1E293B',
          flexShrink: 0,
        }}>
          <Link href="/" style={{
            fontSize: 11, color: '#475569', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 8px', border: '1px solid #1E293B',
            borderRadius: 4, whiteSpace: 'nowrap',
            transition: 'color 0.15s, border-color 0.15s',
          }}>
            ← Beranda
          </Link>

          {/* Module badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '3px 10px', flexShrink: 0,
            backgroundColor: meta.color + '18',
            border: `1px solid ${meta.color}40`,
            borderRadius: 6,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              backgroundColor: meta.color,
            }} />
            <span style={{ fontSize: 12, color: meta.color, fontWeight: 600 }}>
              {config.title}
            </span>
            <span style={{ fontSize: 10, color: '#475569' }}>
              — {config.subtitle}
            </span>
          </div>

          {/* Step progress */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <StepIndicator config={config} />
          </div>

          {/* Keyboard shortcut help toggle */}
          <button
            onClick={() => setShowShortcuts(v => !v)}
            title="Keyboard shortcuts (?)"
            style={{
              fontSize: 10, color: '#475569',
              backgroundColor: showShortcuts ? '#1E3A5F' : '#1E293B',
              border: `1px solid ${showShortcuts ? '#3B82F6' : '#334155'}`,
              borderRadius: 4, padding: '4px 8px', cursor: 'pointer',
            }}
          >
            ⌨ Shortcuts
          </button>

          {/* Reset */}
          <button
            onClick={() => { resetModule(); resetWorkbench(); }}
            style={{
              fontSize: 10, color: '#475569',
              backgroundColor: '#1E293B', border: '1px solid #334155',
              borderRadius: 4, padding: '4px 8px', cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            ↺ Reset
          </button>
        </div>

        {/* Keyboard shortcuts overlay */}
        {showShortcuts && (
          <div style={{
            position: 'absolute', top: 52, right: 14,
            zIndex: 200, backgroundColor: 'rgba(11,18,34,0.97)',
            border: '1px solid #1E293B', borderRadius: 8,
            padding: '12px 14px', minWidth: 280,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            <div style={{
              fontSize: 10, color: '#3B82F6', fontWeight: 600,
              letterSpacing: '0.06em', marginBottom: 10,
            }}>
              KEYBOARD SHORTCUTS
            </div>
            {[
              ['Space',    'Run / Stop osiloskop'],
              ['A',        'Autoset osiloskop'],
              ['M',        'Toggle panel Measure'],
              ['C',        'Toggle Cursor'],
              ['G',        'Toggle panduan'],
              ['Ctrl +/−', 'Zoom in / out'],
              ['Ctrl 0',   'Reset zoom & pan'],
              ['Esc',      'Batalkan drag kabel'],
              ['Shift R',  'Reset workbench'],
              ['Shift D',  'Cabut semua kabel'],
            ].map(([key, desc]) => (
              <div key={key} style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', gap: 12,
                padding: '3px 0', borderBottom: '1px solid #0F172A',
              }}>
                <kbd style={{
                  fontSize: 9, fontFamily: 'monospace',
                  backgroundColor: '#1E293B', color: '#94A3B8',
                  border: '1px solid #334155', borderRadius: 3,
                  padding: '1px 6px', whiteSpace: 'nowrap',
                }}>
                  {key}
                </kbd>
                <span style={{ fontSize: 11, color: '#64748B' }}>{desc}</span>
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          <GuidePanel config={config} />

          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <WorkbenchCanvas
              config={workbenchConfig}
              pudakSlot={<PudakForModule moduleId={config.id} />}
            />
            <SignalMonitor />
          </div>
        </div>
      </div>
    </NarrowScreenGuard>
  );
}