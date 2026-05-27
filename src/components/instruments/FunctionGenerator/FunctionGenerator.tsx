'use client';

import { useEffect, useCallback } from 'react';
import FGDisplay from './FGDisplay';
import FGKeypad from './FGKeypad';
import BNCPort from '../../ui/BNCPort';
import { useWorkbenchStore } from '../../../store/workbenchStore';
import { useSignalStore } from '../../../store/signalStore';
import { AFGState } from '../../../types/instruments';
import { DEFAULT_SIGNAL_PARAMS } from '../../../lib/signal/types';

interface FunctionGeneratorProps {
  instanceId: 'afg1' | 'afg2';
}

export default function FunctionGenerator({ instanceId }: FunctionGeneratorProps) {
  const state     = useWorkbenchStore(s => s[instanceId]);
  const updateAFG = useWorkbenchStore(s => s.updateAFG);
  const { computeSignal, clearSignal } = useSignalStore();

  const PORT_MAIN = `${instanceId}_main_out`;
  const PORT_SYNC = `${instanceId}_sync_out`;

  const onUpdate = useCallback((patch: Partial<AFGState>) => {
    updateAFG(instanceId, patch);
  }, [instanceId, updateAFG]);

  const onFieldSelect = useCallback((field: AFGState['editingField']) => {
    onUpdate({ editingField: field });
  }, [onUpdate]);

  // Recompute sinyal setiap kali parameter berubah
  useEffect(() => {
    if (!state.isPowered || !state.isOutputOn) {
      clearSignal(PORT_MAIN);
      clearSignal(PORT_SYNC);
      return;
    }

    const params = {
      ...DEFAULT_SIGNAL_PARAMS,
      waveform:   state.waveform,
      frequency:  state.frequency,
      amplitude:  state.amplitude,
      offset:     state.offset,
      dutyCycle:  state.dutyCycle,
      phase:      0,
      sampleRate: 100_000,
    };

    computeSignal(PORT_MAIN, params);

    // SYNC = square 50% duty, frekuensi sama
    computeSignal(PORT_SYNC, { ...params, waveform: 'square', dutyCycle: 0.5 });

  }, [
    state.isPowered, state.isOutputOn, state.waveform,
    state.frequency, state.amplitude, state.offset, state.dutyCycle,
    PORT_MAIN, PORT_SYNC, computeSignal, clearSignal,
  ]);

  const cables   = useWorkbenchStore(s => s.cables);
  const mainConn = cables.find((c: any) => c.fromPortId === PORT_MAIN);
  const syncConn = cables.find((c: any) => c.fromPortId === PORT_SYNC);

  const label = instanceId === 'afg1' ? '①' : '②';

  return (
    <div style={{
      display: 'inline-flex',
      flexDirection: 'column',
      backgroundColor: '#D1D5DB',
      border: '2px solid #9CA3AF',
      borderRadius: 6,
      overflow: 'hidden',
      boxShadow: '0 6px 24px rgba(0,0,0,0.5)',
      userSelect: 'none',
      minWidth: 460,
    }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 10px',
        backgroundColor: '#B8BEC8',
        borderBottom: '1px solid #9CA3AF',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 9, color: '#374151', letterSpacing: '0.08em', fontWeight: 600 }}>
            GW INSTEK {label}
          </span>
          <span style={{ fontSize: 10, color: '#1F2937', fontWeight: 500 }}>
            Arbitrary Function Generator
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <span style={{ fontSize: 9, color: '#374151', fontFamily: 'monospace' }}>AFG-2025</span>
          {/* Power LED */}
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            backgroundColor: state.isPowered ? '#4ADE80' : '#6B7280',
            boxShadow: state.isPowered ? '0 0 6px #4ADE80' : 'none',
            transition: 'all 0.2s',
          }} />
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', alignItems: 'stretch', backgroundColor: '#C5CBD4' }}>

        {/* LCD section */}
        <div style={{
          padding: 8,
          backgroundColor: '#B0B6C0',
          borderRight: '2px solid #9CA3AF',
          display: 'flex', alignItems: 'center',
          minWidth: 220,
        }}>
          <FGDisplay state={state} onFieldSelect={onFieldSelect} />
        </div>

        {/* Keypad section */}
        <div style={{ flex: 1, backgroundColor: '#C5CBD4' }}>
          <FGKeypad state={state} onUpdate={onUpdate} onFieldSelect={onFieldSelect} />
        </div>

        {/* BNC Ports section */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '8px 10px', gap: 12,
          backgroundColor: '#B0B6C0',
          borderLeft: '2px solid #9CA3AF',
          minWidth: 60,
        }}>
          {/* SYNC OUTPUT */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <BNCPort
              portId={PORT_SYNC}
              size={20}
              isConnected={!!syncConn}
              isOutput={true}
              disabled={!state.isPowered}
            />
            <span style={{ fontSize: 7, color: '#374151', textAlign: 'center', lineHeight: 1.2 }}>
              OUTPUT<br/>SYNC
            </span>
          </div>

          <div style={{ height: 1, width: 36, backgroundColor: '#9CA3AF' }} />

          {/* MAIN OUTPUT */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <BNCPort
              portId={PORT_MAIN}
              size={24}
              isConnected={!!mainConn}
              isOutput={true}
              disabled={!state.isPowered || !state.isOutputOn}
            />
            <span style={{ fontSize: 7, color: '#374151', textAlign: 'center', lineHeight: 1.2 }}>
              MAIN<br/>OUTPUT
            </span>
            <span style={{ fontSize: 6.5, color: '#6B7280' }}>50Ω</span>
          </div>
        </div>
      </div>

      {/* Bottom info bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '3px 10px',
        backgroundColor: '#9CA3AF',
        fontSize: 8, color: '#374151',
        fontFamily: 'monospace',
      }}>
        <span>0.1Hz ~ 25MHz</span>
        <span>·</span>
        <span>1mVpp ~ 20Vpp</span>
        <span>·</span>
        <span>DDS 25MHz</span>
        {state.isOutputOn && (
          <>
            <span>·</span>
            <span style={{ color: '#14532D', fontWeight: 600 }}>
              ● {(state.frequency >= 1e6
                ? `${(state.frequency/1e6).toFixed(3)}MHz`
                : state.frequency >= 1e3
                ? `${(state.frequency/1e3).toFixed(3)}kHz`
                : `${state.frequency.toFixed(1)}Hz`
              )} {state.amplitude.toFixed(2)}Vpp
            </span>
          </>
        )}
      </div>
    </div>
  );
}