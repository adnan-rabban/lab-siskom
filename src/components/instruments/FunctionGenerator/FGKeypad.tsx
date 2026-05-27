'use client';
import { useCallback } from 'react';
import { AFGState, AFGUnit, AFGAmplUnit } from '../../../types/instruments';
import { WaveformType } from '../../../lib/signal/types';

type KeypadField = AFGState['editingField'];

interface FGKeypadProps {
  state: AFGState;
  onUpdate: (patch: Partial<AFGState>) => void;
  onFieldSelect: (field: KeypadField) => void;
}

// Tombol kecil keypad
function Key({
  label, sub, onClick, color = '#1F2937', textColor = '#D1D5DB',
  width = 32, height = 28, disabled = false,
}: {
  label: string; sub?: string; onClick: () => void;
  color?: string; textColor?: string;
  width?: number; height?: number; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width, height,
        backgroundColor: color,
        border: '1px solid #374151',
        borderBottom: '2px solid #0D1117',
        borderRadius: 3,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 1, padding: '2px',
        opacity: disabled ? 0.4 : 1,
        userSelect: 'none',
        transition: 'background-color 0.08s',
      }}
      onMouseDown={e => (e.currentTarget.style.marginTop = '1px')}
      onMouseUp={e => (e.currentTarget.style.marginTop = '0')}
    >
      <span style={{ fontSize: 9, color: textColor, fontWeight: 500, lineHeight: 1 }}>{label}</span>
      {sub && <span style={{ fontSize: 7, color: '#6B7280', lineHeight: 1 }}>{sub}</span>}
    </button>
  );
}

