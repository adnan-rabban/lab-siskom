import { useCallback } from 'react';

interface ToggleSwitchProps {
  label?: string;
  active: boolean;
  onChange: (active: boolean) => void;
  labelOn?: string;
  labelOff?: string;
}

export default function ToggleSwitch({
  label,
  active,
  onChange,
  labelOn,
  labelOff,
}: ToggleSwitchProps) {
  const handleClick = useCallback(() => {
    onChange(!active);
  }, [active, onChange]);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      onChange(!active);
    },
    [active, onChange]
  );

  const displayLabel = label ?? (active ? (labelOn ?? 'ON') : (labelOff ?? 'OFF'));

  return (
    <div
      className={`toggle-switch ${active ? 'active' : ''}`}
      onClick={handleClick}
      onTouchEnd={handleTouchEnd}
      role="switch"
      aria-checked={active}
      aria-label={displayLabel}
      tabIndex={0}
    >
      <div className={`toggle-track ${active ? 'active' : ''}`}>
        <div className="toggle-thumb" />
      </div>
      <span className="toggle-label">{displayLabel}</span>
    </div>
  );
}
