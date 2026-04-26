interface LEDProps {
  color: 'green' | 'red' | 'amber' | 'cyan' | 'off';
  size?: 'sm' | 'lg';
  label?: string;
}

export default function LED({ color, size, label }: LEDProps) {
  const colorClass = color === 'off' ? 'led-off' : `led-${color}`;
  const sizeClass = size === 'lg' ? 'led-lg' : '';

  return (
    <span
      className={`led-indicator ${colorClass} ${sizeClass}`}
      title={label}
      aria-label={label}
    />
  );
}