// Scroll wheel simulasi
function ScrollWheel({
  onUp, onDown,
}: { onUp: () => void; onDown: () => void }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 2,
    }}>
      <button
        onClick={onUp}
        style={{
          width: 36, height: 16,
          backgroundColor: '#1F2937',
          border: '1px solid #374151', borderRadius: '4px 4px 0 0',
          cursor: 'pointer', color: '#9CA3AF', fontSize: 9,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >▲</button>
      <div style={{
        width: 36, height: 32,
        backgroundColor: '#111827',
        border: '1px solid #374151',
        borderRadius: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 28, height: 22,
          background: 'repeating-linear-gradient(0deg, #1F2937, #1F2937 2px, #111827 2px, #111827 4px)',
          borderRadius: 2,
        }} />
      </div>
      <button
        onClick={onDown}
        style={{
          width: 36, height: 16,
          backgroundColor: '#1F2937',
          border: '1px solid #374151', borderRadius: '0 0 4px 4px',
          cursor: 'pointer', color: '#9CA3AF', fontSize: 9,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >▼</button>
    </div>
  );
}

export default function FGKeypad({ state, onUpdate, onFieldSelect }: FGKeypadProps) {

  const WAVEFORMS: WaveformType[] = ['sine', 'square', 'ramp', 'triangle', 'noise', 'arb'];

  // Pilih waveform berikutnya
  const cycleWaveform = useCallback(() => {
    const idx = WAVEFORMS.indexOf(state.waveform);
    onUpdate({ waveform: WAVEFORMS[(idx + 1) % WAVEFORMS.length] });
  }, [state.waveform, onUpdate]);

  // Ubah nilai field yang aktif via numpad
  const applyValue = useCallback((value: number, unit: string) => {
    if (!state.editingField) return;
    switch (state.editingField) {
      case 'freq': {
        const hz = unit === 'kHz' ? value * 1_000
          : unit === 'MHz' ? value * 1_000_000 : value;
        onUpdate({ frequency: Math.max(0.1, Math.min(25_000_000, hz)), editingField: null });
        break;
      }
      case 'ampl': {
        const vpp = unit === 'Vrms' ? value * 2 * Math.sqrt(2) : value;
        onUpdate({ amplitude: Math.max(0.002, Math.min(20, vpp)), editingField: null });
        break;
      }
      case 'ofst':
        onUpdate({ offset: Math.max(-10, Math.min(10, value)), editingField: null });
        break;
      case 'duty':
        onUpdate({ dutyCycle: Math.max(0.01, Math.min(0.99, value / 100)), editingField: null });
        break;
    }
  }, [state.editingField, onUpdate]);

  // Scroll (step naik/turun)
  const scrollField = useCallback((dir: 1 | -1) => {
    switch (state.editingField) {
      case 'freq': {
        const step = state.frequency >= 1_000_000 ? 100_000
          : state.frequency >= 1_000 ? 1_000 : 100;
        onUpdate({ frequency: Math.max(0.1, state.frequency + dir * step) });
        break;
      }
      case 'ampl':
        onUpdate({ amplitude: Math.max(0.002, Math.min(20, state.amplitude + dir * 0.1)) });
        break;
      case 'ofst':
        onUpdate({ offset: Math.max(-10, Math.min(10, state.offset + dir * 0.1)) });
        break;
      case 'duty':
        onUpdate({ dutyCycle: Math.max(0.01, Math.min(0.99, state.dutyCycle + dir * 0.05)) });
        break;
    }
  }, [state, onUpdate]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 5,
      padding: '6px 8px',
    }}>

      {/* Row 1: Function keys */}
      <div style={{ display: 'flex', gap: 3 }}>
        <Key label="FUNC"  onClick={cycleWaveform} color="#1E3A5F" textColor="#93C5FD" width={36} />
        <Key label="FREQ"  onClick={() => onFieldSelect('freq')}  color={state.editingField === 'freq'  ? '#1C1917' : '#1F2937'} textColor={state.editingField === 'freq'  ? '#FDBA74' : '#D1D5DB'} />
        <Key label="AMPL"  onClick={() => onFieldSelect('ampl')}  color={state.editingField === 'ampl'  ? '#1C1917' : '#1F2937'} textColor={state.editingField === 'ampl'  ? '#FDBA74' : '#D1D5DB'} />
        <Key label="OFST"  onClick={() => onFieldSelect('ofst')}  color={state.editingField === 'ofst'  ? '#1C1917' : '#1F2937'} textColor={state.editingField === 'ofst'  ? '#FDBA74' : '#D1D5DB'} />
        <Key label="DUTY"  onClick={() => onFieldSelect('duty')}  color={state.editingField === 'duty'  ? '#1C1917' : '#1F2937'} textColor={state.editingField === 'duty'  ? '#FDBA74' : '#D1D5DB'} disabled={state.waveform !== 'square' && state.waveform !== 'ramp'} />
      </div>

      {/* Row 2: Numpad + scroll wheel */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
        {/* Numpad 3×4 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 32px)', gap: 2 }}>
          {[7,8,9,4,5,6,1,2,3].map(n => (
            <Key key={n} label={String(n)} onClick={() => {}} width={32} height={26} />
          ))}
          <Key label="+/-" onClick={() => {}} width={32} height={26} />
          <Key label="0"   onClick={() => {}} width={32} height={26} />
          <Key label="."   onClick={() => {}} width={32} height={26} />
        </div>

        {/* Scroll wheel */}
        <ScrollWheel onUp={() => scrollField(1)} onDown={() => scrollField(-1)} />
      </div>

      {/* Row 3: Unit buttons */}
      <div style={{ display: 'flex', gap: 2 }}>
        <Key label="Hz"  sub="Vpp"  onClick={() => applyValue(state.frequency, 'Hz')}  width={36} height={26} />
        <Key label="kHz" sub="Vrms" onClick={() => applyValue(state.frequency, 'kHz')} width={36} height={26} />
        <Key label="MHz" sub="dBm"  onClick={() => applyValue(state.frequency, 'MHz')} width={36} height={26} />
        <Key label="%"              onClick={() => applyValue(state.dutyCycle * 100, '%')} width={26} height={26} />
        {/* Arrow keys */}
        <div style={{ display: 'flex', gap: 2, marginLeft: 4 }}>
          <Key label="◀" onClick={() => scrollField(-1)} width={24} height={26} />
          <Key label="▶" onClick={() => scrollField(1)}  width={24} height={26} />
        </div>
      </div>

      {/* Row 4: Output + Power */}
      <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
        <button
          onClick={() => onUpdate({ isOutputOn: !state.isOutputOn })}
          style={{
            flex: 1, height: 30,
            backgroundColor: state.isOutputOn ? '#14532D' : '#1F2937',
            border: `1px solid ${state.isOutputOn ? '#16A34A' : '#374151'}`,
            borderBottom: '3px solid #0D1117',
            borderRadius: 3, cursor: 'pointer',
            color: state.isOutputOn ? '#86EFAC' : '#9CA3AF',
            fontSize: 10, fontWeight: 600, letterSpacing: '0.05em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}
        >
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            backgroundColor: state.isOutputOn ? '#4ADE80' : '#374151',
            boxShadow: state.isOutputOn ? '0 0 6px #4ADE80' : 'none',
          }} />
          OUTPUT
        </button>

        <button
          onClick={() => onUpdate({ isPowered: !state.isPowered })}
          style={{
            width: 40, height: 30,
            backgroundColor: state.isPowered ? '#7F1D1D' : '#1F2937',
            border: `1px solid ${state.isPowered ? '#DC2626' : '#374151'}`,
            borderBottom: '3px solid #0D1117',
            borderRadius: 3, cursor: 'pointer',
            color: state.isPowered ? '#FCA5A5' : '#6B7280',
            fontSize: 8, fontWeight: 600, letterSpacing: '0.05em',
          }}
        >
          PWR
        </button>
      </div>
    </div>
  );
}