import { useMemo } from 'react';
import { useSignalGraph } from '../engine/SignalGraphContext';
import type { MeasurementRow } from '../engine/types';
import { BarChart3 } from 'lucide-react';

interface MeasurementTableProps {
  title: string;
  titleId: string;
  rows: MeasurementRow[];
  values?: Record<string, Record<string, string>>;
  onValueChange?: (rowId: string, fieldId: string, value: string) => void;
  onSubmitGrading?: () => void;
  t?: (id: string, en: string) => string;
}

export default function MeasurementTable({
  title,
  titleId,
  rows,
  values = {},
  onValueChange,
  onSubmitGrading,
  t: tProp,
}: MeasurementTableProps) {
  const { t: contextT } = useSignalGraph();
  const t = tProp || contextT;

  // Calculate computed fields
  const computedValues = useMemo(() => {
    const result: Record<string, Record<string, number>> = {};
    for (const row of rows) {
      if (!row.calculated) continue;
      const rowVals = values[row.id] || {};
      const parsedFields: Record<string, number> = {};
      for (const field of row.fields) {
        const v = parseFloat(rowVals[field.fieldId] || '');
        parsedFields[field.fieldId] = isNaN(v) ? 0 : v;
      }
      result[row.id] = {};
      for (const calc of row.calculated) {
        result[row.id][calc.fieldId] = calc.compute(parsedFields);
      }
    }
    return result;
  }, [rows, values]);

  const handleInputChange = (rowId: string, fieldId: string, value: string) => {
    if (onValueChange) {
      onValueChange(rowId, fieldId, value);
    }
  };

  // Check if all fields have values
  const allFilled = rows.every(row =>
    row.fields.every(f => {
      const v = values[row.id]?.[f.fieldId];
      return v && v.trim() !== '';
    })
  );

  return (
    <div className="measurement-table-container">
      <div className="measurement-table-header">
        <span className="measurement-table-title">{t(titleId, title)}</span>
      </div>
      <table className="measurement-table">
        <thead>
          <tr>
            <th>{t('Pengukuran', 'Measurement')}</th>
            {/* BUG-05 fix: Build union of all field columns from all rows */}
            {(() => {
              const fieldIds = new Map<string, { label: string; unit: string }>();
              const calcIds = new Map<string, { label: string; unit: string }>();
              for (const row of rows) {
                for (const f of row.fields) {
                  if (!fieldIds.has(f.fieldId)) fieldIds.set(f.fieldId, { label: f.fieldLabel, unit: f.unit });
                }
                if (row.calculated) {
                  for (const c of row.calculated) {
                    if (!calcIds.has(c.fieldId)) calcIds.set(c.fieldId, { label: c.fieldLabel, unit: c.unit });
                  }
                }
              }
              return (
                <>
                  {[...fieldIds.entries()].map(([id, meta]) => (
                    <th key={id}>{meta.label} ({meta.unit})</th>
                  ))}
                  {[...calcIds.entries()].map(([id, meta]) => (
                    <th key={id}>{meta.label} ({meta.unit})</th>
                  ))}
                </>
              );
            })()}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            // Build union column order for consistent alignment
            const allFieldIds: string[] = [];
            const allCalcIds: string[] = [];
            for (const r of rows) {
              for (const f of r.fields) {
                if (!allFieldIds.includes(f.fieldId)) allFieldIds.push(f.fieldId);
              }
              if (r.calculated) {
                for (const c of r.calculated) {
                  if (!allCalcIds.includes(c.fieldId)) allCalcIds.push(c.fieldId);
                }
              }
            }

            return (
              <tr key={row.id}>
                <td style={{ fontWeight: 'var(--fw-semibold)' as any }}>{row.label}</td>
                {allFieldIds.map(fid => {
                  const field = row.fields.find(f => f.fieldId === fid);
                  if (!field) return <td key={fid}>—</td>;
                  return (
                    <td key={fid}>
                      <input
                        type={field.unit === '' ? 'text' : 'number'}
                        step="0.01"
                        placeholder={field.unit === '' ? '...' : '0.00'}
                        value={values[row.id]?.[field.fieldId] ?? ''}
                        onChange={e => handleInputChange(row.id, field.fieldId, e.target.value)}
                      />
                    </td>
                  );
                })}
                {allCalcIds.map(cid => {
                  const calc = row.calculated?.find(c => c.fieldId === cid);
                  if (!calc) return <td key={cid}>—</td>;
                  return (
                    <td key={cid}>
                      <span className="measurement-calculated">
                        {computedValues[row.id]?.[calc.fieldId]?.toFixed(1) ?? '—'}
                      </span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {onSubmitGrading && (
        <div style={{
          padding: 'var(--sp-3) var(--sp-4)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 'var(--sp-3)',
          background: 'var(--bg-panel)',
        }}>
          {!allFilled && (
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent-amber)', alignSelf: 'center' }}>
              {t('Isi semua kolom terlebih dahulu', 'Fill all fields first')}
            </span>
          )}
          <button
            className="btn btn-primary btn-sm"
            onClick={onSubmitGrading}
            disabled={!allFilled}
            style={{ opacity: allFilled ? 1 : 0.5 }}
          >
            <BarChart3 size={12} /> {t('Kirim untuk Penilaian', 'Submit for Grading')}
          </button>
        </div>
      )}
    </div>
  );
}
