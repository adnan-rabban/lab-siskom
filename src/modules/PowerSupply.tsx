import { useCallback } from 'react';
import { useSignalGraph } from '../engine/SignalGraphContext';
import ToggleSwitch from '../components/ToggleSwitch';
import LED from '../components/LED';
import Terminal from '../components/Terminal';

interface PowerSupplyProps {
  nodeId: string;
}

export default function PowerSupply({ nodeId }: PowerSupplyProps) {
  const { state, dispatch, t } = useSignalGraph();
  const node = state.nodes.get(nodeId);
  const isOn = state.powerOn;

  const handleToggle = useCallback(
    (on: boolean) => {
      dispatch({ type: 'SET_POWER', on });
      dispatch({
        type: 'UPDATE_NODE_PARAMS',
        nodeId,
        params: { enabled: on },
      });
    },
    [dispatch, nodeId]
  );

  if (!node) return null;

  return (
    <div className={`module-panel scanline-overlay power-supply-module ${isOn ? 'powered-on' : ''}`}>
      <div className="module-header">
        <span className="module-title">{t('Catu Daya', 'Power Supply')}</span>
        <span className="module-label-badge">{node.label}</span>
      </div>
      <div className="module-controls">
        <div className="module-control-row" style={{ justifyContent: 'center' }}>
          <ToggleSwitch
            active={isOn}
            onChange={handleToggle}
            labelOn="ON"
            labelOff="OFF"
          />
        </div>
        <div className="voltage-rails">
          <div className={`voltage-rail ${isOn ? 'active' : ''}`}>
            <LED color={isOn ? 'green' : 'off'} />
            <span>+15V</span>
          </div>
          <div className={`voltage-rail ${isOn ? 'active' : ''}`}>
            <LED color={isOn ? 'green' : 'off'} />
            <span>-15V</span>
          </div>
          <div className={`voltage-rail ${isOn ? 'active' : ''}`}>
            <LED color={isOn ? 'amber' : 'off'} />
            <span>GND</span>
          </div>
        </div>
        <div className="module-terminals">
          <Terminal id={`${nodeId}-15v`} label="+15V" direction="output" connected={isOn} />
          <Terminal id={`${nodeId}-n15v`} label="-15V" direction="output" connected={isOn} />
          <Terminal id={`${nodeId}-gnd`} label="GND" direction="output" connected={isOn} />
        </div>
      </div>
    </div>
  );
}
