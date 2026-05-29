'use client';

import { useState, useEffect } from 'react';
import BNCPort from '../../ui/BNCPort';
import { useWorkbenchStore } from '../../../store/workbenchStore';
import { useSignalStore } from '../../../store/signalStore';
import { sampleAndHold, multiplexTDM } from '../../../lib/signal/sampling';
import { BUFFER_SIZE } from '../../../lib/signal/types';

interface SHMState {
  isPowered: boolean;
  clockFreq: number;   // Hz, range 1kHz ~ 50kHz
  pulseWidth: number;  // μs, range 2 ~ 25
}

const DEFAULT: SHMState = {
  isPowered: false,
  clockFreq: 20_000,
  pulseWidth: 10,
};

function RotaryControl({
  label, value, unit, onUp, onDown, color = '#4ADE80',
}: {
  label: string; value: string; unit: string;
  onUp: () => void; onDown: () => void; color?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{ fontSize: 7, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </span>
      <div
        onClick={onUp}
        onContextMenu={e => { e.preventDefault(); onDown(); }}
        style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #374151, #1F2937)',
          border: `2.5px solid ${color}`,
          cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 3px 8px rgba(0,0,0,0.5)',
          userSelect: 'none',
        }}
        title="Klik: naik · Klik kanan: turun"
      >
        <span style={{ fontSize: 9, color: '#F9FAFB', fontFamily: 'monospace', fontWeight: 700 }}>
          {value}
        </span>
      </div>
      <span style={{ fontSize: 7, color: '#9CA3AF' }}>{unit}</span>
    </div>
  );
}

