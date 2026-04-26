interface ModulationMeterProps {
  value: number; // 0..100+
  label?: string;
}

export default function ModulationMeter({ value, label }: ModulationMeterProps) {
  const clampedWidth = Math.min(value, 120); // allow slight overflow for >100%

  let fillClass = 'low';
  if (value > 100) fillClass = 'over';
  else if (value > 80) fillClass = 'high';
  else if (value > 50) fillClass = 'medium';

  return (
    <div className="modulation-meter">
      <span className="modulation-meter-label">{label || 'Modulation Index (m%)'}</span>
      <div className="modulation-meter-bar">
        <div
          className={`modulation-meter-fill ${fillClass}`}
          style={{ width: `${Math.min(clampedWidth, 100)}%` }}
        />
      </div>
      <div className="modulation-meter-scale">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>
      <span className="modulation-meter-value">{value.toFixed(1)}%</span>
    </div>
  );
}
