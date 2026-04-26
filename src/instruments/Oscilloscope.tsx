import { useRef, useEffect, useCallback, useState } from 'react';
import { useSignalGraph } from '../engine/SignalGraphContext';
import { processSignalGraph } from '../engine/SignalEngine';
import type { CouplingMode } from '../engine/types';
import Knob from '../components/Knob';
import ToggleSwitch from '../components/ToggleSwitch';

// ============================================================
// TIME/DIV and VOLTS/DIV step tables
// ============================================================
const TIME_DIV_STEPS = [
  { value: 0.000001, label: '1µs' },
  { value: 0.000002, label: '2µs' },
  { value: 0.000005, label: '5µs' },
  { value: 0.00001,  label: '10µs' },
  { value: 0.00002,  label: '20µs' },
  { value: 0.00005,  label: '50µs' },
  { value: 0.0001,   label: '100µs' },
  { value: 0.0002,   label: '200µs' },
  { value: 0.0005,   label: '500µs' },
  { value: 0.001,    label: '1ms' },
  { value: 0.002,    label: '2ms' },
  { value: 0.005,    label: '5ms' },
  { value: 0.01,     label: '10ms' },
  { value: 0.02,     label: '20ms' },
  { value: 0.05,     label: '50ms' },
  { value: 0.1,      label: '100ms' },
  { value: 0.2,      label: '200ms' },
  { value: 0.5,      label: '500ms' },
  { value: 1,        label: '1s' },
];

const VOLTS_DIV_STEPS = [
  { value: 0.001, label: '1mV' },
  { value: 0.002, label: '2mV' },
  { value: 0.005, label: '5mV' },
  { value: 0.01,  label: '10mV' },
  { value: 0.02,  label: '20mV' },
  { value: 0.05,  label: '50mV' },
  { value: 0.1,   label: '100mV' },
  { value: 0.2,   label: '200mV' },
  { value: 0.5,   label: '500mV' },
  { value: 1,     label: '1V' },
  { value: 2,     label: '2V' },
  { value: 5,     label: '5V' },
  { value: 10,    label: '10V' },
  { value: 20,    label: '20V' },
];

const GRID_DIVS_X = 10;
const GRID_DIVS_Y = 8;
const RENDER_SAMPLES = 2048;

// ============================================================
// Channel State
// ============================================================
interface ChannelState {
  enabled: boolean;
  coupling: CouplingMode;
  voltsDivIndex: number;
  verticalOffset: number;
  probeTarget: string | null; // nodeId to probe
}

// ============================================================
// Component
// ============================================================

interface OscilloscopeProps {
  /** Available probe targets: { nodeId, portId, label }[] */
  probeTargets?: { nodeId: string; portId: string; label: string }[];
}

