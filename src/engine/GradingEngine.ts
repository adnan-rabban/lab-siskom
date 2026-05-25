// ============================================================
// GradingEngine — Evaluate student measurements
// ============================================================

import type { ObservationTarget, MeasurementRow } from './types';

export interface FieldResult {
  fieldId: string;
  fieldLabel: string;
  studentValue: number;
  expectedValue: number | null;
  tolerance: number;
  status: 'correct' | 'close' | 'incorrect' | 'unanswered';
  points: number;
  maxPoints: number;
}

export interface GradingResult {
  practicumId: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  fieldResults: FieldResult[];
  submittedAt: number;
}

/**
 * Evaluate measurement rows against observation targets.
 * Each calculated field (mod-index) is checked against expected values.
 */
export function evaluateMeasurements(
  practicumId: string,
  rows: MeasurementRow[],
  targets: ObservationTarget[],
  enteredValues: Record<string, Record<string, string>>
): GradingResult {
  const fieldResults: FieldResult[] = [];
  let totalScore = 0;
  let maxScore = 0;

  for (const row of rows) {
    const rowValues = enteredValues[row.id] || {};

    // Parse entered field values
    const parsedFields: Record<string, number> = {};
    for (const field of row.fields) {
      const val = parseFloat(rowValues[field.fieldId] || '');
      parsedFields[field.fieldId] = isNaN(val) ? 0 : val;
    }

    // Evaluate each input field (Emax, Emin)
    for (const field of row.fields) {
      const rawVal = rowValues[field.fieldId];
      const isEmpty = !rawVal || rawVal.trim() === '';

      const pointsPerField = 10;
      maxScore += pointsPerField;

      if (isEmpty) {
        fieldResults.push({
          fieldId: `${row.id}-${field.fieldId}`,
          fieldLabel: `${row.label} — ${field.fieldLabel}`,
          studentValue: 0,
          expectedValue: field.expected ?? null,
          tolerance: 20,
          status: 'unanswered',
          points: 0,
          maxPoints: pointsPerField,
        });
      } else {
        const studentVal = parsedFields[field.fieldId];
        let status: FieldResult['status'] = 'incorrect';
        let pts = 0;

        if (field.unit === '') {
          // Qualitative/text field - correct if not empty
          status = 'correct';
          pts = pointsPerField;
        } else if (field.expected !== undefined && field.expected !== null) {
          const expected = field.expected;
          const tolerance = 20; // default 20% tolerance for inputs
          const deviation = Math.abs(studentVal - expected);
          const toleranceAbs = expected !== 0
            ? (tolerance * Math.abs(expected)) / 100
            : 0.01;

          if (deviation <= toleranceAbs * 0.5) {
            status = 'correct';
            pts = pointsPerField;
          } else if (deviation <= toleranceAbs) {
            status = 'close';
            pts = Math.round(pointsPerField * 0.7);
          } else if (deviation <= toleranceAbs * 2) {
            status = 'close';
            pts = Math.round(pointsPerField * 0.3);
          }
        } else {
          const reasonable = studentVal > 0 && studentVal < 100;
          status = reasonable ? 'correct' : 'close';
          pts = reasonable ? pointsPerField : Math.round(pointsPerField * 0.5);
        }

        totalScore += pts;
        fieldResults.push({
          fieldId: `${row.id}-${field.fieldId}`,
          fieldLabel: `${row.label} — ${field.fieldLabel}`,
          studentValue: studentVal,
          expectedValue: field.expected ?? null,
          tolerance: 20,
          status,
          points: pts,
          maxPoints: pointsPerField,
        });
      }
    }

    // Evaluate calculated fields (mod-index)
    if (row.calculated) {
      for (const calc of row.calculated) {
        const computed = calc.compute(parsedFields);
        const pointsPerCalc = 15;
        maxScore += pointsPerCalc;

        // Find matching target: prefer calc.targetId first, then row.targetId, then heuristics
        const target = targets.find(t => {
          if (calc.targetId && t.id === calc.targetId) return true;
          if (row.targetId && t.id === row.targetId) return true;
          if (row.id.includes('50') && t.id.includes('50')) return true;
          if (row.id.includes('100') && t.id.includes('100')) return true;
          if (row.id.includes('75') && t.id.includes('75')) return true;
          if (row.id.includes('25') && t.id.includes('25')) return true;
          return false;
        });

        if (target && target.expectedValue !== undefined) {
          const deviation = Math.abs(computed - target.expectedValue);
          const toleranceAbs = target.expectedValue !== 0
            ? (target.tolerance || 10) * Math.abs(target.expectedValue) / 100
            : 0.01;

          let status: FieldResult['status'] = 'incorrect';
          let pts = 0;

          if (deviation <= toleranceAbs * 0.5) {
            status = 'correct';
            pts = pointsPerCalc;
          } else if (deviation <= toleranceAbs) {
            status = 'close';
            pts = Math.round(pointsPerCalc * 0.7);
          } else if (deviation <= toleranceAbs * 2) {
            status = 'close';
            pts = Math.round(pointsPerCalc * 0.3);
          }

          totalScore += pts;

          fieldResults.push({
            fieldId: `${row.id}-${calc.fieldId}`,
            fieldLabel: `${row.label} — ${calc.fieldLabel}`,
            studentValue: computed,
            expectedValue: target.expectedValue,
            tolerance: target.tolerance || 10,
            status,
            points: pts,
            maxPoints: pointsPerCalc,
          });
        } else {
          // No target — give partial credit for filling in
          const hasData = parsedFields['emax'] > 0 && parsedFields['emin'] >= 0;
          const pts = hasData ? Math.round(pointsPerCalc * 0.6) : 0;
          totalScore += pts;

          fieldResults.push({
            fieldId: `${row.id}-${calc.fieldId}`,
            fieldLabel: `${row.label} — ${calc.fieldLabel}`,
            studentValue: computed,
            expectedValue: null,
            tolerance: 10,
            status: hasData ? 'close' : 'unanswered',
            points: pts,
            maxPoints: pointsPerCalc,
          });
        }
      }
    }
  }

  return {
    practicumId,
    totalScore,
    maxScore,
    percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
    fieldResults,
    submittedAt: Date.now(),
  };
}