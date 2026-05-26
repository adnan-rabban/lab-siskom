import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { useSignalGraph } from '../engine/SignalGraphContext';
import { processSignalGraph, inferOutputFrequency } from '../engine/SignalEngine';
import type { Connection, CouplingMode } from '../engine/types';
import Knob from '../components/Knob';
import { Power, Usb } from 'lucide-react';

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
];

const GRID_DIVS_X = 10;
const GRID_DIVS_Y = 8;
const RENDER_SAMPLES = 1024;

interface ChannelState {
  enabled: boolean;
  coupling: CouplingMode;
  invert: boolean;
  bwLimit: boolean;
  probe: number;
  voltsDivIndex: number;
  verticalOffset: number;
}

interface MeasurementSlot {
  source: 'ch1' | 'ch2';
  type: 'Vpp' | 'Vmax' | 'Vmin' | 'Vavg' | 'Vrms' | 'Freq' | 'Period';
}

interface OscilloscopeProps {
  probeTargets?: { nodeId: string; portId: string; label: string }[];
}

function getConnectedScopeSource(connections: Connection[], channelPortId: 'ch1' | 'ch2'): Connection | undefined {
  return connections.find(c =>
    c.connected &&
    c.toNodeId === 'oscilloscope' &&
    c.toPortId === channelPortId
  );
}

function formatTime(secs: number): string {
  if (secs < 1e-6) return `${(secs * 1e9).toFixed(0)} ns`;
  if (secs < 1e-3) return `${(secs * 1e6).toFixed(1)} µs`;
  if (secs < 1) return `${(secs * 1e3).toFixed(1)} ms`;
  return `${secs.toFixed(2)} s`;
}

function formatFreq(hz: number): string {
  if (!isFinite(hz) || hz <= 0) return '---';
  if (hz > 1e6) return `${(hz / 1e6).toFixed(3)} MHz`;
  if (hz > 1e3) return `${(hz / 1e3).toFixed(2)} kHz`;
  return `${hz.toFixed(1)} Hz`;
}

function formatVolts(v: number): string {
  if (v < 1) return `${(v * 1000).toFixed(0)} mV`;
  return `${v.toFixed(2)} V`;
}

