import { useState } from 'react';
import type { GradingResult } from '../engine/GradingEngine';
import { X, Check, Minus, Circle } from 'lucide-react';

interface ScoreCardProps {
  result: GradingResult;
  onClose: () => void;
  t: (id: string, en: string) => string;
}

export default function ScoreCard({ result, onClose, t }: ScoreCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const gradeLabel =
    result.percentage >= 85 ? 'A' :
    result.percentage >= 70 ? 'B' :
    result.percentage >= 55 ? 'C' :
    result.percentage >= 40 ? 'D' : 'E';

  const gradeColor =
    result.percentage >= 85 ? 'var(--accent-green)' :
    result.percentage >= 70 ? 'var(--accent-cyan)' :
    result.percentage >= 55 ? 'var(--accent-amber)' :
    'var(--accent-red)';

  // SVG circular progress
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (result.percentage / 100) * circumference;

  return (
    <div className="scorecard-overlay" onClick={onClose}>
      <div className="scorecard-modal" onClick={e => e.stopPropagation()}>
        <div className="scorecard-header">
          <h2 className="scorecard-title">{t('Hasil Penilaian', 'Assessment Results')}</h2>
          <button className="scorecard-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="scorecard-body">
          {/* Circular Score */}
          <div className="scorecard-ring-section">
            <svg className="scorecard-ring" viewBox="0 0 120 120">
              <circle
                cx="60" cy="60" r={radius}
                fill="none"
                stroke="var(--surface-2)"
                strokeWidth="8"
              />
              <circle
                cx="60" cy="60" r={radius}
                fill="none"
                stroke={gradeColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dashoffset 1s var(--ease-out)', filter: `drop-shadow(0 0 6px ${gradeColor})` }}
              />
            </svg>
            <div className="scorecard-ring-label">
              <span className="scorecard-percentage" style={{ color: gradeColor }}>
                {result.percentage}%
              </span>
              <span className="scorecard-grade" style={{ color: gradeColor }}>
                {t('Nilai', 'Grade')}: {gradeLabel}
              </span>
            </div>
          </div>

          <div className="scorecard-summary">
            <span>{t('Skor', 'Score')}: {result.totalScore} / {result.maxScore}</span>
          </div>

          {/* Details Toggle */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowDetails(!showDetails)}
            style={{ width: '100%', marginTop: 'var(--sp-3)' }}
          >
            {showDetails
              ? t('Sembunyikan Detail', 'Hide Details')
              : t('Lihat Detail', 'Show Details')}
          </button>

          {showDetails && (
            <div className="scorecard-details">
              {result.fieldResults.map(fr => (
                <div key={fr.fieldId} className={`scorecard-field scorecard-field-${fr.status}`}>
                  <span className="scorecard-field-icon">
                    {fr.status === 'correct' ? <Check size={12} /> :
                     fr.status === 'close' ? <Minus size={12} /> :
                     fr.status === 'unanswered' ? <Circle size={12} /> : <X size={12} />}
                  </span>
                  <span className="scorecard-field-label">{fr.fieldLabel}</span>
                  <span className="scorecard-field-value">
                    {fr.studentValue.toFixed(1)}
                    {fr.expectedValue !== null && (
                      <span className="scorecard-field-expected">
                        ({t('target', 'target')}: {fr.expectedValue})
                      </span>
                    )}
                  </span>
                  <span className="scorecard-field-points">
                    {fr.points}/{fr.maxPoints}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="scorecard-footer">
          <button className="btn btn-primary" onClick={onClose}>
            {t('Tutup', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
}
