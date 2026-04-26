import type { Connection } from '../engine/types';
import { useSignalGraph } from '../engine/SignalGraphContext';
import ToggleSwitch from './ToggleSwitch';

interface ConnectionPanelProps {
  connections: Connection[];
}

export default function ConnectionPanel({ connections }: ConnectionPanelProps) {
  const { state, dispatch, t } = useSignalGraph();

  const getPortLabel = (nodeId: string, portId: string): string => {
    const node = state.nodes.get(nodeId);
    if (!node) return portId;
    const port = node.ports.find(p => p.id === portId);
    return port ? `${node.label}.${port.label}` : `${node.label}.${portId}`;
  };

  return (
    <div className="connection-panel">
      <div className="connection-panel-header">
        <span className="connection-panel-title">
          {t('Koneksi Kabel', 'Wire Connections')}
        </span>
        <span className="text-xs text-muted">
          {connections.filter(c => c.connected).length}/{connections.length} {t('terhubung', 'connected')}
        </span>
      </div>
      <div>
        {connections.map((conn) => {
          const fromLabel = getPortLabel(conn.fromNodeId, conn.fromPortId);
          const toLabel = getPortLabel(conn.toNodeId, conn.toPortId);
          const statusClass = conn.connected ? 'connected' : 'disconnected';

          return (
            <div key={conn.id} className="connection-row">
              <span className="connection-from">{fromLabel}</span>
              <div className="connection-wire">
                <span className={`connection-dot ${statusClass}`} />
                <span className={`connection-line ${statusClass}`} />
                <span className={`connection-dot ${statusClass}`} />
              </div>
              <span className="connection-to">{toLabel}</span>
              <ToggleSwitch
                active={conn.connected}
                onChange={() => dispatch({ type: 'TOGGLE_CONNECTION', connectionId: conn.id })}
              />
              <span className={`connection-status ${statusClass}`}>
                {conn.connected ? '✓' : '○'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
