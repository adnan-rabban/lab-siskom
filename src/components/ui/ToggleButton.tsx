'use client';
import React from 'react';

// ToggleButton — misalnya OUTPUT on/off, POWER, RUN/STOP
interface ToggleButtonProps {
  label: string;
  subLabel?: string;
  isOn: boolean;
  onToggle: () => void;
  ledColor?: string;       // warna LED saat ON
  width?: number;
  disabled?: boolean;
  variant?: 'normal' | 'power' | 'runstop';
}

export function ToggleButton({
  label, subLabel, isOn, onToggle,
  ledColor = '#4ADE80', width = 52, disabled = false, variant = 'normal',
}: ToggleButtonProps) {
  const bgColor = variant === 'power'
    ? (isOn ? '#7F1D1D' : '#1F2937')
    : variant === 'runstop'
    ? (isOn ? '#14532D' : '#7F1D1D')
    : '#1F2937';

  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      style={{
        width,
        minHeight: 36,
        backgroundColor: bgColor,
        border: '1px solid #374151',
        borderBottom: '3px solid #111',
        borderRadius: 3,
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: '4px 4px 2px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        transition: 'background-color 0.1s',
        opacity: disabled ? 0.4 : 1,
        userSelect: 'none',
      }}
    >
      {/* LED indicator */}
      <div style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        backgroundColor: isOn ? ledColor : '#374151',
        boxShadow: isOn ? `0 0 4px ${ledColor}, 0 0 8px ${ledColor}40` : 'none',
        transition: 'all 0.15s',
      }} />

      {/* Label */}
      <span style={{
        fontSize: 9,
        color: isOn ? '#F9FAFB' : '#9CA3AF',
        fontWeight: 500,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        lineHeight: 1,
      }}>
        {label}
      </span>

      {subLabel && (
        <span style={{ fontSize: 7.5, color: '#6B7280', lineHeight: 1 }}>
          {subLabel}
        </span>
      )}
    </button>
  );
}

// SelectorButton — cycle beberapa opsi. Mis: waveform, gate time
interface SelectorButtonProps<T extends string | number> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  width?: number;
  disabled?: boolean;
  renderOption?: (opt: T) => React.ReactNode;
}

export function SelectorButton<T extends string | number>({
  options, value, onChange, label,
  width = 64, disabled = false, renderOption,
}: SelectorButtonProps<T>) {
  const handleClick = () => {
    if (disabled) return;
    const idx = options.indexOf(value);
    onChange(options[(idx + 1) % options.length]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      {label && (
        <span style={{ fontSize: 8, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
      )}
      <button
        onClick={handleClick}
        disabled={disabled}
        style={{
          width,
          height: 32,
          backgroundColor: '#1F2937',
          border: '1px solid #374151',
          borderBottom: '3px solid #111',
          borderRadius: 3,
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          opacity: disabled ? 0.4 : 1,
          userSelect: 'none',
        }}
      >
        {/* Current value */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {renderOption ? renderOption(value) : (
            <span style={{ fontSize: 10, color: '#F9FAFB', fontWeight: 500 }}>
              {value}
            </span>
          )}
        </div>

        {/* Dots indicator */}
        <div style={{ display: 'flex', gap: 2 }}>
          {options.map((opt) => (
            <div
              key={opt}
              style={{
                width: 3,
                height: 3,
                borderRadius: '50%',
                backgroundColor: opt === value ? '#4ADE80' : '#374151',
              }}
            />
          ))}
        </div>
      </button>
    </div>
  );
}

// PanelButton — tombol biasa tanpa LED (AUTOSET, SINGLE, dll)
interface PanelButtonProps {
  label: string;
  subLabel?: string;
  onClick: () => void;
  width?: number;
  color?: string;
  disabled?: boolean;
  isActive?: boolean;
}

export function PanelButton({
  label, subLabel, onClick,
  width = 52, color = '#374151', disabled = false, isActive = false,
}: PanelButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width,
        minHeight: 30,
        backgroundColor: isActive ? '#1D4ED8' : '#1F2937',
        border: `1px solid ${isActive ? '#3B82F6' : '#374151'}`,
        borderBottom: '3px solid #111',
        borderRadius: 3,
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: '3px 4px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        opacity: disabled ? 0.4 : 1,
        userSelect: 'none',
        transition: 'background-color 0.1s',
      }}
    >
      <span style={{
        fontSize: 9,
        color: isActive ? '#BFDBFE' : '#D1D5DB',
        fontWeight: 500,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        lineHeight: 1,
      }}>
        {label}
      </span>
      {subLabel && (
        <span style={{ fontSize: 7, color: '#6B7280', lineHeight: 1 }}>{subLabel}</span>
      )}
    </button>
  );
}