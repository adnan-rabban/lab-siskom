import { Practicum } from './types';

interface PracticumCardProps {
  practicum: Practicum;
}

export default function PracticumCard({ practicum }: PracticumCardProps) {
  const p = practicum;
  return (
    <div
      className="practicum-card coming-soon"
      role="button"
      tabIndex={-1}
      aria-label={`${p.titleId} (${p.moduleCode})`}
    >
      <div className="practicum-card-header">
        <span className={`practicum-card-category ${p.category}`}>
          {p.category}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="practicum-card-status coming-soon">
            ○ Coming Soon
          </span>
          <span className="practicum-card-code">{p.moduleCode}</span>
        </div>
      </div>
      <h2 className="practicum-card-title">{p.titleId}</h2>
      <p className="practicum-card-desc">{p.descriptionId}</p>
      <div className="practicum-card-meta">
        {p.tags.slice(0, 3).map((tag, tIdx) => (
          <span key={tIdx} className="practicum-card-tag">{tag}</span>
        ))}
        {p.tags.length > 3 && (
          <span className="practicum-card-tag">+{p.tags.length - 3}</span>
        )}
      </div>
    </div>
  );
}
