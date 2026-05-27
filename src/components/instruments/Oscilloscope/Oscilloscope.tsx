'use client';

import { useMemo } from 'react';
import OscScreen from './OscScreen';
import OscControls, { OscActionBar } from './OscControls';
import BNCPort from '../../ui/BNCPort';
import { useWorkbenchStore } from '../../../store/workbenchStore';
import { useSignalStore } from '../../../store/signalStore';
import { OscState } from '../../../types/instruments';
import { measureAll, formatFrequency, formatVoltage } from '../../../lib/signal/utils';

// ID port osiloskop
const PORT_CH1     = 'osc_ch1';
const PORT_CH2     = 'osc_ch2';
const PORT_EXT     = 'osc_ext_trig';

// Status bar atas layar
function OscStatusBar({ state }: { state: OscState }) {
  const { ch1, ch2, timePerDiv, triggerSource, triggerMode, isRunning, acquisitionMode } = state;

  const fmtVpd = (v: number) => v < 1 ? `${(v * 1000).toFixed(0)}m` : `${v}`;
  const fmtT   = (s: number) => {
    if (s < 1e-6) return `${(s * 1e9).toFixed(0)}n`;
    if (s < 1e-3) return `${(s * 1e6).toFixed(0)}μ`;
    if (s < 1)    return `${(s * 1e3).toFixed(0)}m`;
    return `${s}`;
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      padding: '3px 8px',
      backgroundColor: '#080D10',
      borderBottom: '1px solid #1F2937',
      fontSize: 10,
      fontFamily: 'monospace',
    }}>
      {/* CH1 */}
      {ch1.isEnabled && (
        <span style={{ color: '#FACC15' }}>
          CH1 {fmtVpd(ch1.voltsPerDiv)}V/div
        </span>
      )}
      {/* CH2 */}
      {ch2.isEnabled && (
        <span style={{ color: '#60A5FA' }}>
          CH2 {fmtVpd(ch2.voltsPerDiv)}V/div
        </span>
      )}
      {/* TIME */}
      <span style={{ color: '#A78BFA' }}>
        {fmtT(timePerDiv)}s/div
      </span>
      {/* TRIGGER */}
      <span style={{ color: '#9CA3AF' }}>
        {triggerSource} {triggerMode}
      </span>
      {/* ACQ */}
      <span style={{ color: '#6B7280' }}>{acquisitionMode}</span>
      {/* RUN/STOP */}
      <span style={{ color: isRunning ? '#4ADE80' : '#EF4444', marginLeft: 'auto' }}>
        {isRunning ? '▶ RUN' : '■ STOP'}
      </span>
    </div>
  );
}

