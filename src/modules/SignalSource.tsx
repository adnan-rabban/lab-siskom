import { useCallback } from 'react';
import { useSignalGraph } from '../engine/SignalGraphContext';
import Knob from '../components/Knob';
import LED from '../components/LED';
import Terminal from '../components/Terminal';

interface SignalSourceProps {
  nodeId: string;
}

function formatFrequency(hz: number): string {
  if (hz >= 1e6) return `${(hz / 1e6).toFixed(2)} MHz`;
  if (hz >= 1e3) return `${(hz / 1e3).toFixed(1)} kHz`;
  return `${hz.toFixed(0)} Hz`;
}

export default function SignalSource({ nodeId }: SignalSourceProps) {
  const { state, dispatch, t } = useSignalGraph();
  const node = state.nodes.get(nodeId);
  const isOn = state.powerOn;

  const handleFreqChange = useCallback(
    (value: number) => {
      dispatch({
        type: 'UPDATE_NODE_PARAMS',
        nodeId,
        params: { frequency: value * 1000 }, // knob shows kHz, store Hz
      });
    },
    [dispatch, nodeId]
  );

  const handleAttenChange = useCallback(
    (value: number) => {
      dispatch({
        type: 'UPDATE_NODE_PARAMS',
        nodeId,
        params: { attenuation: value },
      });
    },
    [dispatch, nodeId]
  );

  if (!node) return null;

  const freq = node.params.frequency || 455000;
  const atten = node.params.attenuation || 0;

  return (
    <div className={`module-panel scanline-overlay signal-source-module ${isOn ? 'powered-on' : 'powered-off'}`}>
      <div className="module-header">
        <span className="module-title">{t('Sumber Sinyal', 'Signal Source')}</span>
        <span className="module-label-badge">{node.label}</span>
      </div>
      <div className="module-controls">
        <div className="module-control-row">
          <span className="module-control-label">{t('Frekuensi', 'Freq')}</span>
          <Knob
            label="C"
            value={freq / 1000}
            min={100}
            max={1000}
            step={5}
            onChange={handleFreqChange}
            formatValue={(v) => formatFrequency(v * 1000)}
          />
        </div>
        <div className="module-control-row">
          <span className="module-control-label">{t('Pelemahan', 'Atten')}</span>
          <Knob
            label="dB"
            value={atten}
            min={-40}
            max={0}
            step={1}
            size="sm"
            onChange={handleAttenChange}
            formatValue={(v) => `${v} dB`}
          />
        </div>
        <div className="module-control-row">
          <LED color={isOn ? 'cyan' : 'off'} size="lg" />
          <span className="text-xs font-mono text-accent">
            {formatFrequency(freq)}
          </span>
        </div>
        <div className="module-terminals">
          <Terminal id={`${nodeId}-output`} label="OUT" direction="output" connected={false} />
          <Terminal id={`${nodeId}-mod-in`} label="MOD IN" direction="input" connected={false} />
        </div>
      </div>
    </div>
  );
}
