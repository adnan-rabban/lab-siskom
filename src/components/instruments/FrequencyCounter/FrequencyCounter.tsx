'use client';

import { useEffect, useRef, useCallback } from 'react';
import BNCPort from '../../ui/BNCPort';
import SevenSegment from '../../ui/SevenSegment';
import { ToggleButton, SelectorButton } from '../../ui/ToggleButton';
import { useWorkbenchStore } from '../../../store/workbenchStore';
import { useSignalStore } from '../../../store/signalStore';
import { GFCGateTime, GFCAttenuation, GFCMode } from '../../../types/instruments';
import { detectFrequency, detectPeriod } from '../../../lib/signal/utils';

const PORT_INPUT = 'gfc_input';
const SAMPLE_RATE = 100_000;

export default function FrequencyCounter() {
  const gfc       = useWorkbenchStore(s => s.gfc);
  const updateGFC = useWorkbenchStore(s => s.updateGFC);
  const cables    = useWorkbenchStore(s => s.cables);
  const { getSignal } = useSignalStore();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const inputCable  = cables.find((c: any) => c.toPortId === PORT_INPUT);
  const isConnected = !!inputCable;

  // Measurement loop
  const measure = useCallback(() => {
    if (!gfc.isPowered || !isConnected || !inputCable) {
      updateGFC({ displayValue: 0, isUpdating: false });
      return;
    }

    const signal = getSignal(inputCable.fromPortId);
    if (!signal?.samples) {
      updateGFC({ displayValue: 0 });
      return;
    }

    updateGFC({ isUpdating: true });

    // Terapkan attenuator: 1/10 = bagi amplitude 10
    const samples = gfc.attenuation === '1/10'
      ? signal.samples.map((v: number) => v / 10) as unknown as Float32Array
      : signal.samples;

    // Terapkan LPF: hanya ukur jika frekuensi < 100kHz
    let rawFreq = detectFrequency(samples, SAMPLE_RATE);

    if (gfc.lpfEnabled && rawFreq > 100_000) {
      rawFreq = 0; // LPF memblokir sinyal tinggi saat diukur rendah
    }

    // Cek overflow: GFC-8010H max 120MHz
    const isOverflow = rawFreq > 120_000_000;

    // FREQ vs PRID mode
    const displayValue = gfc.mode === 'PRID'
      ? (rawFreq > 0 ? detectPeriod(samples, SAMPLE_RATE) : 0)
      : rawFreq;

    // Simulasi gate time delay: nilai update lambat sesuai gate time
    setTimeout(() => {
      updateGFC({
        displayValue: isOverflow ? 0 : displayValue,
        isOverflow,
        isUpdating: false,
        lastMeasuredAt: Date.now(),
      });
    }, gfc.gateTime * 200); // simulasi 20% dari gate time asli

  }, [gfc, isConnected, inputCable, getSignal, updateGFC]);

  // Jalankan measurement sesuai gate time
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!gfc.isPowered) return;

    // Refresh rate berdasarkan gate time (0.1s → cepat, 10s → lambat)
    const intervalMs = gfc.gateTime === 0.1 ? 300
      : gfc.gateTime === 1 ? 800 : 3000;

    timerRef.current = setInterval(measure, intervalMs);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gfc.isPowered, gfc.gateTime, measure]);

  // Gate time LED indicators
  const GATE_OPTIONS: GFCGateTime[] = [0.1, 1, 10];

  return (
    <div style={{
      display: 'inline-flex',
      flexDirection: 'column',
      backgroundColor: '#C8CDD6',
      border: '2px solid #9CA3AF',
      borderRadius: 6,
      overflow: 'hidden',
      boxShadow: '0 6px 24px rgba(0,0,0,0.5)',
      userSelect: 'none',
      minWidth: 440,
    }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 10px',
        backgroundColor: '#B4BAC4',
        borderBottom: '1px solid #9CA3AF',
      }}>
        <div>
          <span style={{ fontSize: 9, color: '#374151', fontWeight: 600, letterSpacing: '0.08em' }}>
            GW INSTEK
          </span>
          <span style={{ fontSize: 10, color: '#1F2937', fontWeight: 500, marginLeft: 6 }}>
            Digital Frequency Counter
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 9, color: '#374151', fontFamily: 'monospace' }}>GFC-8010H</span>
          {/* Power LED */}
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            backgroundColor: gfc.isPowered ? '#4ADE80' : '#6B7280',
            boxShadow: gfc.isPowered ? '0 0 6px #4ADE80' : 'none',
            transition: 'all 0.2s',
          }} />
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px', gap: 10 }}>

        {/* INPUT BNC */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 5, padding: '6px 8px',
          backgroundColor: '#B4BAC4', borderRadius: 4,
          border: '1px solid #9CA3AF',
          alignSelf: 'stretch', justifyContent: 'center',
        }}>
          {/* Warning triangle (dari manual) */}
          <span style={{ fontSize: 14 }}>⚠</span>
          <BNCPort
            portId={PORT_INPUT}
            size={22}
            isConnected={isConnected}
            isOutput={false}
          />
          <span style={{ fontSize: 7, color: '#374151', textAlign: 'center', lineHeight: 1.3 }}>
            INPUT<br/>MAX 150V
          </span>
          <span style={{ fontSize: 6, color: '#6B7280', textAlign: 'center' }}>
            0.1Hz~120MHz
          </span>
        </div>

        {/* Display area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Main 8-digit display */}
          <SevenSegment
            value={gfc.isPowered ? gfc.displayValue : 0}
            mode={gfc.mode}
            isOverflow={gfc.isOverflow}
            isOff={!gfc.isPowered}
            width={16}
            height={28}
          />

          {/* Gate time LED indicators */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', paddingLeft: 4 }}>
            <span style={{ fontSize: 8, color: '#6B7280' }}>GATE</span>
            {GATE_OPTIONS.map(gt => (
              <div key={gt} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  backgroundColor: gfc.isPowered && gfc.gateTime === gt ? '#FF4500' : '#2D0A00',
                  boxShadow: gfc.isPowered && gfc.gateTime === gt ? '0 0 4px #FF4500' : 'none',
                }} />
                <span style={{ fontSize: 8, color: '#6B7280', fontFamily: 'monospace' }}>
                  {gt}s
                </span>
              </div>
            ))}
            {/* Updating blink */}
            {gfc.isUpdating && (
              <span style={{ fontSize: 8, color: '#FF4500', animation: 'pulse 0.5s infinite' }}>
                ●
              </span>
            )}
          </div>
        </div>

        {/* Controls panel */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 5,
          padding: '4px 8px',
          backgroundColor: '#B4BAC4', borderRadius: 4,
          border: '1px solid #9CA3AF',
          alignSelf: 'stretch', justifyContent: 'center',
        }}>

          {/* ATT selector */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 7, color: '#374151' }}>ATT</span>
            <div style={{ display: 'flex', gap: 2 }}>
              {(['1/1', '1/10'] as GFCAttenuation[]).map(att => (
                <button
                  key={att}
                  onClick={() => updateGFC({ attenuation: att })}
                  disabled={!gfc.isPowered}
                  style={{
                    padding: '2px 5px', fontSize: 8,
                    backgroundColor: gfc.attenuation === att ? '#1F2937' : '#D1D5DB',
                    color: gfc.attenuation === att ? '#F9FAFB' : '#374151',
                    border: `1px solid ${gfc.attenuation === att ? '#374151' : '#9CA3AF'}`,
                    borderRadius: 2, cursor: gfc.isPowered ? 'pointer' : 'not-allowed',
                    opacity: gfc.isPowered ? 1 : 0.4,
                  }}
                >
                  {att}
                </button>
              ))}
            </div>
          </div>

          {/* LPF toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 7, color: '#374151' }}>LPF</span>
            <div style={{ display: 'flex', gap: 2 }}>
              {(['ON', 'OFF'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => updateGFC({ lpfEnabled: v === 'ON' })}
                  disabled={!gfc.isPowered}
                  style={{
                    padding: '2px 5px', fontSize: 8,
                    backgroundColor: (v === 'ON') === gfc.lpfEnabled ? '#1F2937' : '#D1D5DB',
                    color: (v === 'ON') === gfc.lpfEnabled ? '#F9FAFB' : '#374151',
                    border: `1px solid ${(v === 'ON') === gfc.lpfEnabled ? '#374151' : '#9CA3AF'}`,
                    borderRadius: 2, cursor: gfc.isPowered ? 'pointer' : 'not-allowed',
                    opacity: gfc.isPowered ? 1 : 0.4,
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* FREQ/PRID toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {(['FREQ', 'PRID'] as GFCMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => updateGFC({ mode: m })}
                  disabled={!gfc.isPowered}
                  style={{
                    padding: '2px 4px', fontSize: 8,
                    backgroundColor: gfc.mode === m ? '#1E3A5F' : '#D1D5DB',
                    color: gfc.mode === m ? '#93C5FD' : '#374151',
                    border: `1px solid ${gfc.mode === m ? '#3B82F6' : '#9CA3AF'}`,
                    borderRadius: 2, cursor: gfc.isPowered ? 'pointer' : 'not-allowed',
                    opacity: gfc.isPowered ? 1 : 0.4,
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Gate time */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 7, color: '#374151' }}>GATE TIME</span>
            <div style={{ display: 'flex', gap: 2 }}>
              {GATE_OPTIONS.map(gt => (
                <button
                  key={gt}
                  onClick={() => updateGFC({ gateTime: gt })}
                  disabled={!gfc.isPowered}
                  style={{
                    padding: '2px 4px', fontSize: 8,
                    backgroundColor: gfc.gateTime === gt ? '#1F2937' : '#D1D5DB',
                    color: gfc.gateTime === gt ? '#F9FAFB' : '#374151',
                    border: `1px solid ${gfc.gateTime === gt ? '#374151' : '#9CA3AF'}`,
                    borderRadius: 2, cursor: gfc.isPowered ? 'pointer' : 'not-allowed',
                    opacity: gfc.isPowered ? 1 : 0.4,
                  }}
                >
                  {gt}s
                </button>
              ))}
            </div>
          </div>

          {/* POWER */}
          <button
            onClick={() => updateGFC({ isPowered: !gfc.isPowered })}
            style={{
              marginTop: 2, padding: '4px 8px', fontSize: 9,
              backgroundColor: gfc.isPowered ? '#7F1D1D' : '#1F2937',
              color: gfc.isPowered ? '#FCA5A5' : '#9CA3AF',
              border: `1px solid ${gfc.isPowered ? '#DC2626' : '#374151'}`,
              borderBottom: '2px solid #0D1117',
              borderRadius: 3, cursor: 'pointer',
              fontWeight: 600, letterSpacing: '0.05em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}
          >
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              backgroundColor: gfc.isPowered ? '#EF4444' : '#374151',
            }} />
            POWER
          </button>
        </div>
      </div>

      {/* Spec bar */}
      <div style={{
        display: 'flex', gap: 8, padding: '3px 10px',
        backgroundColor: '#9CA3AF', fontSize: 8, color: '#374151',
        fontFamily: 'monospace',
      }}>
        <span>0.1Hz ~ 120MHz</span>
        <span>·</span>
        <span>20mVrms sensitivity</span>
        <span>·</span>
        <span>8-digit resolution</span>
        {isConnected && gfc.isPowered && (
          <>
            <span>·</span>
            <span style={{ color: '#14532D', fontWeight: 600 }}>
              {gfc.isUpdating ? 'measuring...' : `${gfc.displayValue.toFixed(0)} Hz`}
            </span>
          </>
        )}
      </div>
    </div>
  );
}