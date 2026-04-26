import { useState, useCallback, useMemo } from 'react';
import type { MeasurementRow } from '../engine/types';
import { useSignalGraph } from '../engine/SignalGraphContext';

interface MeasurementTableProps {
  title: string;
  titleId: string;
  rows: MeasurementRow[];
  onValuesChange?: (rowId: string, fieldId: string, value: string) => void;
}

export default function MeasurementTable({
  title,
  titleId,
  rows,
  onValuesChange,
}: MeasurementTableProps) {
  const { t } = useSignalGraph();
  const [values, setValues] = useState<Record<string, Record<string, string>>>(() => {
    const init: Record<string, Record<string, string>> = {};
    for (const row of rows) {
      init[row.id] = {};
      for (const field of row.fields) {
        init[row.id][field.fieldId] = field.value || '';
      }
    }
    return init;
  });

  const handleChange = useCallback(
    (rowId: string, fieldId: string, value: string) => {
      setValues(prev => ({
        ...prev,
        [rowId]: { ...prev[rowId], [fieldId]: value },
      }));
      onValuesChange?.(rowId, fieldId, value);
    },
    [onValuesChange]
  );

  // Compute calculated fields
  const calculatedValues = useMemo(() => {
    const result: Record<string, Record<string, string>> = {};
    for (const row of rows) {
      if (row.calculated) {
        result[row.id] = {};
        for (const calc of row.calculated) {
          const fields: Record<string, number> = {};
          for (const f of row.fields) {
            fields[f.fieldId] = parseFloat(values[row.id]?.[f.fieldId] || '0') || 0;
          }
          try {
            const val = calc.compute(fields);
            result[row.id][calc.fieldId] = isNaN(val) ? '—' : val.toFixed(2);
          } catch {
            result[row.id][calc.fieldId] = '—';
          }
        }
      }
    }
    return result;
  }, [rows, values]);

  // Get all unique field headers
  const fieldHeaders = useMemo(() => {
    if (rows.length === 0) return [];
    const headers = rows[0].fields.map(f => ({
      fieldId: f.fieldId,
      label: f.fieldLabel,
      unit: f.unit,
    }));
    if (rows[0].calculated) {
      for (const calc of rows[0].calculated) {
        headers.push({
          fieldId: calc.fieldId,
          label: calc.fieldLabel,
          unit: calc.unit,
        });
      }
    }
    return headers;
  }, [rows]);

  return (
    <div className="measurement-table-container">
      <div className="measurement-table-header">
        <span className="measurement-table-title">{t(titleId, title)}</span>
      </div>
      <table className="measurement-table">
        <thead>
          <tr>
            <th>{t('Pengukuran', 'Measurement')}</th>
            {fieldHeaders.map(h => (
              <th key={h.fieldId}>
                {h.label} {h.unit && <span className="text-muted">({h.unit})</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id}>
              <td>{row.label}</td>
              {row.fields.map(field => (
                <td key={field.fieldId}>
                  <input
                    type="text"
                    value={values[row.id]?.[field.fieldId] || ''}
                    onChange={e => handleChange(row.id, field.fieldId, e.target.value)}
                    placeholder="—"
                    aria-label={`${row.label} ${field.fieldLabel}`}
                  />
                </td>
              ))}
              {row.calculated?.map(calc => (
                <td key={calc.fieldId}>
                  <span className="measurement-calculated">
                    {calculatedValues[row.id]?.[calc.fieldId] ?? '—'} {calc.unit}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
