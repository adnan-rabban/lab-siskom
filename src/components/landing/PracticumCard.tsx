'use client';
import Link from 'next/link';
import { Practicum } from './types';

interface PracticumCardProps {
  practicum: Practicum;
}

export default function PracticumCard({ practicum }: PracticumCardProps) {
  const p = practicum;
  const isActive = p.status === 'active';

  const cardContent = (
    <div
      className={`practicum-card ${isActive ? 'active' : 'coming-soon'}`}
      role={isActive ? 'link' : 'article'}
      tabIndex={isActive ? 0 : -1}
      aria-label={`${p.titleId} (${p.moduleCode})${isActive ? ' — Klik untuk mulai' : ' — Segera hadir'}`}
    >
      {/* Header */}
      <div className="practicum-card-header">
        <span className={`practicum-card-category ${p.category}`}>
          {p.category}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`practicum-card-status ${p.status}`}>
            {isActive ? '● Siap' : '○ Segera'}
          </span>
          <span className="practicum-card-code">{p.moduleCode}</span>
        </div>
      </div>

      {/* Title */}
      <h2 className="practicum-card-title">{p.titleId}</h2>

      {/* Description */}
      <p className="practicum-card-desc">{p.descriptionId}</p>

      {/* Instruments */}
      {p.instruments && p.instruments.length > 0 && (
        <div className="practicum-card-instruments">
          {p.instruments.slice(0, 3).map((inst, i) => (
            <span key={i} className="practicum-card-instrument">{inst}</span>
          ))}
          {p.instruments.length > 3 && (
            <span className="practicum-card-instrument">+{p.instruments.length - 3}</span>
          )}
        </div>
      )}

      {/* Tags */}
      <div className="practicum-card-meta">
        {p.tags.slice(0, 3).map((tag, tIdx) => (
          <span key={tIdx} className="practicum-card-tag">{tag}</span>
        ))}
        {p.tags.length > 3 && (
          <span className="practicum-card-tag">+{p.tags.length - 3}</span>
        )}
      </div>

      {isActive && (
        <div className="practicum-card-arrow" aria-hidden="true">→</div>
      )}
    </div>
  );

  if (isActive) {
    return (
      <Link href={p.route} style={{ textDecoration: 'none', display: 'block' }}>
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}