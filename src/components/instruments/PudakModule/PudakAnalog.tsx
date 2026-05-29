'use client';

import { useState } from 'react';
import BNCPort from '../../ui/BNCPort';
import { useWorkbenchStore } from '../../../store/workbenchStore';

// Sub-modul yang ada di panel
type AnalogSubModule = 'signal_source' | 'amplifier' | 'tuned_circuit' | 'detector';

interface SubModuleState {
  isPowered: boolean;
  // Signal Source: frekuensi carrier (kHz), atenuasi (dB)
  carrierFreq: number;
  attenuation: number;
  // Amplifier: gain
  gain: number;
  // Tuned Circuit: frekuensi tuning, B control
  tuningFreq: number;
  bControl: number;
}

const DEFAULT_SUBMOD: SubModuleState = {
  isPowered: false,
  carrierFreq: 455,
  attenuation: 0,
  gain: 1,
  tuningFreq: 455,
  bControl: 0.5,
};

// Satu sub-modul panel
function SubModulePanel({
  title, code, color, children,
}: {
  title: string; code: string; color: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      backgroundColor: '#D4D8DC',
      border: `2px solid ${color}`,
      borderRadius: 4,
      padding: '6px 8px',
      flex: 1,
      minWidth: 100,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: '#1F2937', letterSpacing: '0.04em' }}>
          {title}
        </span>
        <span style={{ fontSize: 7, color: '#6B7280', fontFamily: 'monospace' }}>{code}</span>
      </div>
      {children}
    </div>
  );
}

