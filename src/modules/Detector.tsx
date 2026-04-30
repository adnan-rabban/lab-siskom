import { useCallback } from 'react';
import { useSignalGraph } from '../engine/SignalGraphContext';
import { usePortConnected } from '../hooks/usePortConnected';
import Knob from '../components/Knob';
import LED from '../components/LED';
import Terminal from '../components/Terminal';

interface DetectorProps {
  nodeId: string;
}

export default function Detector({ nodeId }: DetectorProps) {
  const { state, dispatch, t } = useSignalGraph();
  const isConnected = usePortConnected(nodeId);
  const node = state.nodes.get(nodeId);
  const isOn = state.powerOn;

  const handleDecayChange = useCallback(
    (value: number) => {
      dispatch({
        type: 'UPDATE_NODE_PARAMS',
        nodeId,
        params: { decay: value },
      });
    },
    [dispatch, nodeId]
  );

  const handleTypeChange = useCallback(
    (type: string) => {
      dispatch({
        type: 'UPDATE_NODE_PARAMS',
        nodeId,
        params: { detectorType: type },
      });
    },
    [dispatch, nodeId]
  );

  if (!node) return null;

  const decay = (node.params.decay as number) || 0.995;
  const detectorType = (node.params.detectorType as string) || 'diode';

  return (
    <div className={`module-panel scanline-overlay detector-module ${isOn ? 'powered-on' : 'powered-off'}`}>
      <div className="module-header">
        <span className="module-title">{t('Detektor', 'Detector')}</span>
        <span className="module-label-badge">{node.label}</span>
      </div>
      <div className="module-controls">
        {/* Detector Type Selector */}
        <div className="module-control-row" style={{ justifyContent: 'center' }}>
          <div className="detector-type-selector">
            {['diode', 'product'].map(type => (
              <button
                key={type}
                className={`detector-type-btn ${detectorType === type ? 'active' : ''}`}
                onClick={() => handleTypeChange(type)}
              >
                {type === 'diode' ? t('Dioda', 'Diode') : t('Produk', 'Product')}
              </button>
            ))}
          </div>
        </div>

        {/* Signal Presence LED */}
        <div className="module-control-row" style={{ justifyContent: 'center', gap: 'var(--sp-2)' }}>
          <LED color={isOn ? 'green' : 'off'} />
          <span className="module-control-label" style={{ minWidth: 'auto' }}>
            {t('Sinyal', 'Signal')}
          </span>
        </div>

        {/* RC Time Constant */}
        <div className="module-control-row" style={{ justifyContent: 'center' }}>
          <Knob
            label={t('Konstanta RC', 'RC Constant')}
            value={decay}
            min={0.98}
            max={0.999}
            step={0.001}
            size="sm"
            onChange={handleDecayChange}
            formatValue={(v) => `${(v * 1000).toFixed(0)}`}
          />
        </div>

        {/* Terminals */}
        <div className="module-terminals">
          <Terminal id={`${nodeId}-input`} label="IN" direction="input" connected={isConnected('input')} />
          <Terminal id={`${nodeId}-output`} label="OUT" direction="output" connected={isConnected('output')} />
        </div>
      </div>
    </div>
  );
}
