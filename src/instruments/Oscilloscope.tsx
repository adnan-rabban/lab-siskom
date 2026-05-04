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

// Helpers
function formatTime(secs: number): string {
  if (secs < 1e-3) return `${(secs * 1e6).toFixed(1)} µs`;
  if (secs < 1) return `${(secs * 1e3).toFixed(1)} ms`;
  return `${secs.toFixed(2)} s`;
}

function formatFreq(hz: number): string {
  if (!isFinite(hz)) return '---';
  if (hz > 1e6) return `${(hz / 1e6).toFixed(2)} MHz`;
  if (hz > 1e3) return `${(hz / 1e3).toFixed(2)} kHz`;
  return `${hz.toFixed(1)} Hz`;
}

function formatVolts(v: number): string {
  if (v < 1) return `${(v * 1000).toFixed(0)} mV`;
  return `${v.toFixed(2)} V`;
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

  const [cursorMode, setCursorMode] = useState<'off' | 'time' | 'voltage'>('off');
  const [cursorPos, setCursorPos] = useState({ t1: 0.25, t2: 0.75, v1: 0.25, v2: 0.75 });
  const [draggingCursor, setDraggingCursor] = useState<keyof typeof cursorPos | null>(null);

  // BUG-01 fix: Auto-select first probe target for CH1 when available
  useEffect(() => {
    if (probeTargets.length > 0 && ch1.probeTarget === null) {
      setCh1(prev => ({ ...prev, probeTarget: probeTargets[0].nodeId }));
    }
  }, [probeTargets]); // eslint-disable-line react-hooks/exhaustive-deps

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
    ctx.fillStyle = '#080808';
    ctx.fillRect(0, 0, cw, ch_h);

    // --- Grid ---
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
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
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cw / 2, 0);
    ctx.lineTo(cw / 2, ch_h);
    ctx.moveTo(0, ch_h / 2);
    ctx.lineTo(cw, ch_h / 2);
    ctx.stroke();

    // --- Center dot markers ---
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
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
      ctx.fillStyle = 'rgba(255, 92, 0, 0.4)';
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

      // BUG-02 fix: GND coupling — show flat line
      if (channel.coupling === 'GND') {
        // voltsPerDiv not needed for GND flat line
        const pixelsPerDiv = ch_h / GRID_DIVS_Y;
        const centerY = ch_h / 2 - channel.verticalOffset * pixelsPerDiv;
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.moveTo(0, centerY);
        ctx.lineTo(cw, centerY);
        ctx.stroke();
        ctx.setLineDash([]);
        return;
      }

      // Find the target node to get its frequency for cycle calculation
      const targetNode = state.nodes.get(channel.probeTarget);
      if (!targetNode) return;

      // Calculate how many cycles of the carrier frequency fit in the time window
      const signalFreq = targetNode.params.frequency || 1000;
      const cyclesToShow = totalTime * signalFreq;

      // Generate signal data
      let signal = processSignalGraph(
        state.nodes,
        state.connections,
        channel.probeTarget,
        'output',
        RENDER_SAMPLES,
        cyclesToShow
      );

      if (!signal) return;

      // BUG-02 fix: AC coupling — remove DC offset (high-pass filter)
      if (channel.coupling === 'AC') {
        let dcOffset = 0;
        for (let i = 0; i < signal.length; i++) dcOffset += signal[i];
        dcOffset /= signal.length;
        const acSignal = new Float32Array(signal.length);
        for (let i = 0; i < signal.length; i++) acSignal[i] = signal[i] - dcOffset;
        signal = acSignal;
      }

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

    renderChannel(ch1, '#4ADE80', 'rgba(74, 222, 128, 0.5)');
    renderChannel(ch2, '#FF5C00', 'rgba(255, 92, 0, 0.5)');

    // --- Channel labels ---
    ctx.font = '10px "JetBrains Mono", monospace';
    if (ch1.enabled) {
      ctx.fillStyle = '#4ADE80';
      ctx.textAlign = 'left';
      ctx.fillText(`CH1: ${VOLTS_DIV_STEPS[ch1.voltsDivIndex].label}/div`, 8, 14);
    }
    if (ch2.enabled) {
      ctx.fillStyle = '#FF5C00';
      ctx.textAlign = 'left';
      ctx.fillText(`CH2: ${VOLTS_DIV_STEPS[ch2.voltsDivIndex].label}/div`, 8, 28);
    }

    // Time/div label
    ctx.fillStyle = 'rgba(255, 138, 0, 0.8)';
    ctx.textAlign = 'right';
    ctx.fillText(`${TIME_DIV_STEPS[timeDivIndex].label}/div`, cw - 8, 14);

    // --- Render Cursors natively on canvas ---
    if (cursorMode === 'time') {
      const t1x = cursorPos.t1 * cw;
      const t2x = cursorPos.t2 * cw;
      ctx.strokeStyle = '#ff00ff'; // Magenta for cursors
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // T1
      ctx.beginPath(); ctx.moveTo(t1x, 0); ctx.lineTo(t1x, ch_h); ctx.stroke();
      ctx.fillStyle = '#ff00ff';
      ctx.fillText('T1', t1x + 12, 40);

      // T2
      ctx.beginPath(); ctx.moveTo(t2x, 0); ctx.lineTo(t2x, ch_h); ctx.stroke();
      ctx.fillText('T2', t2x + 12, 54);

      ctx.setLineDash([]);
    } else if (cursorMode === 'voltage') {
      const v1y = cursorPos.v1 * ch_h;
      const v2y = cursorPos.v2 * ch_h;
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // V1
      ctx.beginPath(); ctx.moveTo(0, v1y); ctx.lineTo(cw, v1y); ctx.stroke();
      ctx.fillStyle = '#ff00ff';
      ctx.fillText('V1', 40, v1y - 4);

      // V2
      ctx.beginPath(); ctx.moveTo(0, v2y); ctx.lineTo(cw, v2y); ctx.stroke();
      ctx.fillText('V2', 40, v2y - 4);

      ctx.setLineDash([]);
    }
  }, [state, ch1, ch2, timeDivIndex, totalTime, running, cursorMode, cursorPos]);

  // Animation loop — with Page Visibility API for background tab efficiency
  useEffect(() => {
    let frameId = 0;
    let isVisible = !document.hidden;

    const loop = () => {
      renderFrame();
      frameId = requestAnimationFrame(loop);
    };

    const startLoop = () => {
      cancelAnimationFrame(frameId);
      if (running && isVisible) {
        frameId = requestAnimationFrame(loop);
      } else {
        renderFrame(); // Render one frame for static display
      }
    };

    const handleVisibility = () => {
      isVisible = !document.hidden;
      startLoop();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    startLoop();

    return () => {
      cancelAnimationFrame(frameId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
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
        <div 
          className="oscilloscope-screen-container"
          onMouseDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            const threshold = 0.05;

            if (cursorMode === 'time') {
              if (Math.abs(x - cursorPos.t1) < threshold) setDraggingCursor('t1');
              else if (Math.abs(x - cursorPos.t2) < threshold) setDraggingCursor('t2');
            } else if (cursorMode === 'voltage') {
              if (Math.abs(y - cursorPos.v1) < threshold) setDraggingCursor('v1');
              else if (Math.abs(y - cursorPos.v2) < threshold) setDraggingCursor('v2');
            }
          }}
          onMouseMove={(e) => {
            if (!draggingCursor) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const valX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const valY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
            
            setCursorPos(prev => ({
              ...prev,
              [draggingCursor]: draggingCursor.startsWith('t') ? valX : valY
            }));
          }}
          onMouseUp={() => setDraggingCursor(null)}
          onMouseLeave={() => setDraggingCursor(null)}
          onTouchStart={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const touch = e.touches[0];
            const x = (touch.clientX - rect.left) / rect.width;
            const y = (touch.clientY - rect.top) / rect.height;
            const threshold = 0.1;

            if (cursorMode === 'time') {
              if (Math.abs(x - cursorPos.t1) < threshold) setDraggingCursor('t1');
              else if (Math.abs(x - cursorPos.t2) < threshold) setDraggingCursor('t2');
            } else if (cursorMode === 'voltage') {
              if (Math.abs(y - cursorPos.v1) < threshold) setDraggingCursor('v1');
              else if (Math.abs(y - cursorPos.v2) < threshold) setDraggingCursor('v2');
            }
          }}
          onTouchMove={(e) => {
            if (!draggingCursor) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const touch = e.touches[0];
            const valX = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
            const valY = Math.max(0, Math.min(1, (touch.clientY - rect.top) / rect.height));
            
            setCursorPos(prev => ({
              ...prev,
              [draggingCursor]: draggingCursor.startsWith('t') ? valX : valY
            }));
          }}
          onTouchEnd={() => setDraggingCursor(null)}
          style={{ cursor: draggingCursor ? (cursorMode === 'time' ? 'ew-resize' : 'ns-resize') : 'default' }}
        >
          <canvas ref={canvasRef} id="oscilloscope-canvas" className="oscilloscope-canvas" />
          
          {/* Measurement Readout Overlay */}
          {cursorMode !== 'off' && (
            <div className="cursor-readout">
              {cursorMode === 'time' && (
                <>
                  <div>Δt: {formatTime(Math.abs(cursorPos.t2 - cursorPos.t1) * totalTime)}</div>
                  <div>1/Δt: {formatFreq(1 / (Math.abs(cursorPos.t2 - cursorPos.t1) * totalTime))}</div>
                </>
              )}
              {cursorMode === 'voltage' && (
                <>
                  <div>ΔV (CH1): {formatVolts(Math.abs(cursorPos.v2 - cursorPos.v1) * GRID_DIVS_Y * VOLTS_DIV_STEPS[ch1.voltsDivIndex].value)}</div>
                  {ch2.enabled && (
                    <div>ΔV (CH2): {formatVolts(Math.abs(cursorPos.v2 - cursorPos.v1) * GRID_DIVS_Y * VOLTS_DIV_STEPS[ch2.voltsDivIndex].value)}</div>
                  )}
                </>
              )}
            </div>
          )}
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
            <Knob
              label="POS"
              value={ch1.verticalOffset}
              min={-4}
              max={4}
              step={0.1}
              size="sm"
              onChange={(v) => setCh1(prev => ({ ...prev, verticalOffset: v }))}
              formatValue={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`}
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
            <Knob
              label="POS"
              value={ch2.verticalOffset}
              min={-4}
              max={4}
              step={0.1}
              size="sm"
              onChange={(v) => setCh2(prev => ({ ...prev, verticalOffset: v }))}
              formatValue={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`}
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
          
          {/* Cursor Controls */}
          <div className="cursor-controls">
             <span className="text-xs text-muted" style={{ fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              CURSORS
            </span>
            <div className="coupling-selector" style={{ marginTop: '8px' }}>
              {(['off', 'time', 'voltage'] as const).map(mode => (
                <span
                  key={mode}
                  className={`coupling-option ${cursorMode === mode ? 'active' : ''}`}
                  onClick={() => setCursorMode(mode)}
                  style={{ textTransform: 'uppercase', fontSize: '10px' }}
                >
                  {mode}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