// Knob sederhana (tanpa drag — cukup klik +/-)
function SimpleKnob({
  label, value, unit, onUp, onDown, color = '#374151',
}: {
  label: string; value: number; unit: string;
  onUp: () => void; onDown: () => void; color?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{ fontSize: 7, color: '#6B7280' }}>{label}</span>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, #374151, #1F2937)',
        border: `2px solid ${color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
        cursor: 'pointer', userSelect: 'none',
      }}
        onClick={onUp}
        onContextMenu={e => { e.preventDefault(); onDown(); }}
        title="Klik: naik · Klik kanan: turun"
      >
        <span style={{ fontSize: 8, color: '#F9FAFB', fontFamily: 'monospace', fontWeight: 600 }}>
          {value.toFixed(value < 10 ? 1 : 0)}
        </span>
      </div>
      <span style={{ fontSize: 7, color: '#9CA3AF' }}>{unit}</span>
    </div>
  );
}

// LED indicator
function LED({ on, color = '#4ADE80' }: { on: boolean; color?: string }) {
  return (
    <div style={{
      width: 7, height: 7, borderRadius: '50%',
      backgroundColor: on ? color : '#374151',
      boxShadow: on ? `0 0 5px ${color}` : 'none',
      transition: 'all 0.15s',
    }} />
  );
}

// Komponen utama
interface PudakAnalogProps {
  moduleType: 'am' | 'fm' | 'demodulasi';
}

export default function PudakAnalog({ moduleType }: PudakAnalogProps) {
  const cables = useWorkbenchStore(s => s.cables);
  const [state, setState] = useState<SubModuleState>(DEFAULT_SUBMOD);
  const [isPowered, setIsPowered] = useState(false);

  const isInputConnected  = cables.some((c: any) => c.toPortId === 'pudak_input_a');
  const isOutputConnected = cables.some((c: any) => c.fromPortId === 'pudak_output');

  const update = (patch: Partial<SubModuleState>) =>
    setState(s => ({ ...s, ...patch }));

  const moduleLabel = moduleType === 'am' ? 'AM'
    : moduleType === 'fm' ? 'FM' : 'DEMODULASI';
  const moduleColor = moduleType === 'am' ? '#3B82F6'
    : moduleType === 'fm' ? '#8B5CF6' : '#10B981';

  return (
    <div style={{
      display: 'inline-flex',
      flexDirection: 'column',
      backgroundColor: '#C8CDD6',
      border: '2px solid #9CA3AF',
      borderRadius: 6,
      overflow: 'hidden',
      boxShadow: '0 6px 24px rgba(0,0,0,0.4)',
      userSelect: 'none',
      minWidth: 460,
    }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 10px',
        backgroundColor: '#B4BAC4',
        borderBottom: '1px solid #9CA3AF',
      }}>
        <div>
          <span style={{ fontSize: 9, color: '#374151', fontWeight: 700, letterSpacing: '0.08em' }}>
            PUDAK SCIENTIFIC
          </span>
          <span style={{
            marginLeft: 8, fontSize: 11, color: '#1F2937', fontWeight: 600,
            padding: '1px 6px', backgroundColor: moduleColor + '30',
            borderRadius: 3, border: `1px solid ${moduleColor}`,
          }}>
            {moduleLabel}
          </span>
        </div>
        <button
          onClick={() => setIsPowered(v => !v)}
          style={{
            padding: '3px 10px', fontSize: 8,
            backgroundColor: isPowered ? '#7F1D1D' : '#1F2937',
            color: isPowered ? '#FCA5A5' : '#9CA3AF',
            border: `1px solid ${isPowered ? '#DC2626' : '#374151'}`,
            borderRadius: 3, cursor: 'pointer', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          <LED on={isPowered} color="#EF4444" />
          POWER
        </button>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', gap: 6, padding: 8, flexWrap: 'wrap' }}>

        {/* Signal Source PTE-011-01 */}
        <SubModulePanel title="Signal Source" code="PTE-011-01" color="#3B82F6">
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
            <SimpleKnob
              label="C (kHz)" value={state.carrierFreq} unit="kHz"
              color="#3B82F6"
              onUp={() => update({ carrierFreq: Math.min(500, state.carrierFreq + 5) })}
              onDown={() => update({ carrierFreq: Math.max(100, state.carrierFreq - 5) })}
            />
            <SimpleKnob
              label="ATT (dB)" value={state.attenuation} unit="dB"
              color="#6B7280"
              onUp={() => update({ attenuation: Math.min(20, state.attenuation + 1) })}
              onDown={() => update({ attenuation: Math.max(-20, state.attenuation - 1) })}
            />
          </div>
          <div style={{ fontSize: 7, color: '#374151', textAlign: 'center', marginTop: 3 }}>
            Carrier: <span style={{ color: '#3B82F6', fontFamily: 'monospace' }}>
              {state.carrierFreq} kHz
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
            <BNCPort portId="pudak_input_a" label="AUDIO IN" labelPosition="bottom"
              size={14} isConnected={isInputConnected} isOutput={false} />
          </div>
        </SubModulePanel>

        {/* Amplifier PTE-011-07 */}
        {(moduleType === 'am' || moduleType === 'demodulasi') && (
          <SubModulePanel title="Amplifier" code="PTE-011-07" color="#F59E0B">
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <SimpleKnob
                label="GAIN" value={state.gain} unit="×"
                color="#F59E0B"
                onUp={() => update({ gain: Math.min(10, state.gain + 0.5) })}
                onDown={() => update({ gain: Math.max(0.5, state.gain - 0.5) })}
              />
            </div>
            <div style={{ fontSize: 7, color: '#78350F', textAlign: 'center', marginTop: 3 }}>
              {state.gain.toFixed(1)}× amplification
            </div>
          </SubModulePanel>
        )}

        {/* Tuned Circuit PTE-011-04 */}
        {(moduleType === 'am' || moduleType === 'demodulasi') && (
          <SubModulePanel title="Tuned Circuit" code="PTE-011-04" color="#10B981">
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
              <SimpleKnob
                label="C (kHz)" value={state.tuningFreq} unit="kHz"
                color="#10B981"
                onUp={() => update({ tuningFreq: Math.min(500, state.tuningFreq + 5) })}
                onDown={() => update({ tuningFreq: Math.max(100, state.tuningFreq - 5) })}
              />
              <SimpleKnob
                label="B" value={state.bControl * 10} unit=""
                color="#6B7280"
                onUp={() => update({ bControl: Math.min(1, state.bControl + 0.1) })}
                onDown={() => update({ bControl: Math.max(0, state.bControl - 0.1) })}
              />
            </div>
          </SubModulePanel>
        )}

        {/* Detector PTE-011-02 (hanya untuk Demodulasi) */}
        {moduleType === 'demodulasi' && (
          <SubModulePanel title="Detector" code="PTE-011-02" color="#EC4899">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              {/* Simbol diode */}
              <svg width={40} height={20}>
                <line x1={0} y1={10} x2={15} y2={10} stroke="#EC4899" strokeWidth={1.5} />
                <polygon points="15,5 15,15 25,10" fill="#EC4899" />
                <line x1={25} y1={5} x2={25} y2={15} stroke="#EC4899" strokeWidth={1.5} />
                <line x1={25} y1={10} x2={40} y2={10} stroke="#EC4899" strokeWidth={1.5} />
              </svg>
              <span style={{ fontSize: 7, color: '#BE185D' }}>Envelope Detector</span>
            </div>
          </SubModulePanel>
        )}

        {/* Output port */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '0 8px', gap: 6,
          borderLeft: '1px solid #9CA3AF',
        }}>
          <LED on={isPowered && isOutputConnected} color="#4ADE80" />
          <BNCPort portId="pudak_output" label="OUTPUT" labelPosition="bottom"
            size={18} isConnected={isOutputConnected} isOutput={true}
            disabled={!isPowered} />
        </div>
      </div>

      {/* Spec bar */}
      <div style={{
        padding: '3px 10px', backgroundColor: '#9CA3AF',
        fontSize: 8, color: '#374151', fontFamily: 'monospace',
        display: 'flex', gap: 8,
      }}>
        <span>455 kHz IF</span>
        <span>·</span>
        <span>±15V DC</span>
        <span>·</span>
        <span style={{ color: isPowered ? '#14532D' : '#374151' }}>
          {isPowered ? '● ON' : '○ OFF'}
        </span>
      </div>
    </div>
  );
}