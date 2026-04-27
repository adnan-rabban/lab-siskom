import { useMemo } from 'react';
import { useSignalGraph } from '../engine/SignalGraphContext';
import type { MeasurementRow } from '../engine/types';

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
            {rows[0]?.fields.map(f => (
              <th key={f.fieldId}>{f.fieldLabel} ({f.unit})</th>
            ))}
            {rows[0]?.calculated?.map(c => (
              <th key={c.fieldId}>{c.fieldLabel} ({c.unit})</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id}>
              <td style={{ fontWeight: 'var(--fw-semibold)' as any }}>{row.label}</td>
              {row.fields.map(field => (
                <td key={field.fieldId}>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={values[row.id]?.[field.fieldId] ?? ''}
                    onChange={e => handleInputChange(row.id, field.fieldId, e.target.value)}
                  />
                </td>
              ))}
              {row.calculated?.map(calc => (
                <td key={calc.fieldId}>
                  <span className="measurement-calculated">
                    {computedValues[row.id]?.[calc.fieldId]?.toFixed(1) ?? '—'}
                  </span>
                </td>
              ))}
            </tr>
          ))}
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
            📊 {t('Kirim untuk Penilaian', 'Submit for Grading')}
          </button>
        </div>
      )}
    </div>
  );
}