export default function Oscilloscope({ probeTargets = [] }: OscilloscopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state, t } = useSignalGraph();

  // Local device power state
  const [devicePower, setDevicePower] = useState(true);
  const [running, setRunning] = useState(true);
  const [timeDivIndex, setTimeDivIndex] = useState(7); // 200µs default
  const [horizontalOffset, setHorizontalOffset] = useState(0); // in divisions
  const [triggerLevel, setTriggerLevel] = useState(0); // in volts

  // GDS-1000A-U menu state
  const [activeMenu, setActiveMenu] = useState<'ch1' | 'ch2' | 'cursor' | 'measure' | 'display' | 'horizontal' | 'trigger' | 'utility' | 'off'>('ch1');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null); // For Measure sub-menu editing

  const [ch1, setCh1] = useState<ChannelState>({
    enabled: true,
    coupling: 'DC',
    invert: false,
    bwLimit: false,
    probe: 1,
    voltsDivIndex: 8, // 1V
    verticalOffset: 0.0,
  });

  const [ch2, setCh2] = useState<ChannelState>({
    enabled: false,
    coupling: 'DC',
    invert: false,
    bwLimit: false,
    probe: 1,
    voltsDivIndex: 8, // 1V
    verticalOffset: 0.0,
  });

  // Probe Calibration source loop state
  const [ch1Source, setCh1Source] = useState<'circuit' | 'cal' | 'none'>('circuit');
  const [ch2Source, setCh2Source] = useState<'circuit' | 'cal' | 'none'>('none');

  // Interactive drop-down popups for BNC ports
  const [showCh1BncMenu, setShowCh1BncMenu] = useState(false);
  const [showCh2BncMenu, setShowCh2BncMenu] = useState(false);

  // Cursors State
  const [cursorMode, setCursorMode] = useState<'off' | 'time' | 'voltage'>('off');
  const [activeCursor, setActiveCursor] = useState<'x1' | 'x2' | 'both' | 'y1' | 'y2'>('x1');
  const [cursorPos, setCursorPos] = useState({ t1: 0.25, t2: 0.75, v1: 0.25, v2: 0.75 });
  const [contrast, setContrast] = useState(80); // Display contrast (50-100)
  const [gridMode, setGridMode] = useState<'full' | 'cross' | 'frame'>('full');

  // Measure slots (F1 to F5 display)
  const [measureSlots, setMeasureSlots] = useState<MeasurementSlot[]>([
    { source: 'ch1', type: 'Vpp' },
    { source: 'ch1', type: 'Freq' },
    { source: 'ch1', type: 'Period' },
    { source: 'ch1', type: 'Vmax' },
    { source: 'ch2', type: 'Vpp' },
  ]);

  const ch1Connection = useMemo(() => getConnectedScopeSource(state.connections, 'ch1'), [state.connections]);
  const ch2Connection = useMemo(() => getConnectedScopeSource(state.connections, 'ch2'), [state.connections]);

  const probeLabel = useCallback(
    (source: 'circuit' | 'cal' | 'none', conn?: Connection) => {
      if (source === 'cal') return t('Probe Comp (1kHz)', 'Probe Comp (1kHz)');
      if (source === 'none' || !conn) return t('Tidak Terhubung', 'Not Connected');
      return probeTargets.find(pt => pt.nodeId === conn.fromNodeId)?.label ?? conn.fromNodeId;
    },
    [probeTargets, t]
  );

  const timePerDiv = TIME_DIV_STEPS[timeDivIndex].value;
  const totalTime = timePerDiv * GRID_DIVS_X;

  // Helper values for measurements calculations
  const ch1Freq = useMemo(() => {
    if (ch1Source === 'cal') return 1000;
    return ch1Connection ? inferOutputFrequency(state.nodes, state.connections, ch1Connection.fromNodeId) || 0 : 0;
  }, [ch1Source, ch1Connection, state.nodes, state.connections]);

  const ch2Freq = useMemo(() => {
    if (ch2Source === 'cal') return 1000;
    return ch2Connection ? inferOutputFrequency(state.nodes, state.connections, ch2Connection.fromNodeId) || 0 : 0;
  }, [ch2Source, ch2Connection, state.nodes, state.connections]);

  // Autoset functionality matching GDS-1000A-U (sets best timebase and vertical scales)
  const handleAutoset = useCallback(() => {
    if (!state.powerOn || !devicePower) return;
    
    // Choose active channel to lock on
    const activeCh = ch1.enabled ? 1 : ch2.enabled ? 2 : (ch1Connection || ch1Source === 'cal' ? 1 : 2);
    const conn = activeCh === 1 ? ch1Connection : ch2Connection;
    const isCal = activeCh === 1 ? (ch1Source === 'cal') : (ch2Source === 'cal');
    
    if (!conn && !isCal) return;

    // 1. Set sweep time based on frequency
    const freq = activeCh === 1 ? ch1Freq : ch2Freq;
    if (freq > 0) {
      const targetTimeDiv = 0.3 / freq;
      let bestTimeIdx = 0;
      let minDiff = Infinity;
      for (let i = 0; i < TIME_DIV_STEPS.length; i++) {
        const diff = Math.abs(TIME_DIV_STEPS[i].value - targetTimeDiv);
        if (diff < minDiff) {
          minDiff = diff;
          bestTimeIdx = i;
        }
      }
      setTimeDivIndex(bestTimeIdx);
    }
    setHorizontalOffset(0);

    // 2. Set vertical Volts/Div based on signal amplitude
    let amplitude = 1.0;
    if (isCal) {
      amplitude = 1.0; // Cal signal is 2 Vp-p (amp = 1.0)
    } else if (conn) {
      const cycles = freq > 0 ? Math.max(totalTime * freq, 1) : 3;
      const sig = processSignalGraph(state.nodes, state.connections, conn.fromNodeId, conn.fromPortId, 256, cycles);
      if (sig && sig.length > 0) {
        let max = -Infinity, min = Infinity;
        for (let i = 0; i < sig.length; i++) {
          if (sig[i] > max) max = sig[i];
          if (sig[i] < min) min = sig[i];
        }
        amplitude = Math.max(0.01, (max - min) / 2);
      }
    }

    const targetVoltsDiv = amplitude / 2;
    let bestVoltsIdx = 0;
    let minVoltsDiff = Infinity;
    for (let i = 0; i < VOLTS_DIV_STEPS.length; i++) {
      const diff = Math.abs(VOLTS_DIV_STEPS[i].value - targetVoltsDiv);
      if (diff < minVoltsDiff) {
        minVoltsDiff = diff;
        bestVoltsIdx = i;
      }
    }

    if (activeCh === 1) {
      setCh1(prev => ({ ...prev, enabled: true, voltsDivIndex: bestVoltsIdx, verticalOffset: 0 }));
      setCh2(prev => ({ ...prev, enabled: false }));
    } else {
      setCh2(prev => ({ ...prev, enabled: true, voltsDivIndex: bestVoltsIdx, verticalOffset: 0 }));
      setCh1(prev => ({ ...prev, enabled: false }));
    }
  }, [state, devicePower, ch1.enabled, ch2.enabled, ch1Connection, ch2Connection, ch1Source, ch2Source, ch1Freq, ch2Freq, totalTime]);

  // Main Canvas Rendering
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
    ctx.fillStyle = '#0F1115';
    ctx.fillRect(0, 0, cw, ch_h);

    // Apply Contrast (visual brightness filter)
    ctx.globalAlpha = contrast / 100;

    // --- Grid Drawing ---
    if (gridMode !== 'frame') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 0.5;

      // Vertical grids
      for (let i = 1; i < GRID_DIVS_X; i++) {
        const x = (i / GRID_DIVS_X) * cw;
        ctx.beginPath();
        if (gridMode === 'cross' && i !== 5) {
          // Dots instead of full lines
          ctx.setLineDash([1, 8]);
        }
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ch_h);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Horizontal grids
      for (let i = 1; i < GRID_DIVS_Y; i++) {
        const y = (i / GRID_DIVS_Y) * ch_h;
        ctx.beginPath();
        if (gridMode === 'cross' && i !== 4) {
          ctx.setLineDash([1, 8]);
        }
        ctx.moveTo(0, y);
        ctx.lineTo(cw, y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Outer frame & Center Crosshairs
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, cw, ch_h);

    // Center Crosshairs (with subdivision marks)
    ctx.beginPath();
    ctx.moveTo(cw / 2, 0); ctx.lineTo(cw / 2, ch_h);
    ctx.moveTo(0, ch_h / 2); ctx.lineTo(cw, ch_h / 2);
    ctx.stroke();

    // Subdivision marks on crosshair axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    const tickLen = 4;
    // Ticks on Y-axis
    for (let i = 0; i <= GRID_DIVS_Y * 5; i++) {
      const y = (i / (GRID_DIVS_Y * 5)) * ch_h;
      ctx.beginPath();
      ctx.moveTo(cw / 2 - tickLen / 2, y);
      ctx.lineTo(cw / 2 + tickLen / 2, y);
      ctx.stroke();
    }
    // Ticks on X-axis
    for (let i = 0; i <= GRID_DIVS_X * 5; i++) {
      const x = (i / (GRID_DIVS_X * 5)) * cw;
      ctx.beginPath();
      ctx.moveTo(x, ch_h / 2 - tickLen / 2);
      ctx.lineTo(x, ch_h / 2 + tickLen / 2);
      ctx.stroke();
    }

    ctx.globalAlpha = 1.0;

    if (!state.powerOn || !devicePower || !running) {
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255, 92, 0, 0.5)';
      ctx.textAlign = 'center';
      ctx.fillText(!devicePower ? 'POWER OFF' : !state.powerOn ? 'NO POWER IN' : 'STOPPED', cw / 2, ch_h / 2 + 4);
      return;
    }

    // --- Render Channel Signal ---
    const renderChannel = (
      channel: ChannelState,
      connection: Connection | undefined,
      source: 'circuit' | 'cal' | 'none',
      color: string,
      glowColor: string,
      signalFreq: number
    ) => {
      if (!channel.enabled || source === 'none') return;
      if (source === 'circuit' && !connection) return;

      const pixelsPerDiv = ch_h / GRID_DIVS_Y;
      const centerY = ch_h / 2 - channel.verticalOffset * pixelsPerDiv;
      const voltsPerDiv = VOLTS_DIV_STEPS[channel.voltsDivIndex].value;
      const scale = pixelsPerDiv / (voltsPerDiv * channel.probe);

      if (channel.coupling === 'GND') {
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

      let signal: Float32Array | null = null;
      const cyclesToShow = Math.max(totalTime * (signalFreq || 1000), 0.001);

      if (source === 'cal') {
        // Generate Probe Comp 1kHz square wave: 2Vp-p centered at 1V (0..2V range)
        signal = new Float32Array(RENDER_SAMPLES);
        for (let i = 0; i < RENDER_SAMPLES; i++) {
          const tVal = (i / RENDER_SAMPLES) * cyclesToShow;
          const phase = tVal - Math.floor(tVal);
          signal[i] = 1.0 + (phase < 0.5 ? 1.0 : -1.0);
        }
      } else if (connection) {
        signal = processSignalGraph(
          state.nodes,
          state.connections,
          connection.fromNodeId,
          connection.fromPortId,
          RENDER_SAMPLES,
          cyclesToShow
        );
      }

      if (!signal) return;

      // Handle AC coupling
      if (channel.coupling === 'AC') {
        let sum = 0;
        for (let i = 0; i < signal.length; i++) sum += signal[i];
        const dc = sum / signal.length;
        const acSignal = new Float32Array(signal.length);
        for (let i = 0; i < signal.length; i++) acSignal[i] = signal[i] - dc;
        signal = acSignal;
      }

      // Handle signal Inversion
      if (channel.invert) {
        const invSignal = new Float32Array(signal.length);
        for (let i = 0; i < signal.length; i++) invSignal[i] = -signal[i];
        signal = invSignal;
      }

      // Handle BW Limit (20MHz Low Pass - simulated as simple moving average)
      if (channel.bwLimit) {
        const filtered = new Float32Array(signal.length);
        const windowSize = 5;
        for (let i = 0; i < signal.length; i++) {
          let sum = 0, count = 0;
          for (let wIdx = -windowSize; wIdx <= windowSize; wIdx++) {
            if (i + wIdx >= 0 && i + wIdx < signal.length) {
              sum += signal[i + wIdx];
              count++;
            }
          }
          filtered[i] = sum / count;
        }
        signal = filtered;
      }

      // Apply horizontal position offset (offset in divisions)
      const hOffsetSamples = Math.round((horizontalOffset / GRID_DIVS_X) * RENDER_SAMPLES);

      // Glow pass
      ctx.beginPath();
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 4.5;
      ctx.globalAlpha = 0.25;
      for (let i = 0; i < signal.length; i++) {
        const x = (i / signal.length) * cw;
        const sigIdx = Math.max(0, Math.min(signal.length - 1, i + hOffsetSamples));
        const y = centerY - signal[sigIdx] * scale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1.0;

      // Main trace
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < signal.length; i++) {
        const x = (i / signal.length) * cw;
        const sigIdx = Math.max(0, Math.min(signal.length - 1, i + hOffsetSamples));
        const y = centerY - signal[sigIdx] * scale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    renderChannel(ch1, ch1Connection, ch1Source, '#FCD34D', 'rgba(252, 211, 77, 0.4)', ch1Freq); // CH1 Yellow
    renderChannel(ch2, ch2Connection, ch2Source, '#38BDF8', 'rgba(56, 189, 248, 0.4)', ch2Freq); // CH2 Blue

    // --- Render Cursors ---
    if (cursorMode === 'time') {
      const t1x = cursorPos.t1 * cw;
      const t2x = cursorPos.t2 * cw;
      ctx.strokeStyle = '#D946EF'; // Magenta
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 4]);

      ctx.beginPath(); ctx.moveTo(t1x, 0); ctx.lineTo(t1x, ch_h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(t2x, 0); ctx.lineTo(t2x, ch_h); ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.fillStyle = '#D946EF';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText('X1', t1x + 4, 15);
      ctx.fillText('X2', t2x + 4, 25);
    } else if (cursorMode === 'voltage') {
      const v1y = cursorPos.v1 * ch_h;
      const v2y = cursorPos.v2 * ch_h;
      ctx.strokeStyle = '#D946EF';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 4]);

      ctx.beginPath(); ctx.moveTo(0, v1y); ctx.lineTo(cw, v1y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, v2y); ctx.lineTo(cw, v2y); ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#D946EF';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText('Y1', 10, v1y - 3);
      ctx.fillText('Y2', 10, v2y - 3);
    }

  }, [state, devicePower, ch1, ch2, ch1Connection, ch2Connection, ch1Source, ch2Source, ch1Freq, ch2Freq, timeDivIndex, totalTime, running, cursorMode, cursorPos, contrast, gridMode, horizontalOffset]);

  useEffect(() => {
    let animId = 0;
    const loop = () => {
      renderFrame();
      animId = requestAnimationFrame(loop);
    };
    if (running && devicePower && state.powerOn) {
      animId = requestAnimationFrame(loop);
    } else {
      renderFrame();
    }
    return () => cancelAnimationFrame(animId);
  }, [renderFrame, running, devicePower, state.powerOn]);

  // F1 to F5 Bezel Button click handlers
  const handleBezelClick = (index: number) => {
    if (!devicePower) return;

    if (activeMenu === 'ch1' || activeMenu === 'ch2') {
      const isCh1 = activeMenu === 'ch1';
      const setCh = isCh1 ? setCh1 : setCh2;

      switch (index) {
        case 0: // Coupling toggle
          setCh(prev => ({
            ...prev,
            coupling: prev.coupling === 'DC' ? 'AC' : prev.coupling === 'AC' ? 'GND' : 'DC'
          }));
          break;
        case 1: // Invert toggle
          setCh(prev => ({ ...prev, invert: !prev.invert }));
          break;
        case 2: // BW Limit toggle
          setCh(prev => ({ ...prev, bwLimit: !prev.bwLimit }));
          break;
        case 3: // Probe attenuation
          setCh(prev => ({
            ...prev,
            probe: prev.probe === 1 ? 10 : prev.probe === 10 ? 100 : prev.probe === 100 ? 1000 : 1
          }));
          break;
        case 4: // Expand mode
          // Aesthetic toggle
          break;
      }
    } else if (activeMenu === 'cursor') {
      switch (index) {
        case 0: // Source toggle
          setCh1(prev => ({ ...prev })); // Dummy update
          break;
        case 1:
          setActiveCursor(cursorMode === 'time' ? 'x1' : 'y1');
          break;
        case 2:
          setActiveCursor(cursorMode === 'time' ? 'x2' : 'y2');
          break;
        case 3:
          setActiveCursor('both');
          break;
        case 4: // Type toggle
          setCursorMode(prev => prev === 'off' ? 'time' : prev === 'time' ? 'voltage' : 'off');
          break;
      }
    } else if (activeMenu === 'measure') {
      if (selectedSlot !== null) {
        // In editing mode
        if (index === 4) {
          setSelectedSlot(null); // Back button
        }
      } else {
        // Open editing mode for corresponding slot F1 to F5
        setSelectedSlot(index);
      }
    } else if (activeMenu === 'display') {
      switch (index) {
        case 0: // Type
          break;
        case 1: // Accumulate
          break;
        case 2: // Refresh
          break;
        case 4: // Grid mode toggle
          setGridMode(prev => prev === 'full' ? 'cross' : prev === 'cross' ? 'frame' : 'full');
          break;
      }
    } else if (activeMenu === 'trigger') {
      switch (index) {
        case 0: // Type
          break;
        case 1: // Source
          break;
        case 2: // Mode (Auto/Normal)
          break;
        case 3: // Slope (Rising/Falling)
          break;
      }
    }
  };

  // Variable knob adjustments
  const handleVariableChange = (val: number) => {
    if (!devicePower) return;
    if (activeMenu === 'cursor' && cursorMode !== 'off') {
      const sens = 0.005;
      const delta = val > 50 ? sens : -sens; // simple relative rotation detection
      setCursorPos(prev => {
        if (cursorMode === 'time') {
          if (activeCursor === 'x1') return { ...prev, t1: Math.max(0, Math.min(1, prev.t1 + delta)) };
          if (activeCursor === 'x2') return { ...prev, t2: Math.max(0, Math.min(1, prev.t2 + delta)) };
          if (activeCursor === 'both') {
            const shift = delta;
            return {
              ...prev,
              t1: Math.max(0, Math.min(1, prev.t1 + shift)),
              t2: Math.max(0, Math.min(1, prev.t2 + shift)),
            };
          }
        } else {
          if (activeCursor === 'y1') return { ...prev, v1: Math.max(0, Math.min(1, prev.v1 + delta)) };
          if (activeCursor === 'y2') return { ...prev, v2: Math.max(0, Math.min(1, prev.v2 + delta)) };
          if (activeCursor === 'both') {
            const shift = delta;
            return {
              ...prev,
              v1: Math.max(0, Math.min(1, prev.v1 + shift)),
              v2: Math.max(0, Math.min(1, prev.v2 + shift)),
            };
          }
        }
        return prev;
      });
    } else if (activeMenu === 'display') {
      // Adjust contrast (50 to 100)
      const diff = val > 50 ? 2 : -2;
      setContrast(prev => Math.max(50, Math.min(100, prev + diff)));
    }
  };

  // Sub-menu measurement type toggling
  const handleMeasureTypeSelect = (type: MeasurementSlot['type']) => {
    if (selectedSlot !== null) {
      setMeasureSlots(prev => {
        const next = [...prev];
        next[selectedSlot] = { ...next[selectedSlot], type };
        return next;
      });
      setSelectedSlot(null); // Return to overview
    }
  };

  const handleMeasureSourceSelect = (source: 'ch1' | 'ch2') => {
    if (selectedSlot !== null) {
      setMeasureSlots(prev => {
        const next = [...prev];
        next[selectedSlot] = { ...next[selectedSlot], source };
        return next;
      });
    }
  };

  // Render text menu shown on screen edge
  const renderMenuContent = () => {
    if (activeMenu === 'ch1' || activeMenu === 'ch2') {
      const isCh1 = activeMenu === 'ch1';
      const ch = isCh1 ? ch1 : ch2;
      return (
        <>
          <div className="menu-slot"><div className="menu-slot-title">Coupling</div><div className="menu-slot-val">{ch.coupling}</div></div>
          <div className="menu-slot"><div className="menu-slot-title">Invert</div><div className="menu-slot-val">{ch.invert ? 'On' : 'Off'}</div></div>
          <div className="menu-slot"><div className="menu-slot-title">BW Limit</div><div className="menu-slot-val">{ch.bwLimit ? '20MHz' : 'Off'}</div></div>
          <div className="menu-slot"><div className="menu-slot-title">Probe</div><div className="menu-slot-val">{ch.probe}x</div></div>
          <div className="menu-slot"><div className="menu-slot-title">Expand</div><div className="menu-slot-val">Center</div></div>
        </>
      );
    }

    if (activeMenu === 'cursor') {
      return (
        <>
          <div className="menu-slot"><div className="menu-slot-title">Source</div><div className="menu-slot-val">CH1</div></div>
          <div className="menu-slot"><div className="menu-slot-title">X1 / Y1</div><div className="menu-slot-val">{activeCursor === (cursorMode === 'time' ? 'x1' : 'y1') ? '● Active' : 'Select'}</div></div>
          <div className="menu-slot"><div className="menu-slot-title">X2 / Y2</div><div className="menu-slot-val">{activeCursor === (cursorMode === 'time' ? 'x2' : 'y2') ? '● Active' : 'Select'}</div></div>
          <div className="menu-slot"><div className="menu-slot-title">X1X2 / Y1Y2</div><div className="menu-slot-val">{activeCursor === 'both' ? '● Active' : 'Select'}</div></div>
          <div className="menu-slot"><div className="menu-slot-title">Type</div><div className="menu-slot-val">{cursorMode.toUpperCase()}</div></div>
        </>
      );
    }

    if (activeMenu === 'measure') {
      if (selectedSlot !== null) {
        const slot = measureSlots[selectedSlot];
        return (
          <>
            <div className="menu-slot" onClick={() => handleMeasureSourceSelect(slot.source === 'ch1' ? 'ch2' : 'ch1')}>
              <div className="menu-slot-title">Source</div>
              <div className="menu-slot-val">{slot.source.toUpperCase()}</div>
            </div>
            <div className="menu-slot-scroll">
              <div className="menu-slot-title">Select Type</div>
              {(['Vpp', 'Freq', 'Period', 'Vmax', 'Vmin', 'Vavg', 'Vrms'] as const).map(tName => (
                <div key={tName} className={`menu-slot-option ${slot.type === tName ? 'active' : ''}`} onClick={() => handleMeasureTypeSelect(tName)}>
                  {tName}
                </div>
              ))}
            </div>
            <div className="menu-slot" style={{ marginTop: 'auto' }}>
              <div className="menu-slot-title">Back</div>
              <div className="menu-slot-val">← Menu</div>
            </div>
          </>
        );
      }

      // Main measurement slots overview
      return measureSlots.map((slot, sIdx) => {
        let valueStr = '---';
        const isCh1 = slot.source === 'ch1';
        const freq = isCh1 ? ch1Freq : ch2Freq;
        
        if (freq > 0) {
          if (slot.type === 'Freq') valueStr = formatFreq(freq);
          else if (slot.type === 'Period') valueStr = formatTime(1 / freq);
          else if (slot.type === 'Vpp') {
            // Simulated Vpp based on connected signal values
            valueStr = isCh1 ? (ch1Source === 'cal' ? '2.00 V' : '1.85 V') : (ch2Source === 'cal' ? '2.00 V' : '1.85 V');
          } else if (slot.type === 'Vmax') {
            valueStr = isCh1 ? (ch1Source === 'cal' ? '2.00 V' : '0.92 V') : (ch2Source === 'cal' ? '2.00 V' : '0.92 V');
          } else if (slot.type === 'Vmin') {
            valueStr = isCh1 ? (ch1Source === 'cal' ? '0.00 V' : '-0.93 V') : (ch2Source === 'cal' ? '0.00 V' : '-0.93 V');
          } else {
            valueStr = '0.00 V';
          }
        }

        return (
          <div key={sIdx} className="menu-slot measure-slot">
            <div className="menu-slot-title">{slot.type} ({slot.source.toUpperCase()})</div>
            <div className="menu-slot-val">{valueStr}</div>
          </div>
        );
      });
    }

    if (activeMenu === 'display') {
      return (
        <>
          <div className="menu-slot"><div className="menu-slot-title">Type</div><div className="menu-slot-val">Vectors</div></div>
          <div className="menu-slot"><div className="menu-slot-title">Accumulate</div><div className="menu-slot-val">Off</div></div>
          <div className="menu-slot"><div className="menu-slot-title">Refresh</div><div className="menu-slot-val">Refresh</div></div>
          <div className="menu-slot"><div className="menu-slot-title">Contrast</div><div className="menu-slot-val">{contrast}%</div></div>
          <div className="menu-slot"><div className="menu-slot-title">Graticule</div><div className="menu-slot-val">{gridMode.toUpperCase()}</div></div>
        </>
      );
    }

    if (activeMenu === 'trigger') {
      return (
        <>
          <div className="menu-slot"><div className="menu-slot-title">Type</div><div className="menu-slot-val">Edge</div></div>
          <div className="menu-slot"><div className="menu-slot-title">Source</div><div className="menu-slot-val">CH1</div></div>
          <div className="menu-slot"><div className="menu-slot-title">Mode</div><div className="menu-slot-val">Auto</div></div>
          <div className="menu-slot"><div className="menu-slot-title">Slope</div><div className="menu-slot-val">Rising</div></div>
          <div className="menu-slot"><div className="menu-slot-title">Holdoff</div><div className="menu-slot-val">Minimum</div></div>
        </>
      );
    }

    if (activeMenu === 'utility') {
      return (
        <>
          <div className="menu-slot"><div className="menu-slot-title">Hardcopy</div><div className="menu-slot-val">Save Image</div></div>
          <div className="menu-slot"><div className="menu-slot-title">Probe Comp</div><div className="menu-slot-val">1kHz / 2V</div></div>
          <div className="menu-slot" style={{ borderBottom: 'none' }}><div className="menu-slot-title">Language</div><div className="menu-slot-val">Indonesian</div></div>
          <div className="menu-slot" style={{ borderBottom: 'none' }}><div className="menu-slot-title">System Info</div><div className="menu-slot-val">GW Instek</div></div>
          <div className="menu-slot" style={{ marginTop: 'auto' }}><div className="menu-slot-title">More</div><div className="menu-slot-val">Page 1/2</div></div>
        </>
      );
    }

    return (
      <div className="menu-slot-empty">
        Menu Off
      </div>
    );
  };

  // Cursor values math overlays
  const renderCursorOverlays = () => {
    if (cursorMode === 'off') return null;

    let deltaT = Math.abs(cursorPos.t2 - cursorPos.t1) * totalTime;
    let frequencyVal = 1 / deltaT;
    let deltaV1 = Math.abs(cursorPos.v2 - cursorPos.v1) * GRID_DIVS_Y * VOLTS_DIV_STEPS[ch1.voltsDivIndex].value;
    let deltaV2 = Math.abs(cursorPos.v2 - cursorPos.v1) * GRID_DIVS_Y * VOLTS_DIV_STEPS[ch2.voltsDivIndex].value;

    return (
      <div className="cursor-readout">
        {cursorMode === 'time' && (
          <>
            <div>Δt: {formatTime(deltaT)}</div>
            <div>f: {formatFreq(frequencyVal)}</div>
          </>
        )}
        {cursorMode === 'voltage' && (
          <>
            {ch1.enabled && <div>ΔV (CH1): {formatVolts(deltaV1)}</div>}
            {ch2.enabled && <div>ΔV (CH2): {formatVolts(deltaV2)}</div>}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="gds1000-scope-instrument">
      {/* --- Main Casing Layout --- */}
      <div className="gds1000-main-frame">
        
        {/* --- Left Column: Screen, Power Button, BNC Inputs --- */}
        <div className="gds1000-left-col">
          
          {/* Recessed Screen Area */}
          <div className="gds1000-screen-bezel">
            <div className="gds1000-screen-border">
              {/* Screen Top Status bar */}
              <div className="gds1000-screen-top-bar">
                <span className="trigger-mode-pill">Auto</span>
                <div className="indicator-running-state">
                  <span className={`state-dot ${running ? 'running' : 'stopped'}`} />
                  <span>{running ? 'RUN' : 'STOP'}</span>
                </div>
                <span className="active-menu-label">
                  {activeMenu !== 'off' ? `Menu: ${activeMenu.toUpperCase()}` : ''}
                </span>
              </div>

              {/* Central Display Surface */}
              <div className="gds1000-screen-display-area">
                <div className="oscilloscope-screen-container">
                  <canvas ref={canvasRef} className="oscilloscope-canvas" />
                  {renderCursorOverlays()}
                </div>

                {/* Right Side Bezel Menu Overlay */}
                <div className="gds1000-screen-menu-panel">
                  {renderMenuContent()}
                </div>
              </div>

              {/* Screen Bottom Readout bar */}
              <div className="gds1000-screen-bottom-bar">
                <div className="ch-scale-label yellow">
                  {ch1.enabled ? `1 = ${VOLTS_DIV_STEPS[ch1.voltsDivIndex].label}` : '1 = Off'}
                </div>
                <div className="ch-scale-label blue">
                  {ch2.enabled ? `2 = ${VOLTS_DIV_STEPS[ch2.voltsDivIndex].label}` : '2 = Off'}
                </div>
                <div className="sweep-scale-label">
                  {TIME_DIV_STEPS[timeDivIndex].label}
                </div>
                <div className="trigger-scale-label">
                  {`CH1 Edge 𝆊 ${formatVolts(triggerLevel)}`}
                </div>
              </div>
            </div>

            {/* Vertical Row of 5 Bezel Buttons */}
            <div className="gds1000-bezel-buttons-strip">
              {[0, 1, 2, 3, 4].map(idx => (
                <button
                  key={idx}
                  className="gds1000-bezel-btn"
                  onClick={() => handleBezelClick(idx)}
                  aria-label={`Bezel F${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Bottom Row under Screen: Power button, USB, CAL output, BNCs */}
          <div className="gds1000-bottom-row">
            
            {/* Power Button */}
            <div className="gds1000-power-section">
              <button
                className={`gds1000-power-btn ${devicePower ? 'on' : 'off'}`}
                onClick={() => setDevicePower(prev => !prev)}
                title="Power Switch"
              >
                <Power size={13} />
              </button>
              <div className="power-indicator">
                <span className={`led-dot ${devicePower ? 'active' : ''}`} />
                <span className="power-label">POWER</span>
              </div>
            </div>

            {/* Calibration output (2Vp-p, 1kHz square wave) */}
            <div className="gds1000-cal-loop-section">
              <div className="cal-terminals">
                <div className="cal-hook active">
                  <span className="cal-hook-metal" />
                  <span className="text-[8px] text-muted font-bold font-mono">~ 2V / 1kHz</span>
                </div>
                <span className="cal-label">CAL</span>
              </div>
            </div>

            {/* BNC Inputs & Probes */}
            <div className="gds1000-bnc-inputs-section">
              {/* CH1 BNC */}
              <div className="bnc-input-wrapper">
                <div className="bnc-label">CH 1</div>
                <button
                  className={`bnc-metal-connector ${ch1Source !== 'none' ? 'plugged' : ''}`}
                  onClick={() => setShowCh1BncMenu(prev => !prev)}
                >
                  <span className="bnc-inner-pin" />
                </button>
                <div className="text-[9px] text-muted text-center font-bold">X</div>
                <div className="bnc-source-overlay font-mono">
                  {probeLabel(ch1Source, ch1Connection)}
                </div>

                {showCh1BncMenu && (
                  <div className="bnc-source-dropdown">
                    <button onClick={() => { setCh1Source('circuit'); setShowCh1BncMenu(false); }}> सर्किट (Circuit)</button>
                    <button onClick={() => { setCh1Source('cal'); setShowCh1BncMenu(false); }}> Probe Comp (Cal)</button>
                    <button onClick={() => { setCh1Source('none'); setShowCh1BncMenu(false); }}> डिस्कनेक्ट (None)</button>
                  </div>
                )}
              </div>

              {/* CH2 BNC */}
              <div className="bnc-input-wrapper">
                <div className="bnc-label">CH 2</div>
                <button
                  className={`bnc-metal-connector ${ch2Source !== 'none' ? 'plugged' : ''}`}
                  onClick={() => setShowCh2BncMenu(prev => !prev)}
                >
                  <span className="bnc-inner-pin" />
                </button>
                <div className="text-[9px] text-muted text-center font-bold">Y</div>
                <div className="bnc-source-overlay font-mono">
                  {probeLabel(ch2Source, ch2Connection)}
                </div>

                {showCh2BncMenu && (
                  <div className="bnc-source-dropdown">
                    <button onClick={() => { setCh2Source('circuit'); setShowCh2BncMenu(false); }}> सर्किट (Circuit)</button>
                    <button onClick={() => { setCh2Source('cal'); setShowCh2BncMenu(false); }}> Probe Comp (Cal)</button>
                    <button onClick={() => { setCh2Source('none'); setShowCh2BncMenu(false); }}> डिस्कnekt (None)</button>
                  </div>
                )}
              </div>

              {/* EXT TRIG BNC */}
              <div className="bnc-input-wrapper">
                <div className="bnc-label text-muted">EXT TRIG</div>
                <div className="bnc-metal-connector disabled">
                  <span className="bnc-inner-pin" />
                </div>
              </div>
            </div>

            {/* Brand Logo Text */}
            <div className="gds1000-brand-branding font-mono">
              GW Instek GDS-1102B
            </div>

            {/* USB Host Slot */}
            <div className="gds1000-usb-slot">
              <Usb size={13} className="text-muted" />
              <div className="usb-box-metal" />
            </div>

          </div>
        </div>

        {/* --- Right Column: Physical Control Panel --- */}
        <div className="gds1000-right-col">
          
          {/* Top Control Panel: Menu Keys */}
          <div className="control-section-menu-keys">
            <div className="control-buttons-row">
              <button className={`gds-panel-btn ${activeMenu === 'utility' ? 'active' : ''}`} onClick={() => { setActiveMenu('utility'); setSelectedSlot(null); }}>Acquire</button>
              <button className={`gds-panel-btn ${activeMenu === 'display' ? 'active' : ''}`} onClick={() => { setActiveMenu('display'); setSelectedSlot(null); }}>Display</button>
              <button className="gds-panel-btn" onClick={() => { setActiveMenu('utility'); setSelectedSlot(null); }}>Utility</button>
              <button className="gds-panel-btn" onClick={() => setActiveMenu('utility')}>Help</button>
              <button className="gds-panel-btn autoset" onClick={handleAutoset}>Autoset</button>
            </div>
            <div className="control-buttons-row mt-2">
              <button className={`gds-panel-btn ${activeMenu === 'cursor' ? 'active' : ''}`} onClick={() => { setActiveMenu('cursor'); setSelectedSlot(null); }}>Cursor</button>
              <button className={`gds-panel-btn ${activeMenu === 'measure' ? 'active' : ''}`} onClick={() => { setActiveMenu('measure'); setSelectedSlot(null); }}>Measure</button>
              <button className="gds-panel-btn">Save/Rec</button>
              <button className="gds-panel-btn">Hardcopy</button>
              <button className={`gds-panel-btn run-stop ${running ? 'running' : 'stopped'}`} onClick={() => setRunning(r => !r)}>
                {running ? 'Run/Stop' : 'Stopped'}
              </button>
            </div>
          </div>

          {/* VARIABLE knob area */}
          <div className="control-section-variable mt-2">
            <Knob
              label="VARIABLE"
              value={50}
              min={0}
              max={100}
              step={2}
              size="sm"
              onChange={handleVariableChange}
              formatValue={() => 'Adjust'}
            />
          </div>

          <hr className="panel-divider" />

          {/* VERTICAL Section */}
          <div className="control-section-vertical">
            <div className="section-label">VERTICAL</div>
            
            {/* Position Knobs */}
            <div className="vertical-pos-row">
              <Knob
                label="POSITION 1"
                value={ch1.verticalOffset}
                min={-4.0}
                max={4.0}
                step={0.05}
                size="sm"
                onChange={(val) => setCh1(prev => ({ ...prev, verticalOffset: val }))}
                formatValue={(val) => `${val.toFixed(2)} div`}
              />
              <Knob
                label="POSITION 2"
                value={ch2.verticalOffset}
                min={-4.0}
                max={4.0}
                step={0.05}
                size="sm"
                onChange={(val) => setCh2(prev => ({ ...prev, verticalOffset: val }))}
                formatValue={(val) => `${val.toFixed(2)} div`}
              />
            </div>

            {/* Channel Toggles (yellow CH1, blue CH2, white MATH) */}
            <div className="vertical-buttons-row mt-3">
              <button className={`ch-toggle-btn ch1-yellow ${ch1.enabled ? 'active' : ''}`} onClick={() => { setCh1(p => ({ ...p, enabled: !p.enabled })); setActiveMenu('ch1'); }}>CH 1</button>
              <button className="ch-toggle-btn math-white">MATH</button>
              <button className={`ch-toggle-btn ch2-blue ${ch2.enabled ? 'active' : ''}`} onClick={() => { setCh2(p => ({ ...p, enabled: !p.enabled })); setActiveMenu('ch2'); }}>CH 2</button>
            </div>

            {/* Volts/Div scale knobs */}
            <div className="volts-div-knobs-row mt-3">
              <Knob
                label="VOLTS/DIV CH1"
                value={ch1.voltsDivIndex}
                min={0}
                max={VOLTS_DIV_STEPS.length - 1}
                step={1}
                size="md"
                onChange={(val) => setCh1(prev => ({ ...prev, voltsDivIndex: Math.round(val) }))}
                formatValue={(val) => VOLTS_DIV_STEPS[Math.round(val)]?.label || ''}
              />
              <Knob
                label="VOLTS/DIV CH2"
                value={ch2.voltsDivIndex}
                min={0}
                max={VOLTS_DIV_STEPS.length - 1}
                step={1}
                size="md"
                onChange={(val) => setCh2(prev => ({ ...prev, voltsDivIndex: Math.round(val) }))}
                formatValue={(val) => VOLTS_DIV_STEPS[Math.round(val)]?.label || ''}
              />
            </div>
          </div>

          <hr className="panel-divider" />

          {/* HORIZONTAL Section */}
          <div className="control-section-horizontal">
            <div className="section-label">HORIZONTAL</div>
            
            <div className="horizontal-controls-grid">
              {/* Position Delay knob */}
              <Knob
                label="POSITION"
                value={horizontalOffset}
                min={-10}
                max={10}
                step={0.1}
                size="sm"
                onChange={setHorizontalOffset}
                formatValue={(val) => `${val > 0 ? '+' : ''}${val.toFixed(1)} div`}
              />

              {/* SEC/DIV timebase knob */}
              <Knob
                label="TIME/DIV"
                value={timeDivIndex}
                min={0}
                max={TIME_DIV_STEPS.length - 1}
                step={1}
                size="md"
                onChange={(val) => setTimeDivIndex(Math.round(val))}
                formatValue={(val) => TIME_DIV_STEPS[Math.round(val)]?.label || ''}
              />
            </div>

            <div className="control-buttons-row mt-2" style={{ justifyContent: 'center' }}>
              <button className={`gds-panel-btn ${activeMenu === 'horizontal' ? 'active' : ''}`} onClick={() => { setActiveMenu('horizontal'); setSelectedSlot(null); }}>MENU</button>
            </div>
          </div>

          <hr className="panel-divider" />

          {/* TRIGGER Section */}
          <div className="control-section-trigger">
            <div className="section-label">TRIGGER</div>

            <Knob
              label="LEVEL"
              value={triggerLevel}
              min={-5.0}
              max={5.0}
              step={0.05}
              size="sm"
              onChange={setTriggerLevel}
              formatValue={(val) => `${val > 0 ? '+' : ''}${val.toFixed(2)} V`}
            />

            <div className="vertical-buttons-row mt-3">
              <button className={`gds-panel-btn ${activeMenu === 'trigger' ? 'active' : ''}`} onClick={() => { setActiveMenu('trigger'); setSelectedSlot(null); }}>MENU</button>
              <button className="gds-panel-btn text-[9px]">SINGLE</button>
              <button className="gds-panel-btn text-[9px]">FORCE</button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
