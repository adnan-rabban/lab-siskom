import { describe, it, expect } from 'vitest';
import { evaluateMeasurements } from './GradingEngine';
import type { MeasurementRow, ObservationTarget } from './types';

describe('GradingEngine - evaluateMeasurements', () => {
  it('should correctly grade input fields with explicit expected values', () => {
    const rows: MeasurementRow[] = [
      {
        id: 'row-1',
        label: 'Test Row',
        fields: [
          {
            fieldId: 'freq',
            fieldLabel: 'Frequency',
            unit: 'Hz',
            value: '',
            expected: 300, // Explicit expected value
          },
        ],
      },
    ];

    const targets: ObservationTarget[] = [];
    const enteredValues = {
      'row-1': {
        freq: '300',
      },
    };

    const result = evaluateMeasurements('test-practicum', rows, targets, enteredValues);
    
    // Find the field result for freq
    const freqResult = result.fieldResults.find(f => f.fieldId === 'row-1-freq');
    expect(freqResult).toBeDefined();
    expect(freqResult?.expectedValue).toBe(300);
    expect(freqResult?.studentValue).toBe(300);
    expect(freqResult?.status).toBe('correct');
    expect(freqResult?.points).toBe(10);
  });

  it('should correctly grade qualitative/text fields if they are non-empty', () => {
    const rows: MeasurementRow[] = [
      {
        id: 'row-1',
        label: 'Test Row',
        fields: [
          {
            fieldId: 'distortion',
            fieldLabel: 'Distortion observed',
            unit: '', // Qualitative field (no unit)
            value: '',
          },
        ],
      },
    ];

    const targets: ObservationTarget[] = [];
    const enteredValues = {
      'row-1': {
        distortion: 'Sinyal mengalami capping',
      },
    };

    const result = evaluateMeasurements('test-practicum', rows, targets, enteredValues);
    
    const distResult = result.fieldResults.find(f => f.fieldId === 'row-1-distortion');
    expect(distResult).toBeDefined();
    expect(distResult?.status).toBe('correct');
    expect(distResult?.points).toBe(10);
  });

  it('should grade multiple calculated fields in a row against their specific targetIds if defined', () => {
    const rows: MeasurementRow[] = [
      {
        id: 'row-fm',
        label: 'FM Row',
        fields: [
          { fieldId: 'tmin', fieldLabel: 'T min', unit: 's', value: '' },
          { fieldId: 'tmax', fieldLabel: 'T max', unit: 's', value: '' },
        ],
        calculated: [
          {
            fieldId: 'fmax',
            fieldLabel: 'f max',
            unit: 'Hz',
            formula: '1 / T min',
            targetId: 'fm-target-max', // Specific target
            compute: (fields) => {
              const tmin = fields.tmin || 0;
              return tmin > 0 ? 1 / tmin : 0;
            },
          },
          {
            fieldId: 'fmin',
            fieldLabel: 'f min',
            unit: 'Hz',
            formula: '1 / T max',
            targetId: 'fm-target-min', // Specific target
            compute: (fields) => {
              const tmax = fields.tmax || 0;
              return tmax > 0 ? 1 / tmax : 0;
            },
          },
        ],
      },
    ];

    const targets: ObservationTarget[] = [
      {
        id: 'fm-target-max',
        label: 'FM Target Max',
        labelId: 'FM Target Max',
        unit: 'Hz',
        expectedValue: 530000,
        tolerance: 5,
      },
      {
        id: 'fm-target-min',
        label: 'FM Target Min',
        labelId: 'FM Target Min',
        unit: 'Hz',
        expectedValue: 380000,
        tolerance: 5,
      },
    ];

    const enteredValues = {
      'row-fm': {
        tmin: (1 / 530000).toString(), // Should calculate to 530000
        tmax: (1 / 380000).toString(), // Should calculate to 380000
      },
    };

    const result = evaluateMeasurements('test-practicum', rows, targets, enteredValues);

    const fmaxResult = result.fieldResults.find(f => f.fieldId === 'row-fm-fmax');
    const fminResult = result.fieldResults.find(f => f.fieldId === 'row-fm-fmin');

    expect(fmaxResult).toBeDefined();
    expect(fmaxResult?.expectedValue).toBe(530000);
    expect(fmaxResult?.studentValue).toBeCloseTo(530000, 1);
    expect(fmaxResult?.status).toBe('correct');
    expect(fmaxResult?.points).toBe(15);

    expect(fminResult).toBeDefined();
    expect(fminResult?.expectedValue).toBe(380000);
    expect(fminResult?.studentValue).toBeCloseTo(380000, 1);
    expect(fminResult?.status).toBe('correct');
    expect(fminResult?.points).toBe(15);
  });
});
