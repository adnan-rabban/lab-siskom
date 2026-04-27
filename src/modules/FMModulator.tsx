import { useCallback } from 'react';
import { useSignalGraph } from '../engine/SignalGraphContext';
import Knob from '../components/Knob';
import Terminal from '../components/Terminal';
import ModulationMeter from '../components/ModulationMeter';

interface FMModulatorProps {
  nodeId: string;
}

export default function FMModulator({ nodeId }: FMModulatorProps) {
  const { state, dispatch, t } = useSignalGraph();
  const node = state.nodes.get(nodeId);
  const isOn = state.powerOn;

  const handleDeviationChange = useCallback(
    (value: number) => {
      dispatch({
        type: 'UPDATE_NODE_PARAMS',
        nodeId,
        params: { freqDeviation: value },
      });
    },
    [dispatch, nodeId]
  );

  if (!node) return null;

  // Default deviation 75 kHz (standard broadcast FM max deviation)
  const freqDeviation = (node.params.freqDeviation ?? 75000); 
  
  // Meter value relative to max standard deviation (e.g., 0 to 150kHz)
  // Scale the value so it looks nice on a 0-100 meter, or we can adjust ModulationMeter to take max.
  // We'll just show the value mapped 0 to 150.
  const meterValue = Math.min((freqDeviation / 150000) * 100, 100);

  return (
    <div className={`module-panel scanline-overlay fm-modulator-module ${isOn ? 'powered-on' : 'powered-off'}`}>
      <div className="module-header">
        <span className="module-title">{t('Modulator FM', 'FM Modulator')}</span>
        <span className="module-label-badge">{node.label}</span>
      </div>
      <div className="module-controls">
        <div className="module-control-row" style={{ justifyContent: 'center' }}>
          <Knob
            label={t('Deviasi Frekuensi', 'Freq Deviation')}
            value={freqDeviation}
            min={0}
            max={150000}
            step={1000}
            size="lg"
            onChange={handleDeviationChange}
            formatValue={(v) => `${(v / 1000).toFixed(0)}k`}
          />
        </div>
        
        {/* We can reuse ModulationMeter, but label it differently */}
        <ModulationMeter value={meterValue} label={t('Deviasi (Δf)', 'Deviation (Δf)')} />
        
        <div className="module-terminals">
          <Terminal id={`${nodeId}-carrier-in`} label="CARRIER" direction="input" connected={false} />
          <Terminal id={`${nodeId}-mod-in`} label="MOD IN" direction="input" connected={false} />
          <Terminal id={`${nodeId}-output`} label="OUT" direction="output" connected={false} />
        </div>
      </div>
    </div>
  );
}