export default function PudakSampleHoldMux() {
  const [state, setState] = useState<SHMState>(DEFAULT);
  const cables = useWorkbenchStore(s => s.cables);
  const { getSignal, computeSignal } = useSignalStore();

  const in1Connected = cables.some((c: any) => c.toPortId === 'pudak_input_a');
  const in2Connected = cables.some((c: any) => c.toPortId === 'pudak_input_b');
  const outConnected = cables.some((c: any) => c.fromPortId === 'pudak_output');

  // Compute sample & hold output setiap kali state berubah
  useEffect(() => {
    if (!state.isPowered) return;

    const in1Cable = cables.find((c: any) => c.toPortId === 'pudak_input_a');
    const in2Cable = cables.find((c: any) => c.toPortId === 'pudak_input_b');
    const sig1 = in1Cable ? getSignal(in1Cable.fromPortId) : null;
    const sig2 = in2Cable ? getSignal(in2Cable.fromPortId) : null;

    if (!sig1) return;

    // Sample and hold
    const sampleRate = 100_000;
    let outputSamples: Float32Array;

    if (sig2) {
      // TDM mode: multiplex dua sinyal
      outputSamples = multiplexTDM(
        [sig1.samples, sig2.samples],
        state.clockFreq,
        sampleRate,
        BUFFER_SIZE,
      );
    } else {
      // Single channel S&H
      outputSamples = sampleAndHold(sig1.samples, state.clockFreq, sampleRate, BUFFER_SIZE);
    }

    // Push ke signal store sebagai output pudak
    computeSignal('pudak_output', {
      ...sig1.params,
      waveform: 'sampled',
    });
  }, [state, cables, getSignal, computeSignal]);

  const fmtFreq = (hz: number) => hz >= 1000 ? `${(hz/1000).toFixed(0)}k` : `${hz}`;

  const update = (patch: Partial<SHMState>) => setState(s => ({ ...s, ...patch }));

  return (
    <div style={{
      display: 'inline-flex', flexDirection: 'column',
      backgroundColor: '#C8CDD6', border: '2px solid #9CA3AF',
      borderRadius: 6, overflow: 'hidden',
      boxShadow: '0 6px 24px rgba(0,0,0,0.4)',
      userSelect: 'none', minWidth: 500,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 10px', backgroundColor: '#B4BAC4',
        borderBottom: '1px solid #9CA3AF',
      }}>
        <div>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#374151', letterSpacing: '0.08em' }}>
            PUDAK SCIENTIFIC
          </span>
          <span style={{ fontSize: 10, color: '#1F2937', fontWeight: 500, marginLeft: 6 }}>
            Sample Hold and Multiplex
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 8, color: '#6B7280', fontFamily: 'monospace' }}>PTE-001-09</span>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            backgroundColor: state.isPowered ? '#4ADE80' : '#6B7280',
            boxShadow: state.isPowered ? '0 0 6px #4ADE80' : 'none',
          }} />
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', gap: 0 }}>

        {/* Input ports */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 10,
          padding: '10px 8px', alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#B4BAC4', borderRight: '1px solid #9CA3AF',
        }}>
          <span style={{ fontSize: 7, color: '#374151', textAlign: 'center', fontWeight: 600 }}>INPUT</span>
          <BNCPort portId="pudak_input_a" label="1" labelPosition="right"
            size={16} isConnected={in1Connected} isOutput={false} disabled={!state.isPowered} />
          <BNCPort portId="pudak_input_b" label="2" labelPosition="right"
            size={16} isConnected={in2Connected} isOutput={false} disabled={!state.isPowered} />
        </div>

        {/* Controls */}
        <div style={{ flex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Knobs row */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <RotaryControl
              label="Clock Frequency"
              value={fmtFreq(state.clockFreq)}
              unit="Hz"
              color="#F59E0B"
              onUp={() => update({ clockFreq: Math.min(50_000, state.clockFreq + 1_000) })}
              onDown={() => update({ clockFreq: Math.max(1_000, state.clockFreq - 1_000) })}
            />
            <RotaryControl
              label="Sample Pulse Width"
              value={`${state.pulseWidth}`}
              unit="μs"
              color="#3B82F6"
              onUp={() => update({ pulseWidth: Math.min(25, state.pulseWidth + 1) })}
              onDown={() => update({ pulseWidth: Math.max(2, state.pulseWidth - 1) })}
            />
          </div>

          {/* Status display */}
          <div style={{
            backgroundColor: '#0D0500', borderRadius: 3,
            padding: '4px 8px', fontFamily: 'monospace',
            border: '1px solid #1A0A00',
          }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 9, color: '#FF4500' }}>
                fs = {fmtFreq(state.clockFreq)} Hz
              </span>
              <span style={{ fontSize: 9, color: '#FF4500' }}>
                τ = {state.pulseWidth} μs
              </span>
              <span style={{ fontSize: 9, color: '#FF4500' }}>
                Nyquist = {fmtFreq(state.clockFreq / 2)} Hz
              </span>
            </div>
          </div>

          {/* Output ports grid */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { id: 'pudak_clock_out', label: 'CLOCK OUT', color: '#F59E0B' },
              { id: 'pudak_pulse1',    label: 'PULSE 1',   color: '#3B82F6' },
              { id: 'pudak_pulse2',    label: 'PULSE 2',   color: '#10B981' },
            ].map(port => (
              <div key={port.id} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              }}>
                <BNCPort portId={port.id} size={13} isOutput={true}
                  isConnected={cables.some((c: any) => c.fromPortId === port.id)}
                  disabled={!state.isPowered} />
                <span style={{ fontSize: 7, color: port.color, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                  {port.label}
                </span>
              </div>
            ))}
          </div>

          {/* Filter outputs */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 7, color: '#6B7280' }}>FILTER:</span>
            {[1,2,3,4].map(n => (
              <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <BNCPort portId={`pudak_filter${n}`} size={12} isOutput={true}
                  isConnected={cables.some((c: any) => c.fromPortId === `pudak_filter${n}`)}
                  disabled={!state.isPowered} />
                <span style={{ fontSize: 7, color: '#6B7280' }}>F{n}</span>
              </div>
            ))}
          </div>
        </div>

        {/* MUX output + power */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 8,
          padding: '10px 8px', alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#B4BAC4', borderLeft: '1px solid #9CA3AF',
        }}>
          <BNCPort portId="pudak_output" label="MUX OUT" labelPosition="top"
            size={18} isConnected={outConnected} isOutput={true} disabled={!state.isPowered} />

          <div style={{ height: 1, width: 36, backgroundColor: '#9CA3AF' }} />

          <button
            onClick={() => update({ isPowered: !state.isPowered })}
            style={{
              padding: '4px 6px', fontSize: 8,
              backgroundColor: state.isPowered ? '#7F1D1D' : '#1F2937',
              color: state.isPowered ? '#FCA5A5' : '#9CA3AF',
              border: `1px solid ${state.isPowered ? '#DC2626' : '#374151'}`,
              borderRadius: 3, cursor: 'pointer', fontWeight: 600,
            }}
          >
            PWR
          </button>
        </div>
      </div>

      {/* Spec bar */}
      <div style={{
        padding: '3px 10px', backgroundColor: '#9CA3AF',
        fontSize: 8, color: '#374151', fontFamily: 'monospace',
        display: 'flex', gap: 8,
      }}>
        <span>2 ch S&H + TDM Mux</span>
        <span>·</span>
        <span>1kHz ~ 50kHz clock</span>
        <span>·</span>
        <span>4× RC filter</span>
      </div>
    </div>
  );
}