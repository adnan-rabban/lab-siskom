import type { CSSProperties } from 'react';

/**
 * Thin wrapper around Google Material Symbols Rounded.
 * Usage: <Icon name="bolt" size={18} />
 * `name` is the Material Symbols ligature name (lowercase, underscores).
 */
export default function Icon({
  name,
  size,
  className = '',
  style,
}: {
  name: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={`material-symbols-rounded ${className}`}
      style={{ fontSize: size, ...style }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
