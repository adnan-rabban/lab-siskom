'use client';

import { useMemo } from 'react';
import { useModuleStore } from '../../store/moduleStore';
import { useWorkbenchStore } from '../../store/workbenchStore';
import { useSignalStore } from '../../store/signalStore';
import { measureAll, formatFrequency, formatVoltage } from '../../lib/signal/utils';

const SAMPLE_RATE = 100_000;

export default function SignalMonitor() {
  const { isSignalMonitorOpen, toggleSignalMonitor } = useModuleStore();
  const cables  = useWorkbenchStore(s => s.cables);
  const signals = useSignalStore(s => s.signals);

  // Cari sinyal dari port yang terhubung ke CH1 dan CH2 osiloskop
  const ch1Cable = cables.find((c: any) => c.toPortId === 'osc_ch1');
  const ch2Cable = cables.find((c: any) => c.toPortId === 'osc_ch2');

  const ch1Sig = ch1Cable ? signals[ch1Cable.fromPortId] : null;
  const ch2Sig = ch2Cable ? signals[ch2Cable.fromPortId] : null;

  const m1 = useMemo(
    () => ch1Sig?.samples ? measureAll(ch1Sig.samples, SAMPLE_RATE) : null,
    [ch1Sig]
  );
  const m2 = useMemo(
    () => ch2Sig?.samples ? measureAll(ch2Sig.samples, SAMPLE_RATE) : null,
    [ch2Sig]
  );

  // Floating pill (compact)
  if (!isSignalMonitorOpen) {
    return (
      <button
        onClick={toggleSignalMonitor}
        style={{
          position: 'absolute',
          bottom: 52,
          right: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          backgroundColor: 'rgba(15,23,42,0.9)',
          border: '1px solid #1E293B',
          borderRadius: 20,
          padding: '5px 12px',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          zIndex: 50,
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}
      >
        {/* CH1 mini */}
        {m1 ? (
          <span style={{ fontSize: 10, color: '#FACC15', fontFamily: 'monospace' }}>
            CH1 {formatFrequency(m1.frequency).replace(' ', '')}
          </span>
        ) : (
          <span style={{ fontSize: 10, color: '#374151' }}>CH1 —</span>
        )}

        <span style={{ color: '#1E293B' }}>|</span>

        {/* CH2 mini */}
        {m2 ? (
          <span style={{ fontSize: 10, color: '#60A5FA', fontFamily: 'monospace' }}>
            CH2 {formatFrequency(m2.frequency).replace(' ', '')}
          </span>
        ) : (
          <span style={{ fontSize: 10, color: '#374151' }}>CH2 —</span>
        )}

        <span style={{ fontSize: 9, color: '#475569', marginLeft: 2 }}>▲</span>
      </button>
    );
  }

  // Panel expanded
  return (
    <div style={{
      position: 'absolute',
      bottom: 52,
      right: 16,
      width: 220,
      backgroundColor: 'rgba(8,13,16,0.95)',
      border: '1px solid #1E293B',
      borderRadius: 10,
      overflow: 'hidden',
      boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
      backdropFilter: 'blur(12px)',
      zIndex: 50,
      fontFamily: 'monospace',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 10px',
        backgroundColor: '#0B1222',
        borderBottom: '1px solid #1E293B',
      }}>
        <span style={{ fontSize: 10, color: '#475569', letterSpacing: '0.06em' }}>
          SIGNAL MONITOR
        </span>
        <button
          onClick={toggleSignalMonitor}
          style={{
            backgroundColor: 'transparent', border: 'none',
            color: '#475569', cursor: 'pointer', fontSize: 10,
          }}
        >
          ▼
        </button>
      </div>

      {/* CH1 */}
      <ChannelBlock
        label="CH1" color="#FACC15"
        m={m1}
        connected={!!ch1Cable}
      />

      <div style={{ height: 1, backgroundColor: '#0F1A2B' }} />

      {/* CH2 */}
      <ChannelBlock
        label="CH2" color="#60A5FA"
        m={m2}
        connected={!!ch2Cable}
      />

      {/* GFC reading */}
      {(() => {
        const gfcCable = cables.find((c: any) => c.toPortId === 'gfc_input');
        const gfcSig = gfcCable ? signals[gfcCable.fromPortId] : null;
        const gfcFreq = gfcSig?.samples
          ? measureAll(gfcSig.samples, SAMPLE_RATE).frequency
          : null;

        if (!gfcFreq) return null;

        return (
          <>
            <div style={{ height: 1, backgroundColor: '#0F1A2B' }} />
            <div style={{ padding: '6px 10px' }}>
              <div style={{ fontSize: 9, color: '#6B7280', marginBottom: 3 }}>GFC</div>
              <div style={{ fontSize: 12, color: '#FF4500' }}>
                {formatFrequency(gfcFreq)}
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}

// Satu channel block
function ChannelBlock({
  label, color, m, connected,
}: {
  label: string; color: string;
  m: ReturnType<typeof measureAll> | null;
  connected: boolean;
}) {
  return (
    <div style={{ padding: '8px 10px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5,
      }}>
        <div style={{
          width: 22, height: 3, borderRadius: 2,
          backgroundColor: connected ? color : '#1E293B',
        }} />
        <span style={{ fontSize: 10, color: connected ? color : '#374151' }}>
          {label}
        </span>
        {!connected && (
          <span style={{ fontSize: 9, color: '#374151' }}>— tidak terhubung</span>
        )}
      </div>

      {m && connected ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 8px' }}>
          {[
            { k: 'Freq',  v: formatFrequency(m.frequency) },
            { k: 'Vpp',   v: formatVoltage(m.vpp) },
            { k: 'Vrms',  v: formatVoltage(m.vrms) },
            { k: 'Duty',  v: `${m.dutyCycle.toFixed(1)}%` },
          ].map(({ k, v }) => (
            <div key={k}>
              <div style={{ fontSize: 8, color: '#475569' }}>{k}</div>
              <div style={{ fontSize: 11, color: '#E2E8F0' }}>{v}</div>
            </div>
          ))}
        </div>
      ) : connected ? (
        <div style={{ fontSize: 10, color: '#374151' }}>Tidak ada sinyal</div>
      ) : null}
    </div>
  );
}