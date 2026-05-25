import { useEffect, useMemo, useState, useRef } from 'react';
import { useSignalGraph } from '../engine/SignalGraphContext';
import { processSignalGraph, estimateFrequency, inferOutputFrequency } from '../engine/SignalEngine';
import SevenSegmentDisplay from '../components/SevenSegment';
import Terminal from '../components/Terminal';

interface FrequencyCounterProps {
  /** Node ID to measure frequency from */
  probeTargets?: { nodeId: string; label: string }[];
}

function formatFrequency(hz: number): { display: string; unit: string } {
  if (hz >= 1e6) return { display: (hz / 1e6).toFixed(3), unit: 'MHz' };
  if (hz >= 1e3) return { display: (hz / 1e3).toFixed(2), unit: 'kHz' };
  return { display: hz.toFixed(1), unit: 'Hz' };
}

export default function FrequencyCounter({ probeTargets = [] }: FrequencyCounterProps) {
  const { state, t } = useSignalGraph();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(
    probeTargets.length > 0 ? probeTargets[0].nodeId : null
  );
  const [measuredFreq, setMeasuredFreq] = useState<number>(0);
  const intervalRef = useRef<number>(0);

  // Adjust selectedTarget during render if it's invalid or empty
  let adjustedTarget = selectedTarget;
  if (!selectedTarget && probeTargets.length > 0) {
    adjustedTarget = probeTargets[0].nodeId;
  } else if (selectedTarget && !probeTargets.some(pt => pt.nodeId === selectedTarget)) {
    adjustedTarget = probeTargets[0]?.nodeId ?? null;
  }

  if (adjustedTarget !== selectedTarget) {
    setSelectedTarget(adjustedTarget);
  }

  const connectedInput = useMemo(
    () => state.connections.find(c => c.connected && c.toNodeId === 'freq-counter' && c.toPortId === 'input'),
    [state.connections]
  );

  const effectiveTarget = connectedInput?.fromNodeId ?? adjustedTarget;

  useEffect(() => {
    if (!state.powerOn || !effectiveTarget) {
      return;
    }

    const measure = () => {
      const node = state.nodes.get(effectiveTarget);
      if (!node) {
        setMeasuredFreq(0);
        return;
      }

      const inferredFreq = inferOutputFrequency(state.nodes, state.connections, effectiveTarget);
      if (inferredFreq <= 0) {
        setMeasuredFreq(0);
        return;
      }

      const cyclesToShow = 10;
      const signal = processSignalGraph(
        state.nodes,
        state.connections,
        effectiveTarget,
        connectedInput?.fromPortId ?? 'output',
        1024,
        cyclesToShow
      );

      if (signal) {
        // Check if signal is actually non-zero (connected & active)
        let hasSignal = false;
        for (let i = 0; i < signal.length; i++) {
          if (Math.abs(signal[i]) > 0.001) {
            hasSignal = true;
            break;
          }
        }

        if (hasSignal) {
          const estimated = estimateFrequency(signal, inferredFreq, cyclesToShow);
          setMeasuredFreq(Number.isFinite(estimated) ? estimated : 0);
        } else {
          setMeasuredFreq(0);
        }
      } else {
        setMeasuredFreq(0);
      }
    };

    measure();
    intervalRef.current = window.setInterval(measure, 500);

    return () => {
      clearInterval(intervalRef.current);
      setMeasuredFreq(0);
    };
  }, [state.powerOn, effectiveTarget, connectedInput?.fromPortId, state.nodes, state.connections]);

  const { display, unit } = formatFrequency(measuredFreq);

  return (
    <div className="instrument-panel frequency-counter">
      <div className="instrument-header">
        <span className="instrument-title">{t('Pencacah Frekuensi', 'Frequency Counter')}</span>
      </div>

      <div className="instrument-body">
        <div className="freq-counter-display">
          <SevenSegmentDisplay
            value={state.powerOn ? display : '      '}
            unit={state.powerOn ? unit : ''}
            variant="red"
            digits={7}
          />
        </div>

        {probeTargets.length > 0 && (
          <div className="probe-selector" style={{ marginTop: 'var(--sp-3)' }}>
            <span className="freq-counter-input-label">{t('Masukan', 'Input')}:</span>
            {connectedInput && (
              <span className="probe-option selected">
                ● {probeTargets.find(pt => pt.nodeId === connectedInput.fromNodeId)?.label ?? connectedInput.fromNodeId}
              </span>
            )}
            {!connectedInput && probeTargets.map(pt => (
              <span
                key={pt.nodeId}
                className={`probe-option ${selectedTarget === pt.nodeId ? 'selected' : ''}`}
                onClick={() => setSelectedTarget(pt.nodeId)}
              >
                {selectedTarget === pt.nodeId ? '●' : '○'} {pt.label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="instrument-controls">
        <Terminal
          id="freq-counter-input"
          label="INPUT"
          direction="input"
          connected={Boolean(connectedInput || selectedTarget)}
        />
      </div>
    </div>
  );
}
