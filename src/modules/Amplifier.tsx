import { useCallback } from 'react';
import { useSignalGraph } from '../engine/SignalGraphContext';
import Knob from '../components/Knob';
import Terminal from '../components/Terminal';

interface AmplifierProps {
  nodeId: string;
}

export default function Amplifier({ nodeId }: AmplifierProps) {
  const { state, dispatch, t } = useSignalGraph();
  const node = state.nodes.get(nodeId);
  const isOn = state.powerOn;

  const handleGainChange = useCallback(
    (value: number) => {
      dispatch({
        type: 'UPDATE_NODE_PARAMS',
        nodeId,
        params: { gain: value },
      });
    },
    [dispatch, nodeId]
  );

  if (!node) return null;

  const gain = node.params.gain || 0;

  return (
    <div className={`module-panel scanline-overlay amplifier-module ${isOn ? 'powered-on' : 'powered-off'}`}>
      <div className="module-header">
        <span className="module-title">{t('Penguat', 'Amplifier')}</span>
        <span className="module-label-badge">{node.label}</span>
      </div>
      <div className="module-controls">
        <div className="module-control-row" style={{ justifyContent: 'center' }}>
          <Knob
            label={t('Penguatan', 'Gain')}
            value={gain}
            min={-20}
            max={40}
            step={1}
            onChange={handleGainChange}
            formatValue={(v) => `${v > 0 ? '+' : ''}${v} dB`}
          />
        </div>
        <div className="module-terminals">
          <Terminal id={`${nodeId}-input`} label="IN" direction="input" connected={false} />
          <Terminal id={`${nodeId}-output`} label="OUT" direction="output" connected={false} />
        </div>
      </div>
    </div>
  );
}