// Measure overlay (19 auto-measurements)
function MeasurePanel({
  ch1Buf, ch2Buf, sampleRate,
}: {
  ch1Buf: Float32Array | null;
  ch2Buf: Float32Array | null;
  sampleRate: number;
}) {
  const m1 = useMemo(() =>
    ch1Buf ? measureAll(ch1Buf, sampleRate) : null,
    [ch1Buf, sampleRate]
  );
  const m2 = useMemo(() =>
    ch2Buf ? measureAll(ch2Buf, sampleRate) : null,
    [ch2Buf, sampleRate]
  );

  const row = (label: string, v1: number | null, v2: number | null, fmt: (n: number) => string) => (
    <div key={label} style={{ display: 'flex', gap: 8, fontSize: 9, padding: '1px 0' }}>
      <span style={{ color: '#6B7280', width: 52 }}>{label}</span>
      <span style={{ color: '#FACC15', width: 60, textAlign: 'right' }}>
        {v1 !== null ? fmt(v1) : '---'}
      </span>
      <span style={{ color: '#60A5FA', width: 60, textAlign: 'right' }}>
        {v2 !== null ? fmt(v2) : '---'}
      </span>
    </div>
  );

  return (
    <div style={{
      position: 'absolute', right: 0, top: 0, bottom: 0,
      width: 148,
      backgroundColor: 'rgba(8,13,16,0.93)',
      borderLeft: '1px solid #1F2937',
      padding: 6,
      fontFamily: 'monospace',
      overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', gap: 8, fontSize: 8, marginBottom: 4 }}>
        <span style={{ color: '#4B5563', width: 52 }}>Meas.</span>
        <span style={{ color: '#FACC15', width: 60, textAlign: 'right' }}>CH1</span>
        <span style={{ color: '#60A5FA', width: 60, textAlign: 'right' }}>CH2</span>
      </div>
      {row('Freq',  m1?.frequency ?? null, m2?.frequency ?? null, v => formatFrequency(v))}
      {row('Vpp',   m1?.vpp ?? null,       m2?.vpp ?? null,       v => formatVoltage(v))}
      {row('Vrms',  m1?.vrms ?? null,      m2?.vrms ?? null,      v => formatVoltage(v))}
      {row('Vavg',  m1?.vavg ?? null,      m2?.vavg ?? null,      v => formatVoltage(v))}
      {row('Vmax',  m1?.vmax ?? null,      m2?.vmax ?? null,      v => formatVoltage(v))}
      {row('Vmin',  m1?.vmin ?? null,      m2?.vmin ?? null,      v => formatVoltage(v))}
      {row('Duty',  m1?.dutyCycle ?? null, m2?.dutyCycle ?? null, v => `${v.toFixed(1)}%`)}
      {row('Rise',  m1?.riseTime ?? null,  m2?.riseTime ?? null,  v => `${(v*1e6).toFixed(2)}μs`)}
    </div>
  );
}

// Komponen utama
export default function Oscilloscope() {
  const { osc, updateOsc, cables } = useWorkbenchStore();
  const { getSignal } = useSignalStore();

  // Cek apakah CH1/CH2 punya kabel masuk
  const ch1Cable = cables.find((c: any) => c.toPortId === PORT_CH1);
  const ch2Cable = cables.find((c: any) => c.toPortId === PORT_CH2);

  const ch1Signal = ch1Cable ? getSignal(ch1Cable.fromPortId)?.samples ?? null : null;
  const ch2Signal = ch2Cable ? getSignal(ch2Cable.fromPortId)?.samples ?? null : null;

  const SCREEN_W  = 400;
  const SCREEN_H  = 240;
  const sampleRate = 100_000;

  return (
    <div style={{
      display: 'inline-flex',
      flexDirection: 'column',
      backgroundColor: '#1C2333',
      border: '2px solid #374151',
      borderRadius: 6,
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      userSelect: 'none',
      minWidth: 540,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 10px',
        backgroundColor: '#141B27',
        borderBottom: '1px solid #1F2937',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 9, color: '#4B5563', letterSpacing: '0.08em' }}>GW INSTEK</span>
          <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>
            Digital Storage Oscilloscope
          </span>
        </div>
        <span style={{ fontSize: 10, color: '#6B7280', fontFamily: 'monospace' }}>GDS-1102-U</span>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1 }}>

        {/* CH1 controls */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', padding: '8px 5px', gap: 6,
          borderRight: '1px solid #1F2937', minWidth: 52,
          backgroundColor: '#171F2E',
        }}>
          {/* CH1 label dengan warna */}
          <div style={{
            width: 28, height: 4, borderRadius: 2,
            backgroundColor: osc.ch1.isEnabled ? '#FACC15' : '#374151',
            transition: 'background-color 0.2s',
          }} />
          <span style={{ fontSize: 8, color: '#FACC15', letterSpacing: '0.1em' }}>CH1</span>

          {/* VOLTS/DIV CH1 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div
              style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #2D3748, #1A202C)',
                border: '2px solid #4A5568',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', position: 'relative',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              }}
              onClick={() => {
                const steps = [0.002,0.005,0.01,0.02,0.05,0.1,0.2,0.5,1,2,5,10];
                const idx = steps.indexOf(osc.ch1.voltsPerDiv);
                const next = steps[Math.min(steps.length-1, idx+1)];
                updateOsc({ ch1: { ...osc.ch1, voltsPerDiv: next } });
              }}
              onContextMenu={e => {
                e.preventDefault();
                const steps = [0.002,0.005,0.01,0.02,0.05,0.1,0.2,0.5,1,2,5,10];
                const idx = steps.indexOf(osc.ch1.voltsPerDiv);
                const next = steps[Math.max(0, idx-1)];
                updateOsc({ ch1: { ...osc.ch1, voltsPerDiv: next } });
              }}
            >
              <div style={{
                width: 4, height: 14,
                backgroundColor: '#FACC15',
                borderRadius: 2,
                transformOrigin: 'center bottom',
                transform: 'translateY(-4px)',
              }} />
            </div>
            <span style={{ fontSize: 8, color: '#6B7280' }}>V/DIV</span>
            <span style={{ fontSize: 8, color: '#FACC15', fontFamily: 'monospace' }}>
              {osc.ch1.voltsPerDiv < 1
                ? `${(osc.ch1.voltsPerDiv*1000).toFixed(0)}mV`
                : `${osc.ch1.voltsPerDiv}V`}
            </span>
          </div>

          <button
            onClick={() => updateOsc({ ch1: { ...osc.ch1, isEnabled: !osc.ch1.isEnabled } })}
            style={{
              width: 36, padding: '3px 0',
              backgroundColor: osc.ch1.isEnabled ? '#713F12' : '#1F2937',
              border: `1px solid ${osc.ch1.isEnabled ? '#CA8A04' : '#374151'}`,
              borderRadius: 3, cursor: 'pointer', fontSize: 8,
              color: osc.ch1.isEnabled ? '#FDE68A' : '#6B7280',
            }}
          >
            {osc.ch1.isEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Center: screen */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <OscStatusBar state={osc} />
          <div style={{ position: 'relative', flex: 1 }}>
            <OscScreen
              ch1Signal={ch1Signal}
              ch2Signal={ch2Signal}
              ch1State={osc.ch1}
              ch2State={osc.ch2}
              timePerDiv={osc.timePerDiv}
              sampleRate={sampleRate}
              triggerLevel={osc.triggerLevel}
              isRunning={osc.isRunning}
              width={SCREEN_W}
              height={SCREEN_H}
            />
            {osc.isMeasureOpen && (
              <MeasurePanel
                ch1Buf={ch1Signal}
                ch2Buf={ch2Signal}
                sampleRate={sampleRate}
              />
            )}
          </div>
        </div>

        {/* CH2 + Horizontal + Trigger controls */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', padding: '8px 5px', gap: 6,
          borderLeft: '1px solid #1F2937', minWidth: 52,
          backgroundColor: '#171F2E',
        }}>
          {/* CH2 */}
          <div style={{
            width: 28, height: 4, borderRadius: 2,
            backgroundColor: osc.ch2.isEnabled ? '#60A5FA' : '#374151',
            transition: 'background-color 0.2s',
          }} />
          <span style={{ fontSize: 8, color: '#60A5FA', letterSpacing: '0.1em' }}>CH2</span>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div
              style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #2D3748, #1A202C)',
                border: '2px solid #4A5568',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              }}
              onClick={() => {
                const steps = [0.002,0.005,0.01,0.02,0.05,0.1,0.2,0.5,1,2,5,10];
                const idx = steps.indexOf(osc.ch2.voltsPerDiv);
                updateOsc({ ch2: { ...osc.ch2, voltsPerDiv: steps[Math.min(steps.length-1, idx+1)] } });
              }}
              onContextMenu={e => {
                e.preventDefault();
                const steps = [0.002,0.005,0.01,0.02,0.05,0.1,0.2,0.5,1,2,5,10];
                const idx = steps.indexOf(osc.ch2.voltsPerDiv);
                updateOsc({ ch2: { ...osc.ch2, voltsPerDiv: steps[Math.max(0, idx-1)] } });
              }}
            >
              <div style={{
                width: 4, height: 14, backgroundColor: '#60A5FA',
                borderRadius: 2, transformOrigin: 'center bottom',
                transform: 'translateY(-4px)',
              }} />
            </div>
            <span style={{ fontSize: 8, color: '#6B7280' }}>V/DIV</span>
            <span style={{ fontSize: 8, color: '#60A5FA', fontFamily: 'monospace' }}>
              {osc.ch2.voltsPerDiv < 1
                ? `${(osc.ch2.voltsPerDiv*1000).toFixed(0)}mV`
                : `${osc.ch2.voltsPerDiv}V`}
            </span>
          </div>

          <button
            onClick={() => updateOsc({ ch2: { ...osc.ch2, isEnabled: !osc.ch2.isEnabled } })}
            style={{
              width: 36, padding: '3px 0',
              backgroundColor: osc.ch2.isEnabled ? '#1E3A5F' : '#1F2937',
              border: `1px solid ${osc.ch2.isEnabled ? '#3B82F6' : '#374151'}`,
              borderRadius: 3, cursor: 'pointer', fontSize: 8,
              color: osc.ch2.isEnabled ? '#93C5FD' : '#6B7280',
            }}
          >
            {osc.ch2.isEnabled ? 'ON' : 'OFF'}
          </button>

          <div style={{ height: 1, width: '100%', background: '#1F2937', margin: '2px 0' }} />

          {/* TIME/DIV */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div
              style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #2D3748, #1A202C)',
                border: '2px solid #6D28D9',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              }}
              onClick={() => {
                const steps = [1e-9,2.5e-9,5e-9,1e-8,2.5e-8,5e-8,1e-7,2.5e-7,5e-7,
                               1e-6,2.5e-6,5e-6,1e-5,2.5e-5,5e-5,1e-4,2.5e-4,5e-4,
                               1e-3,2.5e-3,5e-3,0.01,0.025,0.05,0.1,0.25,0.5,1,2.5,5,10,25,50];
                const idx = steps.findIndex(s => Math.abs(s - osc.timePerDiv) < s * 0.01);
                updateOsc({ timePerDiv: steps[Math.min(steps.length-1, idx+1)] });
              }}
              onContextMenu={e => {
                e.preventDefault();
                const steps = [1e-9,2.5e-9,5e-9,1e-8,2.5e-8,5e-8,1e-7,2.5e-7,5e-7,
                               1e-6,2.5e-6,5e-6,1e-5,2.5e-5,5e-5,1e-4,2.5e-4,5e-4,
                               1e-3,2.5e-3,5e-3,0.01,0.025,0.05,0.1,0.25,0.5,1,2.5,5,10,25,50];
                const idx = steps.findIndex(s => Math.abs(s - osc.timePerDiv) < s * 0.01);
                updateOsc({ timePerDiv: steps[Math.max(0, idx-1)] });
              }}
            >
              <div style={{
                width: 4, height: 14, backgroundColor: '#A78BFA',
                borderRadius: 2, transformOrigin: 'center bottom',
                transform: 'translateY(-4px)',
              }} />
            </div>
            <span style={{ fontSize: 8, color: '#6B7280' }}>T/DIV</span>
            <span style={{ fontSize: 8, color: '#A78BFA', fontFamily: 'monospace' }}>
              {osc.timePerDiv < 1e-6 ? `${(osc.timePerDiv*1e9).toFixed(0)}ns`
               : osc.timePerDiv < 1e-3 ? `${(osc.timePerDiv*1e6).toFixed(0)}μs`
               : osc.timePerDiv < 1 ? `${(osc.timePerDiv*1e3).toFixed(0)}ms`
               : `${osc.timePerDiv}s`}
            </span>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div style={{
        display: 'flex', gap: 4, padding: '5px 8px',
        backgroundColor: '#111827', borderTop: '1px solid #1F2937',
        flexWrap: 'wrap',
      }}>
        {[
          { label: 'Autoset', action: () => updateOsc({ isAutosetting: true }) },
          { label: 'Run/Stop', action: () => updateOsc({ isRunning: !osc.isRunning }), active: osc.isRunning },
          { label: 'Single', action: () => updateOsc({ isRunning: false }) },
          { label: 'Measure', action: () => updateOsc({ isMeasureOpen: !osc.isMeasureOpen }), active: osc.isMeasureOpen },
          { label: 'Cursor', action: () => updateOsc({ isCursorActive: !osc.isCursorActive }), active: osc.isCursorActive },
        ].map(({ label, action, active }) => (
          <button key={label} onClick={action} style={{
            padding: '4px 8px', fontSize: 9,
            backgroundColor: active ? '#1D4ED8' : '#1F2937',
            border: `1px solid ${active ? '#3B82F6' : '#374151'}`,
            borderBottom: '2px solid #111',
            borderRadius: 3, cursor: 'pointer',
            color: active ? '#BFDBFE' : '#9CA3AF',
            fontWeight: 500, letterSpacing: '0.04em',
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* BNC Ports */}
      <div style={{
        display: 'flex', gap: 16, padding: '6px 10px',
        backgroundColor: '#0F172A', borderTop: '1px solid #1F2937',
        alignItems: 'center',
      }}>
        <BNCPort
          portId={PORT_CH1}
          label="CH1"
          labelPosition="top"
          size={20}
          isConnected={!!ch1Cable}
          isOutput={false}
        />
        <BNCPort
          portId={PORT_CH2}
          label="CH2"
          labelPosition="top"
          size={20}
          isConnected={!!ch2Cable}
          isOutput={false}
        />
        <BNCPort
          portId={PORT_EXT}
          label="EXT"
          labelPosition="top"
          size={16}
          isConnected={false}
          isOutput={false}
        />
        <span style={{ fontSize: 8, color: '#374151', marginLeft: 'auto' }}>
          MAX 300V
        </span>
      </div>
    </div>
  );
}