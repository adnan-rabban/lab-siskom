interface TerminalProps {
  id: string;
  label: string;
  direction: 'input' | 'output';
  connected: boolean;
  onClick?: () => void;
}

export default function Terminal({ id, label, direction, connected, onClick }: TerminalProps) {
  return (
    <div
      id={`terminal-${id}`}
      className={`terminal ${direction} ${connected ? 'connected' : ''}`}
      onClick={onClick}
      onTouchEnd={(e) => {
        e.preventDefault();
        onClick?.();
      }}
      role="button"
      aria-label={`${label} (${direction})`}
      tabIndex={0}
    >
      <div className="terminal-jack" />
      <span className="terminal-label">{label}</span>
    </div>
  );
}
