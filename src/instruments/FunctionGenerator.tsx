import { useState, useCallback } from 'react';
import { useSignalGraph } from '../engine/SignalGraphContext';
import Knob from '../components/Knob';
import ToggleSwitch from '../components/ToggleSwitch';
import SevenSegmentDisplay from '../components/SevenSegment';
import Terminal from '../components/Terminal';
import type { WaveformType } from '../engine/types';

interface FunctionGeneratorProps {
  nodeId: string;
  instanceLabel?: string;
}

function formatFrequency(hz: number): string {
  if (hz >= 1e6) return (hz / 1e6).toFixed(3);
  if (hz >= 1e3) return (hz / 1e3).toFixed(2);
  return hz.toFixed(1);
}

function frequencyUnit(hz: number): string {
  if (hz >= 1e6) return 'MHz';
  if (hz >= 1e3) return 'kHz';
  return 'Hz';
}

// Simple SVG waveform icons
const WaveformIcon = ({ type }: { type: WaveformType }) => {
  const icons: Record<WaveformType, string> = {
    sine: 'M2,7 Q5,0 8,7 Q11,14 14,7',
    square: 'M2,10 L2,4 L8,4 L8,10 L14,10 L14,4',
    triangle: 'M2,10 L5,4 L8,10 L11,4 L14,10',
    sawtooth: 'M2,10 L8,4 L8,10 L14,4',
  };

  return (
    <div className="wave-icon">
      <svg viewBox="0 0 16 14">
        <path d={icons[type]} />
      </svg>
    </div>
  );
};

export default function FunctionGenerator({ nodeId, instanceLabel }: FunctionGeneratorProps) {
  const { state, dispatch, t } = useSignalGraph();
  const node = state.nodes.get(nodeId);
  const isOn = state.powerOn;

  const [enabled, setEnabled] = useState(true);

  const handleFreqChange = useCallback(
    (value: number) => {
      dispatch({
        type: 'UPDATE_NODE_PARAMS',
        nodeId,
        params: { frequency: value },
      });
    },
    [dispatch, nodeId]
  );

  const handleAmpChange = useCallback(
    (value: number) => {
      dispatch({
        type: 'UPDATE_NODE_PARAMS',
        nodeId,
        params: { amplitude: value },
      });
    },
    [dispatch, nodeId]
  );

  const handleWaveformChange = useCallback(
    (wf: WaveformType) => {
      dispatch({
        type: 'UPDATE_NODE_PARAMS',
        nodeId,
        params: { waveform: wf },
      });
    },
    [dispatch, nodeId]
  );

  if (!node) return null;

  const freq = node.params.frequency || 300;
  const amp = node.params.amplitude || 1;
  const wf = (node.params.waveform as WaveformType) || 'sine';

  return (
    <div className={`instrument-panel function-generator ${!isOn ? 'powered-off' : ''}`}>
      <div className="instrument-header">
        <span className="instrument-title">
          {instanceLabel || t('Generator Fungsi', 'Function Generator')}
        </span>
        <ToggleSwitch
          active={enabled}
          onChange={setEnabled}
        />
      </div>

      <div className="instrument-body">
        <div className="freq-counter-display" style={{ marginBottom: 'var(--sp-3)' }}>
          <SevenSegmentDisplay
            value={formatFrequency(freq)}
            unit={frequencyUnit(freq)}
            variant="amber"
            digits={6}
          />
        </div>

        <div className="waveform-selector" style={{ marginBottom: 'var(--sp-3)', justifyContent: 'center' }}>
          {(['sine', 'square', 'triangle'] as WaveformType[]).map(type => (
            <button
              key={type}
              className={`waveform-btn ${wf === type ? 'active' : ''}`}
              onClick={() => handleWaveformChange(type)}
              title={type}
            >
              <WaveformIcon type={type} />
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 'var(--sp-4)', justifyContent: 'center' }}>
          <Knob
            label={t('Frekuensi', 'Frequency')}
            value={freq}
            min={1}
            max={100000}
            step={1}
            onChange={handleFreqChange}
            formatValue={(v) => `${formatFrequency(v)} ${frequencyUnit(v)}`}
          />
          <Knob
            label={t('Amplitudo', 'Amplitude')}
            value={amp}
            min={0}
            max={20}
            step={0.1}
            size="sm"
            onChange={handleAmpChange}
            formatValue={(v) => `${v.toFixed(1)} Vp-p`}
          />
        </div>
      </div>

      <div className="instrument-controls">
        <Terminal id={`${nodeId}-output`} label="OUTPUT" direction="output" connected={false} />
      </div>
    </div>
  );
}
