'use client';

import { AFGState } from '../../../types/instruments';
import { WaveformType } from '../../../lib/signal/types';

// Ikon waveform SVG kecil
function WaveformIcon({ type, isActive }: { type: WaveformType; isActive: boolean }) {
  const color = isActive ? '#F97316' : '#374151';
  const w = 20; const h = 12;

  const paths: Record<string, string> = {
    sine:     `M1,6 Q3,1 5,6 Q7,11 9,6 Q11,1 13,6 Q15,11 17,6 Q19,1 ${w},6`,
    square:   `M1,10 L1,3 L6,3 L6,10 L11,10 L11,3 L16,3 L16,10 L${w},10`,
    ramp:     `M1,10 L8,3 L8,10 L15,3 L15,10 L${w},3`,
    triangle: `M1,10 L5,3 L9,10 L13,3 L17,10`,
    noise:    `M1,6 L3,3 L5,9 L7,4 L9,8 L11,2 L13,7 L15,4 L17,8 L${w},6`,
    arb:      `M1,8 Q4,3 7,7 Q10,11 13,4 Q16,1 ${w},6`,
    dc:       `M1,6 L${w},6`,
  };

  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline
        points={paths[type]?.split(' ').join(' ') ?? ''}
        fill="none"
        stroke={color}
        strokeWidth={isActive ? 1.5 : 1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Menggunakan path sederhana lewat polyline
function WaveIcon({ type, isActive }: { type: string; isActive: boolean }) {
  const color = isActive ? '#F97316' : '#2D3748';
  const size = 22;
  return (
    <div style={{
      width: size + 4, height: size,
      border: `1px solid ${isActive ? '#7C3AED' : '#1F2937'}`,
      borderRadius: 2,
      backgroundColor: isActive ? '#1A0A30' : '#0D1117',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 2,
    }}>
      <svg width={size} height={size - 4}>
        {type === 'sine' && <path d={`M0,${(size-4)/2} Q3,2 6,${(size-4)/2} Q9,${size-6} 12,${(size-4)/2} Q15,2 18,${(size-4)/2}`}
          fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />}
        {type === 'square' && <path d={`M0,${size-6} L0,2 L6,2 L6,${size-6} L12,${size-6} L12,2 L18,2 L18,${size-6}`}
          fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
        {type === 'ramp' && <path d={`M0,${size-6} L9,2 L9,${size-6} L18,2`}
          fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
        {type === 'triangle' && <path d={`M0,${size-6} L5,2 L9,${size-6} L14,2 L18,${size-6}`}
          fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
        {type === 'noise' && <path d={`M0,${(size-4)/2} L2,3 L4,${size-6} L6,5 L8,${size-6} L10,2 L12,${size-5} L14,4 L16,${size-6} L18,${(size-4)/2}`}
          fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />}
        {type === 'arb' && <path d={`M0,${size-5} Q4,2 8,${(size-4)/2} Q12,${size-4} 18,3`}
          fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />}
      </svg>
    </div>
  );
}

// Format nilai untuk display LCD
function formatFreqDisplay(hz: number): { value: string; unit: string } {
  if (hz >= 1_000_000) return { value: (hz / 1_000_000).toFixed(6), unit: 'MHz' };
  if (hz >= 1_000)     return { value: (hz / 1_000).toFixed(6),     unit: 'kHz' };
  return                      { value: hz.toFixed(6),                unit: 'Hz'  };
}

function formatAmplDisplay(vpp: number, unit: string): { value: string; unit: string } {
  if (unit === 'Vrms') return { value: (vpp / (2 * Math.sqrt(2))).toFixed(4), unit: 'Vrms' };
  if (unit === 'dBm')  return { value: (20 * Math.log10(vpp / 2 / 0.2236)).toFixed(2), unit: 'dBm' };
  return { value: vpp.toFixed(4), unit: 'Vpp' };
}

// LCD number row
function LCDRow({
  label, value, unit, isEditing = false,
}: {
  label: string; value: string; unit: string; isEditing?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline',
      justifyContent: 'space-between',
      padding: '2px 4px',
      backgroundColor: isEditing ? 'rgba(124,58,237,0.08)' : 'transparent',
      borderRadius: 2,
      borderLeft: isEditing ? '2px solid #7C3AED' : '2px solid transparent',
    }}>
      <span style={{ fontSize: 8, color: '#6B7280', width: 28, flexShrink: 0 }}>{label}</span>
      <span style={{
        fontSize: 18,
        fontFamily: '"Courier New", monospace',
        fontWeight: 'bold',
        color: isEditing ? '#FDBA74' : '#F97316',
        letterSpacing: '0.05em',
        textShadow: '0 0 8px rgba(249,115,22,0.4)',
        lineHeight: 1,
      }}>
        {value}
      </span>
      <span style={{ fontSize: 10, color: '#9A3412', minWidth: 32, textAlign: 'right' }}>
        {unit}
      </span>
    </div>
  );
}

interface FGDisplayProps {
  state: AFGState;
  onFieldSelect: (field: AFGState['editingField']) => void;
}

export default function FGDisplay({ state, onFieldSelect }: FGDisplayProps) {
  const WAVEFORMS: WaveformType[] = ['sine', 'square', 'ramp', 'triangle', 'noise', 'arb'];
  const freq = formatFreqDisplay(state.frequency);
  const ampl = formatAmplDisplay(state.amplitude, state.amplitudeUnit);

  return (
    <div style={{
      backgroundColor: '#0A0500',
      border: '1px solid #1A0800',
      borderRadius: 3,
      padding: 6,
      minWidth: 200,
      boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)',
    }}>

      {/* Waveform selector row */}
      <div style={{ display: 'flex', gap: 3, marginBottom: 6, alignItems: 'center' }}>
        {WAVEFORMS.map(w => (
          <WaveIcon key={w} type={w} isActive={state.waveform === w} />
        ))}
        {/* ARB */}
        <div style={{
          fontSize: 8, color: state.waveform === 'arb' ? '#F97316' : '#374151',
          border: `1px solid ${state.waveform === 'arb' ? '#7C3AED' : '#1F2937'}`,
          padding: '1px 3px', borderRadius: 2,
          backgroundColor: state.waveform === 'arb' ? '#1A0A30' : '#0D1117',
        }}>
          ARB
        </div>
      </div>

      <div style={{ height: 1, backgroundColor: '#1A0800', marginBottom: 5 }} />

      {/* Frequency row */}
      <div onClick={() => onFieldSelect('freq')} style={{ cursor: 'pointer' }}>
        <LCDRow
          label="FREQ"
          value={freq.value}
          unit={freq.unit}
          isEditing={state.editingField === 'freq'}
        />
      </div>

      {/* Secondary parameter (AMPL / OFST / DUTY) */}
      <div onClick={() => onFieldSelect('ampl')} style={{ cursor: 'pointer' }}>
        <LCDRow
          label="AMPL"
          value={ampl.value}
          unit={ampl.unit}
          isEditing={state.editingField === 'ampl'}
        />
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        <div onClick={() => onFieldSelect('ofst')} style={{ cursor: 'pointer', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '2px 4px' }}>
            <span style={{ fontSize: 8, color: '#6B7280' }}>OFST</span>
            <span style={{ fontSize: 12, fontFamily: 'monospace', color: state.editingField === 'ofst' ? '#FDBA74' : '#92400E' }}>
              {state.offset.toFixed(3)}
            </span>
            <span style={{ fontSize: 8, color: '#78350F' }}>V</span>
          </div>
        </div>

        {(state.waveform === 'square' || state.waveform === 'ramp') && (
          <div onClick={() => onFieldSelect('duty')} style={{ cursor: 'pointer', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '2px 4px' }}>
              <span style={{ fontSize: 8, color: '#6B7280' }}>DUTY</span>
              <span style={{ fontSize: 12, fontFamily: 'monospace', color: state.editingField === 'duty' ? '#FDBA74' : '#92400E' }}>
                {(state.dutyCycle * 100).toFixed(1)}
              </span>
              <span style={{ fontSize: 8, color: '#78350F' }}>%</span>
            </div>
          </div>
        )}
      </div>

      {/* Output status */}
      <div style={{
        marginTop: 4, display: 'flex', alignItems: 'center', gap: 6,
        padding: '2px 4px',
        backgroundColor: state.isOutputOn ? 'rgba(20,83,45,0.3)' : 'transparent',
        borderRadius: 2,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          backgroundColor: state.isOutputOn ? '#4ADE80' : '#374151',
          boxShadow: state.isOutputOn ? '0 0 4px #4ADE80' : 'none',
        }} />
        <span style={{ fontSize: 8, color: state.isOutputOn ? '#4ADE80' : '#4B5563' }}>
          {state.isOutputOn ? 'OUTPUT ON' : 'OUTPUT OFF'}
        </span>
        <span style={{ fontSize: 8, color: '#374151', marginLeft: 'auto' }}>
          {state.outputImpedance}
        </span>
      </div>
    </div>
  );
}