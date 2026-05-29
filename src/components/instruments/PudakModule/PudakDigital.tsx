'use client';

import { useState } from 'react';
import BNCPort from '../../ui/BNCPort';
import { useWorkbenchStore } from '../../../store/workbenchStore';

interface BitPattern {
  bits: boolean[]; // 8 bit
}

const DEFAULT_PATTERN: BitPattern = { bits: Array(8).fill(false) };

type DataMode = 'MANUAL' | 'ADC';

export default function PudakDigital() {
  const [isPowered, setIsPowered]   = useState(false);
  const [pattern, setPattern]       = useState<BitPattern>(DEFAULT_PATTERN);
  const [mode, setMode]             = useState<DataMode>('MANUAL');
  const [dataBits, setDataBits]     = useState<8 | 16>(8);
  const cables = useWorkbenchStore(s => s.cables);

  const isAnalogIn  = cables.some((c: any) => c.toPortId === 'pudak_input_a');
  const isNrzOut    = cables.some((c: any) => c.fromPortId === 'pudak_output');
  const isClockOut  = cables.some((c: any) => c.fromPortId === 'pudak_clock_out');

  const toggleBit = (i: number) => {
    const next = [...pattern.bits];
    next[i] = !next[i];
    setPattern({ bits: next });
  };

  const decimalValue = pattern.bits.reduce(
    (acc, b, i) => acc + (b ? Math.pow(2, 7 - i) : 0), 0
  );

  return (
    <div style={{
      display: 'inline-flex', flexDirection: 'column',
      backgroundColor: '#C8CDD6', border: '2px solid #9CA3AF',
      borderRadius: 6, overflow: 'hidden',
      boxShadow: '0 6px 24px rgba(0,0,0,0.4)',
      userSelect: 'none', minWidth: 520,
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
            Data Source + Receiver
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 8, color: '#6B7280', fontFamily: 'monospace' }}>
            PTE-001-01/05
          </span>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            backgroundColor: isPowered ? '#4ADE80' : '#6B7280',
            boxShadow: isPowered ? '0 0 6px #4ADE80' : 'none',
          }} />
        </div>
      </div>

      <div style={{ display: 'flex' }}>

        {/* Data Source panel */}
        <div style={{
          flex: 1, padding: '8px 10px',
          borderRight: '1px solid #9CA3AF',
        }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            DATA SOURCE PTE-001-01
          </div>

          {/* Mode selector */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {(['MANUAL', 'ADC'] as DataMode[]).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                padding: '2px 8px', fontSize: 8,
                backgroundColor: mode === m ? '#1E3A5F' : '#D1D5DB',
                color: mode === m ? '#93C5FD' : '#374151',
                border: `1px solid ${mode === m ? '#3B82F6' : '#9CA3AF'}`,
                borderRadius: 2, cursor: 'pointer',
              }}>
                {m}
              </button>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              {([8, 16] as const).map(n => (
                <button key={n} onClick={() => setDataBits(n)} style={{
                  padding: '2px 6px', fontSize: 8,
                  backgroundColor: dataBits === n ? '#1F2937' : '#D1D5DB',
                  color: dataBits === n ? '#F9FAFB' : '#374151',
                  border: '1px solid #9CA3AF',
                  borderRadius: 2, cursor: 'pointer',
                }}>
                  {n}bit
                </button>
              ))}
            </div>
          </div>

          {/* 8-bit pattern toggle buttons */}
          <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
            {pattern.bits.map((bit, i) => (
              <button
                key={i}
                onClick={() => mode === 'MANUAL' && toggleBit(i)}
                disabled={mode !== 'MANUAL' || !isPowered}
                style={{
                  width: 28, height: 28,
                  backgroundColor: bit ? '#14532D' : '#1F2937',
                  border: `1px solid ${bit ? '#16A34A' : '#374151'}`,
                  borderRadius: 3, cursor: mode === 'MANUAL' ? 'pointer' : 'default',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 2,
                  opacity: isPowered ? 1 : 0.5,
                }}
              >
                {/* LED */}
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  backgroundColor: bit && isPowered ? '#4ADE80' : '#374151',
                  boxShadow: bit && isPowered ? '0 0 4px #4ADE80' : 'none',
                }} />
                <span style={{ fontSize: 7, color: bit ? '#86EFAC' : '#6B7280' }}>
                  {7 - i}
                </span>
              </button>
            ))}
          </div>

          {/* Bit pattern display */}
          <div style={{
            backgroundColor: '#0D1117', borderRadius: 3,
            padding: '4px 8px', fontFamily: 'monospace',
            border: '1px solid #1F2937',
          }}>
            <span style={{ fontSize: 10, color: '#4ADE80' }}>
              {pattern.bits.map(b => b ? '1' : '0').join('')}
            </span>
            <span style={{ fontSize: 9, color: '#6B7280', marginLeft: 8 }}>
              = {decimalValue} (dec)
            </span>
          </div>

          {/* ADC Analog Input */}
          {mode === 'ADC' && (
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BNCPort portId="pudak_input_a" label="ANALOG IN" labelPosition="right"
                size={14} isConnected={isAnalogIn} isOutput={false} disabled={!isPowered} />
              <span style={{ fontSize: 7, color: '#6B7280' }}>ADC 8-bit</span>
            </div>
          )}

          {/* Output ports */}
          <div style={{ marginTop: 8, display: 'flex', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <BNCPort portId="pudak_output" size={14} isOutput={true}
                isConnected={isNrzOut} disabled={!isPowered} />
              <span style={{ fontSize: 7, color: '#4ADE80' }}>NRZ DATA</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <BNCPort portId="pudak_clock_out" size={14} isOutput={true}
                isConnected={isClockOut} disabled={!isPowered} />
              <span style={{ fontSize: 7, color: '#F59E0B' }}>BIT CLK</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <BNCPort portId="pudak_mod_out" size={14} isOutput={true}
                isConnected={cables.some((c: any) => c.fromPortId === 'pudak_mod_out')}
                disabled={!isPowered} />
              <span style={{ fontSize: 7, color: '#A78BFA' }}>WORD CLK</span>
            </div>
          </div>
        </div>

        {/* Data Receiver panel */}
        <div style={{ padding: '8px 10px', minWidth: 120 }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            DATA RECEIVER PTE-001-05
          </div>

          {/* Received bit display */}
          <div style={{
            backgroundColor: '#0D1117', borderRadius: 3,
            padding: '6px 8px', fontFamily: 'monospace', marginBottom: 6,
          }}>
            <div style={{ fontSize: 8, color: '#6B7280', marginBottom: 2 }}>Received:</div>
            <span style={{ fontSize: 10, color: isPowered ? '#60A5FA' : '#374151' }}>
              {isPowered ? pattern.bits.map(b => b ? '1' : '0').join('') : '--------'}
            </span>
          </div>

          {/* LED array (received bits) */}
          <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
            {pattern.bits.map((bit, i) => (
              <div key={i} style={{
                width: 12, height: 12, borderRadius: '50%',
                backgroundColor: bit && isPowered ? '#60A5FA' : '#1F2937',
                border: '1px solid #374151',
              }} />
            ))}
          </div>

          {/* DAC output */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <BNCPort portId="pudak_filter1" size={14} isOutput={true}
              isConnected={cables.some((c: any) => c.fromPortId === 'pudak_filter1')}
              disabled={!isPowered} />
            <span style={{ fontSize: 7, color: '#10B981' }}>ANALOG OUT</span>
            <span style={{ fontSize: 6, color: '#6B7280' }}>(DAC)</span>
          </div>

          {/* Power */}
          <button
            onClick={() => setIsPowered(v => !v)}
            style={{
              marginTop: 12, width: '100%', padding: '4px',
              fontSize: 8, fontWeight: 600,
              backgroundColor: isPowered ? '#7F1D1D' : '#1F2937',
              color: isPowered ? '#FCA5A5' : '#9CA3AF',
              border: `1px solid ${isPowered ? '#DC2626' : '#374151'}`,
              borderRadius: 3, cursor: 'pointer',
            }}
          >
            {isPowered ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Spec bar */}
      <div style={{
        padding: '3px 10px', backgroundColor: '#9CA3AF',
        fontSize: 8, color: '#374151', fontFamily: 'monospace',
        display: 'flex', gap: 8,
      }}>
        <span>8-bit ADC/DAC</span><span>·</span>
        <span>NRZ serial data</span><span>·</span>
        <span>Parallel → Serial converter</span>
      </div>
    </div>
  );
}