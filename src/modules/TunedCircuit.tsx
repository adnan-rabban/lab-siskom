import { useCallback, useState } from 'react';
import { useSignalGraph } from '../engine/SignalGraphContext';
import Knob from '../components/Knob';
import Terminal from '../components/Terminal';

interface TunedCircuitProps {
  nodeId: string;
}

function formatFrequency(hz: number): string {
  if (hz >= 1e6) return `${(hz / 1e6).toFixed(2)} MHz`;
  if (hz >= 1e3) return `${(hz / 1e3).toFixed(1)} kHz`;
  return `${hz.toFixed(0)} Hz`;
}

type ComponentType = 'normal' | 'c1-47nf' | 'r1-2k2';

export default function TunedCircuit({ nodeId }: TunedCircuitProps) {
  const { state, dispatch, t } = useSignalGraph();
  const node = state.nodes.get(nodeId);
  const isOn = state.powerOn;
  const [activeComponent, setActiveComponent] = useState<ComponentType>('normal');

  const handleTuneChange = useCallback(
    (value: number) => {
      dispatch({
        type: 'UPDATE_NODE_PARAMS',
        nodeId,
        params: { tunedFrequency: value * 1000 },
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

  const handleComponentSelect = useCallback(
    (comp: ComponentType) => {
      setActiveComponent(comp);
      // Adjust bandwidth based on component
      let bw = 10000;
      if (comp === 'c1-47nf') bw = 50000; // wider bandwidth
      if (comp === 'r1-2k2') bw = 5000; // narrower
      dispatch({
        type: 'UPDATE_NODE_PARAMS',
        nodeId,
        params: { bandwidth: bw },
      });
    },
    [dispatch, nodeId]
  );

  if (!node) return null;

  const tunedFreq = node.params.tunedFrequency || 455000;
  const atten = node.params.attenuation || 0;

  return (
    <div className={`module-panel scanline-overlay tuned-circuit-module ${isOn ? 'powered-on' : 'powered-off'}`}>
      <div className="module-header">
        <span className="module-title">{t('Rangkaian Tala', 'Tuned Circuit')}</span>
        <span className="module-label-badge">{node.label}</span>
      </div>
      <div className="module-controls">
        <div className="module-control-row">
          <span className="module-control-label">{t('Penalaan', 'Tune')}</span>
          <Knob
            label={t('Frekuensi', 'Freq')}
            value={tunedFreq / 1000}
            min={100}
            max={1000}
            step={5}
            onChange={handleTuneChange}
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
        <div>
          <span className="module-control-label" style={{ marginBottom: '4px', display: 'block' }}>
            {t('Komponen', 'Component')}
          </span>
          <div className="component-selector">
            <button
              className={`component-option ${activeComponent === 'normal' ? 'active' : ''}`}
              onClick={() => handleComponentSelect('normal')}
            >
              Normal
            </button>
            <button
              className={`component-option ${activeComponent === 'c1-47nf' ? 'active' : ''}`}
              onClick={() => handleComponentSelect('c1-47nf')}
            >
              C1=47nF
            </button>
            <button
              className={`component-option ${activeComponent === 'r1-2k2' ? 'active' : ''}`}
              onClick={() => handleComponentSelect('r1-2k2')}
            >
              R1=2k2
            </button>
          </div>
        </div>
        <div className="module-terminals">
          <Terminal id={`${nodeId}-input`} label="IN" direction="input" connected={false} />
          <Terminal id={`${nodeId}-output`} label="OUT" direction="output" connected={false} />
        </div>
      </div>
    </div>
  );
}
