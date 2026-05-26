import type { PracticumConfig, MeasurementRow } from '../engine/types';

/**
 * FM Modulation Practicum (TE02009) — Modulasi Frekuensi
 */
export const fmModulationConfig: PracticumConfig = {
  id: 'fm-modulation',
  title: 'Frequency Modulation',
  titleId: 'Modulasi Frekuensi',
  moduleCode: 'TE02009',
  description: 'Study the working principle of FM modulation and measure frequency deviation.',
  descriptionId: 'Mempelajari prinsip kerja modulasi FM dan mengukur deviasi frekuensi.',
  category: 'analog',
  status: 'available',

  requiredModules: [
    {
      moduleType: 'power-supply',
      nodeId: 'psu',
      label: 'PTE-011-17',
      initialParams: { enabled: false },
    },
    {
      moduleType: 'signal-source',
      nodeId: 'signal-source',
      label: 'PTE-011-01',
      initialParams: {
        frequency: 455000,
        amplitude: 1,
        waveform: 'sine',
        attenuation: 0,
        freqDeviation: 75000,
      },
    },
  ],

  requiredInstruments: [
    {
      moduleType: 'oscilloscope',
      nodeId: 'oscilloscope',
      label: 'Oscilloscope',
    },
    {
      moduleType: 'frequency-counter',
      nodeId: 'freq-counter',
      label: 'Frequency Counter',
    },
    {
      moduleType: 'function-generator',
      nodeId: 'func-gen-1',
      label: 'Function Generator',
      count: 1,
    },
  ],

  requiredConnections: [
    {
      id: 'conn-psu-signal',
      fromNodeId: 'psu',
      fromPortId: 'power',
      toNodeId: 'signal-source',
      toPortId: 'power-in',
    },
    {
      id: 'conn-funcgen-sig-mod',
      fromNodeId: 'func-gen-1',
      fromPortId: 'output',
      toNodeId: 'signal-source',
      toPortId: 'mod-in',
    },
    {
      id: 'conn-sig-scope-ch1',
      fromNodeId: 'signal-source',
      fromPortId: 'output',
      toNodeId: 'oscilloscope',
      toPortId: 'ch1',
    },
    {
      id: 'conn-funcgen-scope-ch2',
      fromNodeId: 'func-gen-1',
      fromPortId: 'output',
      toNodeId: 'oscilloscope',
      toPortId: 'ch2',
    },
  ],

  procedure: [
    {
      stepNumber: 1,
      instruction: 'Install Signal Source PTE-011-01 and Power Supply PTE-011-17 on the panel frame.',
      instructionId: 'Pasang modul Signal Source PTE-011-01 dan Power Supply PTE-011-17 pada rangka panel.',
      requiredConnections: ['conn-psu-signal'],
    },
    {
      stepNumber: 2,
      instruction: 'Connect the Function Generator to the Signal Source modulation input (MOD IN).',
      instructionId: 'Hubungkan Function Generator ke masukan modulasi (MOD IN) modul Signal Source.',
      requiredConnections: ['conn-funcgen-sig-mod'],
    },
    {
      stepNumber: 3,
      instruction: 'Connect the Signal Source output to the oscilloscope CH1.',
      instructionId: 'Hubungkan keluaran Signal Source ke osiloskop CH1.',
      requiredConnections: ['conn-sig-scope-ch1'],
    },
    {
      stepNumber: 4,
      instruction: 'Connect the Function Generator output to the oscilloscope CH2.',
      instructionId: 'Hubungkan keluaran Function Generator ke osiloskop CH2.',
      requiredConnections: ['conn-funcgen-scope-ch2'],
    },
    {
      stepNumber: 5,
      instruction: 'Turn ON the Power Supply. Set the function generator to 1 kHz, 1 Vp-p.',
      instructionId: 'Nyalakan Power Supply. Atur function generator pada 1 kHz, 1 Vp-p.',
      paramChanges: [
        { nodeId: 'func-gen-1', params: { frequency: 1000, amplitude: 1 } },
      ],
    },
    {
      stepNumber: 6,
      instruction: 'Set the Frequency Deviation of the Signal Source to 75 kHz. Observe the FM waveform on CH1 relative to the modulating signal on CH2.',
      instructionId: 'Atur Deviasi Frekuensi pada Signal Source ke 75 kHz. Amati gelombang FM pada CH1 relatif terhadap sinyal pemodulasi pada CH2.',
      paramChanges: [
        { nodeId: 'signal-source', params: { freqDeviation: 75000 } },
      ],
      observation: 'The FM signal should compress (higher frequency) during the positive half-cycle of the modulating signal and expand (lower frequency) during the negative half-cycle.',
      observationId: 'Sinyal FM akan merapat (frekuensi lebih tinggi) pada setengah siklus positif sinyal pemodulasi dan merenggang (frekuensi lebih rendah) pada setengah siklus negatif.',
    },
    {
      stepNumber: 7,
      instruction: 'Turn on the Oscilloscope Cursors (Time mode) to manually measure the period (T) of the densest and widest parts of the FM signal to verify the frequency deviation.',
      instructionId: 'Nyalakan Kursor Osiloskop (mode Waktu) untuk mengukur periode (T) bagian sinyal FM yang paling rapat dan paling renggang secara manual untuk memverifikasi deviasi frekuensi.',
    },
    {
      stepNumber: 8,
      instruction: 'Adjust the Frequency Deviation of the Signal Source to 25 kHz. Observe the changes in the density of the FM signal.',
      instructionId: 'Ubah Deviasi Frekuensi pada Signal Source menjadi 25 kHz. Amati perubahan kerapatan sinyal FM.',
      paramChanges: [
        { nodeId: 'signal-source', params: { freqDeviation: 25000 } },
      ],
    },
    {
      stepNumber: 9,
      instruction: 'Turn off all equipment and disconnect cables.',
      instructionId: 'Matikan semua peralatan dan lepaskan kabel.',
    },
  ],

  observationTargets: [
    {
      id: 'fm-dev-75-max',
      label: 'Max Frequency at 75kHz Deviation',
      labelId: 'Frekuensi Maks pada Deviasi 75kHz',
      unit: 'Hz',
      expectedValue: 530000, // 455k + 75k
      tolerance: 5,
    },
    {
      id: 'fm-dev-75-min',
      label: 'Min Frequency at 75kHz Deviation',
      labelId: 'Frekuensi Min pada Deviasi 75kHz',
      unit: 'Hz',
      expectedValue: 380000, // 455k - 75k
      tolerance: 5,
    },
    {
      id: 'fm-dev-25-max',
      label: 'Max Frequency at 25kHz Deviation',
      labelId: 'Frekuensi Maks pada Deviasi 25kHz',
      unit: 'Hz',
      expectedValue: 480000, // 455k + 25k
      tolerance: 5,
    },
    {
      id: 'fm-dev-25-min',
      label: 'Min Frequency at 25kHz Deviation',
      labelId: 'Frekuensi Min pada Deviasi 25kHz',
      unit: 'Hz',
      expectedValue: 430000, // 455k - 25k
      tolerance: 5,
    },
  ],
};

