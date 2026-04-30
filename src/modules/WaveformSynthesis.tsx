import { useCallback } from 'react';
import { useSignalGraph } from '../engine/SignalGraphContext';
import { usePortConnected } from '../hooks/usePortConnected';
import Knob from '../components/Knob';
import Terminal from '../components/Terminal';
import ModulationMeter from '../components/ModulationMeter';

interface WaveformSynthesisProps {
  nodeId: string;
}

export default function WaveformSynthesis({ nodeId }: WaveformSynthesisProps) {
  const { state, dispatch, t } = useSignalGraph();
  const isConnected = usePortConnected(nodeId);
  const node = state.nodes.get(nodeId);
  const isOn = state.powerOn;

  const handleModIndexChange = useCallback(
    (value: number) => {
      dispatch({
        type: 'UPDATE_NODE_PARAMS',
        nodeId,
        params: { modulationIndex: value / 100 },
      });
    },
    [dispatch, nodeId]
  );

  if (!node) return null;

  const modIndex = (node.params.modulationIndex ?? 0.5) * 100;

  return (
    <div className={`module-panel scanline-overlay waveform-synthesis-module ${isOn ? 'powered-on' : 'powered-off'}`}>
      <div className="module-header">
        <span className="module-title">{t('Sintesis Gelombang', 'Waveform Synthesis')}</span>
        <span className="module-label-badge">{node.label}</span>
      </div>
      <div className="module-controls">
        <div className="module-control-row" style={{ justifyContent: 'center' }}>
          <Knob
            label={t('Indeks Modulasi', 'Mod Index')}
            value={modIndex}
            min={0}
            max={150}
            step={1}
            size="lg"
            onChange={handleModIndexChange}
            formatValue={(v) => `${v.toFixed(0)}%`}
          />
        </div>
        <ModulationMeter value={modIndex} label={t('Indeks Modulasi (m%)', 'Modulation Index (m%)')} />
        <div className="module-terminals">
          <Terminal id={`${nodeId}-carrier-in`} label="CARRIER" direction="input" connected={isConnected('carrier-in')} />
          <Terminal id={`${nodeId}-mod-in`} label="MOD IN" direction="input" connected={isConnected('mod-in')} />
          <Terminal id={`${nodeId}-output`} label="OUT" direction="output" connected={isConnected('output')} />
        </div>
      </div>
    </div>
  );
}