export default function Oscilloscope({ probeTargets = [] }: OscilloscopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const { state, t } = useSignalGraph();

  const [timeDivIndex, setTimeDivIndex] = useState(6); // 100µs default
  const [running, setRunning] = useState(true);

  const [ch1, setCh1] = useState<ChannelState>({
    enabled: true,
    coupling: 'DC',
    voltsDivIndex: 9, // 1V
    verticalOffset: 0,
    probeTarget: null,
  });

  const [ch2, setCh2] = useState<ChannelState>({
    enabled: false,
    coupling: 'DC',
    voltsDivIndex: 9,
    verticalOffset: 0,
    probeTarget: null,
  });

  const timePerDiv = TIME_DIV_STEPS[timeDivIndex].value;
  const totalTime = timePerDiv * GRID_DIVS_X; // total time window

  // ============================================================
  // Canvas Rendering (imperative, not React state)
  // ============================================================
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width * dpr;
    const h = rect.height * dpr;

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cw = rect.width;
    const ch_h = rect.height;

    // --- Background ---
    ctx.fillStyle = '#050a08';
    ctx.fillRect(0, 0, cw, ch_h);

    // --- Grid ---
    ctx.strokeStyle = 'rgba(57, 255, 20, 0.12)';
    ctx.lineWidth = 0.5;

    // Vertical grid lines
    for (let i = 0; i <= GRID_DIVS_X; i++) {
      const x = (i / GRID_DIVS_X) * cw;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ch_h);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let i = 0; i <= GRID_DIVS_Y; i++) {
      const y = (i / GRID_DIVS_Y) * ch_h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cw, y);
      ctx.stroke();
    }

    // Center crosshair (brighter)
    ctx.strokeStyle = 'rgba(57, 255, 20, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cw / 2, 0);
    ctx.lineTo(cw / 2, ch_h);
    ctx.moveTo(0, ch_h / 2);
    ctx.lineTo(cw, ch_h / 2);
    ctx.stroke();

    // --- Center dot markers ---
    ctx.fillStyle = 'rgba(57, 255, 20, 0.25)';
    for (let i = 0; i <= GRID_DIVS_X; i++) {
      const x = (i / GRID_DIVS_X) * cw;
      ctx.beginPath();
      ctx.arc(x, ch_h / 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i <= GRID_DIVS_Y; i++) {
      const y = (i / GRID_DIVS_Y) * ch_h;
      ctx.beginPath();
      ctx.arc(cw / 2, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!state.powerOn || !running) {
      // Show "NO SIGNAL" text when powered off
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(57, 255, 20, 0.3)';
      ctx.textAlign = 'center';
      ctx.fillText(state.powerOn ? 'STOPPED' : 'POWER OFF', cw / 2, ch_h / 2 + 4);
      return;
    }

    // --- Render Channels ---
    const renderChannel = (
      channel: ChannelState,
      color: string,
      glowColor: string
    ) => {
      if (!channel.enabled || !channel.probeTarget) return;

      // Find the target node to get its frequency for cycle calculation
      const targetNode = state.nodes.get(channel.probeTarget);
      if (!targetNode) return;

      // Calculate how many cycles of the carrier frequency fit in the time window
      const signalFreq = targetNode.params.frequency || 1000;
      const cyclesToShow = totalTime * signalFreq;

      // Generate signal data
      const signal = processSignalGraph(
        state.nodes,
        state.connections,
        channel.probeTarget,
        'output',
        RENDER_SAMPLES,
        cyclesToShow
      );

      if (!signal) return;

      const voltsPerDiv = VOLTS_DIV_STEPS[channel.voltsDivIndex].value;
      const pixelsPerDiv = ch_h / GRID_DIVS_Y;
      const centerY = ch_h / 2 - channel.verticalOffset * pixelsPerDiv;
      const scale = pixelsPerDiv / voltsPerDiv;

      // Glow pass (wider, dimmer)
      ctx.beginPath();
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.3;
      for (let i = 0; i < signal.length; i++) {
        const x = (i / signal.length) * cw;
        const y = centerY - signal[i] * scale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Main trace
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = color;
      ctx.shadowBlur = 3;
      for (let i = 0; i < signal.length; i++) {
        const x = (i / signal.length) * cw;
        const y = centerY - signal[i] * scale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    renderChannel(ch1, '#39ff14', 'rgba(57, 255, 20, 0.5)');
    renderChannel(ch2, '#00e5ff', 'rgba(0, 229, 255, 0.5)');

    // --- Channel labels ---
    ctx.font = '10px "JetBrains Mono", monospace';
    if (ch1.enabled) {
      ctx.fillStyle = '#39ff14';
      ctx.textAlign = 'left';
      ctx.fillText(`CH1: ${VOLTS_DIV_STEPS[ch1.voltsDivIndex].label}/div`, 8, 14);
    }
    if (ch2.enabled) {
      ctx.fillStyle = '#00e5ff';
      ctx.textAlign = 'left';
      ctx.fillText(`CH2: ${VOLTS_DIV_STEPS[ch2.voltsDivIndex].label}/div`, 8, 28);
    }

    // Time/div label
    ctx.fillStyle = 'rgba(255, 171, 0, 0.8)';
    ctx.textAlign = 'right';
    ctx.fillText(`${TIME_DIV_STEPS[timeDivIndex].label}/div`, cw - 8, 14);
  }, [state, ch1, ch2, timeDivIndex, totalTime, running]);

  // Animation loop
  useEffect(() => {
    if (!running) {
      renderFrame();
      return;
    }

    const loop = () => {
      renderFrame();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [renderFrame, running]);

  // --- Handlers ---
  const handleTimeDivChange = useCallback((idx: number) => {
    setTimeDivIndex(Math.max(0, Math.min(TIME_DIV_STEPS.length - 1, Math.round(idx))));
  }, []);

  const handleCh1VoltsChange = useCallback((idx: number) => {
    setCh1(prev => ({
      ...prev,
      voltsDivIndex: Math.max(0, Math.min(VOLTS_DIV_STEPS.length - 1, Math.round(idx))),
    }));
  }, []);

  const handleCh2VoltsChange = useCallback((idx: number) => {
    setCh2(prev => ({
      ...prev,
      voltsDivIndex: Math.max(0, Math.min(VOLTS_DIV_STEPS.length - 1, Math.round(idx))),
    }));
  }, []);

  return (
    <div className="instrument-panel oscilloscope">
      <div className="instrument-header">
        <span className="instrument-title">{t('Osiloskop 2 Kanal', '2-Channel Oscilloscope')}</span>
        <ToggleSwitch
          active={running}
          onChange={setRunning}
          labelOn="RUN"
          labelOff="STOP"
        />
      </div>

      <div className="instrument-body">
        <div className="oscilloscope-screen-container">
          <canvas ref={canvasRef} className="oscilloscope-canvas" />
        </div>
      </div>

      <div className="instrument-controls">
        <div className="oscilloscope-controls-row">
          {/* CH1 Controls */}
          <div className="oscilloscope-channel-controls">
            <div className="channel-header">
              <span className="channel-label ch1">CH1</span>
              <ToggleSwitch
                active={ch1.enabled}
                onChange={(v) => setCh1(prev => ({ ...prev, enabled: v }))}
              />
            </div>
            <Knob
              label="V/DIV"
              value={ch1.voltsDivIndex}
              min={0}
              max={VOLTS_DIV_STEPS.length - 1}
              step={1}
              size="sm"
              onChange={handleCh1VoltsChange}
              formatValue={(v) => VOLTS_DIV_STEPS[Math.round(v)]?.label || ''}
            />
            <div className="coupling-selector">
              {(['AC', 'DC', 'GND'] as CouplingMode[]).map(mode => (
                <span
                  key={mode}
                  className={`coupling-option ${ch1.coupling === mode ? 'active' : ''}`}
                  onClick={() => setCh1(prev => ({ ...prev, coupling: mode }))}
                >
                  {mode}
                </span>
              ))}
            </div>
            {/* Probe selector */}
            <div className="probe-selector">
              <span className="text-xs text-muted">Probe:</span>
              {probeTargets.map(pt => (
                <span
                  key={pt.nodeId}
                  className={`probe-option ${ch1.probeTarget === pt.nodeId ? 'selected' : ''}`}
                  onClick={() => setCh1(prev => ({ ...prev, probeTarget: pt.nodeId }))}
                >
                  {ch1.probeTarget === pt.nodeId ? '●' : '○'} {pt.label}
                </span>
              ))}
            </div>
          </div>

          {/* CH2 Controls */}
          <div className="oscilloscope-channel-controls">
            <div className="channel-header">
              <span className="channel-label ch2">CH2</span>
              <ToggleSwitch
                active={ch2.enabled}
                onChange={(v) => setCh2(prev => ({ ...prev, enabled: v }))}
              />
            </div>
            <Knob
              label="V/DIV"
              value={ch2.voltsDivIndex}
              min={0}
              max={VOLTS_DIV_STEPS.length - 1}
              step={1}
              size="sm"
              onChange={handleCh2VoltsChange}
              formatValue={(v) => VOLTS_DIV_STEPS[Math.round(v)]?.label || ''}
            />
            <div className="coupling-selector">
              {(['AC', 'DC', 'GND'] as CouplingMode[]).map(mode => (
                <span
                  key={mode}
                  className={`coupling-option ${ch2.coupling === mode ? 'active' : ''}`}
                  onClick={() => setCh2(prev => ({ ...prev, coupling: mode }))}
                >
                  {mode}
                </span>
              ))}
            </div>
            <div className="probe-selector">
              <span className="text-xs text-muted">Probe:</span>
              {probeTargets.map(pt => (
                <span
                  key={pt.nodeId}
                  className={`probe-option ${ch2.probeTarget === pt.nodeId ? 'selected' : ''}`}
                  onClick={() => setCh2(prev => ({ ...prev, probeTarget: pt.nodeId }))}
                >
                  {ch2.probeTarget === pt.nodeId ? '●' : '○'} {pt.label}
                </span>
              ))}
            </div>
          </div>

          {/* Time Controls */}
          <div className="time-controls">
            <span className="text-xs text-muted" style={{ fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              SWEEP
            </span>
            <Knob
              label="TIME/DIV"
              value={timeDivIndex}
              min={0}
              max={TIME_DIV_STEPS.length - 1}
              step={1}
              onChange={handleTimeDivChange}
              formatValue={(v) => TIME_DIV_STEPS[Math.round(v)]?.label || ''}
            />
            <div className="time-display">
              {TIME_DIV_STEPS[timeDivIndex].label}/div
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
