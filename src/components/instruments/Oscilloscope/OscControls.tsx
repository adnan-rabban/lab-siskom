'use client';

import Knob from '../../ui/Knob';
import { ToggleButton, PanelButton, SelectorButton } from '../../ui/ToggleButton';
import {
  OscState, OscChannelState,
  VOLTS_PER_DIV_STEPS, TIME_PER_DIV_STEPS,
} from '../../../types/instruments';

// Formatter
function fmtVolts(v: number): string {
  return v < 1 ? `${(v * 1000).toFixed(0)}mV` : `${v}V`;
}
function fmtTime(s: number): string {
  if (s < 1e-6) return `${(s * 1e9).toFixed(0)}ns`;
  if (s < 1e-3) return `${(s * 1e6).toFixed(0)}μs`;
  if (s < 1)    return `${(s * 1e3).toFixed(0)}ms`;
  return `${s}s`;
}

interface OscControlsProps {
  state: OscState;
  onUpdate: (patch: Partial<OscState>) => void;
}

// Channel strip kiri 
function ChannelStrip({
  ch, color, state, onUpdate,
}: {
  ch: 'ch1' | 'ch2';
  color: string;
  state: OscChannelState;
  onUpdate: (patch: Partial<OscChannelState>) => void;
}) {
  const label = ch === 'ch1' ? 'CH1' : 'CH2';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      {/* Channel enable toggle */}
      <ToggleButton
        label={label}
        isOn={state.isEnabled}
        onToggle={() => onUpdate({ isEnabled: !state.isEnabled })}
        ledColor={color}
        width={42}
      />

      {/* VOLTS/DIV */}
      <Knob
        value={state.voltsPerDiv}
        min={0.002}
        max={10}
        steps={VOLTS_PER_DIV_STEPS}
        size={40}
        label="V/DIV"
        color={color}
        formatValue={fmtVolts}
        onChange={v => onUpdate({ voltsPerDiv: v })}
        disabled={!state.isEnabled}
      />

      {/* POSITION */}
      <Knob
        value={state.position}
        min={-4}
        max={4}
        step={0.1}
        size={32}
        label="POS"
        color={color}
        formatValue={v => `${v.toFixed(1)}`}
        onChange={v => onUpdate({ position: v })}
        disabled={!state.isEnabled}
      />

      {/* Coupling selector */}
      <SelectorButton
        options={['AC', 'DC', 'GND'] as const}
        value={state.coupling}
        onChange={c => onUpdate({ coupling: c })}
        width={42}
        disabled={!state.isEnabled}
      />

      {/* Probe attenuation */}
      <SelectorButton<1 | 10>
        options={[1, 10] as (1 | 10)[]}
        value={state.probeAttenuation}
        onChange={(p: 1 | 10) => onUpdate({ probeAttenuation: p })}
        width={42}
        renderOption={(p: 1 | 10) => <span style={{ fontSize: 9, color: '#D1D5DB' }}>×{p}</span>}
        disabled={!state.isEnabled}
      />
    </div>
  );
}

// Main OscControls
export default function OscControls({ state, onUpdate }: OscControlsProps) {
  const updCh1 = (p: Partial<OscChannelState>) =>
    onUpdate({ ch1: { ...state.ch1, ...p } });
  const updCh2 = (p: Partial<OscChannelState>) =>
    onUpdate({ ch2: { ...state.ch2, ...p } });

  return (
    <div style={{
      display: 'flex',
      gap: 0,
      height: '100%',
    }}>
      {/* Kiri: CH1 strip */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 6px',
        gap: 4,
        borderRight: '1px solid #1F2937',
        minWidth: 54,
      }}>
        <ChannelStrip ch="ch1" color="#FACC15" state={state.ch1} onUpdate={updCh1} />
      </div>

      {/* Kanan: Horizontal + Trigger + Action buttons */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '8px 6px',
        gap: 8,
        borderLeft: '1px solid #1F2937',
        minWidth: 54,
      }}>

        {/* CH2 strip */}
        <ChannelStrip ch="ch2" color="#60A5FA" state={state.ch2} onUpdate={updCh2} />

        <div style={{ height: 1, background: '#1F2937', margin: '2px 0' }} />

        {/* TIME/DIV */}
        <Knob
          value={state.timePerDiv}
          min={1e-9}
          max={50}
          steps={TIME_PER_DIV_STEPS}
          size={40}
          label="T/DIV"
          color="#A78BFA"
          formatValue={fmtTime}
          onChange={v => onUpdate({ timePerDiv: v })}
        />

        {/* TRIGGER LEVEL */}
        <Knob
          value={state.triggerLevel}
          min={-10}
          max={10}
          step={0.1}
          size={36}
          label="LEVEL"
          color="#F87171"
          formatValue={v => `${v.toFixed(1)}V`}
          onChange={v => onUpdate({ triggerLevel: v })}
        />

        {/* TRIGGER SOURCE */}
        <SelectorButton
          options={['CH1', 'CH2', 'EXT'] as const}
          value={state.triggerSource as 'CH1' | 'CH2' | 'EXT'}
          onChange={s => onUpdate({ triggerSource: s })}
          label="TRIG"
          width={46}
        />
      </div>
    </div>
  );
}

// Action buttons bar (bawah)
export function OscActionBar({
  state, onUpdate,
}: {
  state: OscState;
  onUpdate: (patch: Partial<OscState>) => void;
}) {
  return (
    <div style={{
      display: 'flex',
      gap: 4,
      padding: '4px 8px',
      backgroundColor: '#0F172A',
      borderTop: '1px solid #1F2937',
      flexWrap: 'wrap',
      alignItems: 'center',
    }}>
      <PanelButton
        label="Autoset"
        onClick={() => onUpdate({ isAutosetting: true })}
        width={54}
        color="#374151"
      />
      <ToggleButton
        label="Run"
        subLabel={state.isRunning ? 'Running' : 'Stopped'}
        isOn={state.isRunning}
        onToggle={() => onUpdate({ isRunning: !state.isRunning })}
        ledColor="#4ADE80"
        variant="runstop"
        width={48}
      />
      <PanelButton
        label="Single"
        onClick={() => onUpdate({ isRunning: false })}
        width={46}
      />
      <div style={{ width: 1, height: 24, background: '#1F2937', margin: '0 2px' }} />
      <PanelButton
        label="Measure"
        onClick={() => onUpdate({ isMeasureOpen: !state.isMeasureOpen })}
        width={52}
        isActive={state.isMeasureOpen}
      />
      <PanelButton
        label="Cursor"
        onClick={() => onUpdate({ isCursorActive: !state.isCursorActive })}
        width={48}
        isActive={state.isCursorActive}
      />
      <div style={{ width: 1, height: 24, background: '#1F2937', margin: '0 2px' }} />
      <SelectorButton
        options={['Normal', 'PeakDetect', 'Average'] as const}
        value={state.acquisitionMode}
        onChange={m => onUpdate({ acquisitionMode: m })}
        width={64}
      />
    </div>
  );
}