export const fmMeasurementRows: MeasurementRow[] = [
  {
    id: 'fm-75k',
    label: 'Δf = 75 kHz',
    fields: [
      { fieldId: 'tmin', fieldLabel: 'T min (s)', unit: 's', value: '' },
      { fieldId: 'tmax', fieldLabel: 'T max (s)', unit: 's', value: '' },
    ],
    calculated: [
      {
        fieldId: 'fmax',
        fieldLabel: 'f max',
        unit: 'Hz',
        formula: '1 / T min',
        targetId: 'fm-dev-75-max',
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
        targetId: 'fm-dev-75-min',
        compute: (fields) => {
          const tmax = fields.tmax || 0;
          return tmax > 0 ? 1 / tmax : 0;
        },
      },
    ],
  },
  {
    id: 'fm-25k',
    label: 'Δf = 25 kHz',
    fields: [
      { fieldId: 'tmin', fieldLabel: 'T min (s)', unit: 's', value: '' },
      { fieldId: 'tmax', fieldLabel: 'T max (s)', unit: 's', value: '' },
    ],
    calculated: [
      {
        fieldId: 'fmax',
        fieldLabel: 'f max',
        unit: 'Hz',
        formula: '1 / T min',
        targetId: 'fm-dev-25-max',
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
        targetId: 'fm-dev-25-min',
        compute: (fields) => {
          const tmax = fields.tmax || 0;
          return tmax > 0 ? 1 / tmax : 0;
        },
      },
    ],
  },
];
