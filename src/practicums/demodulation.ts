import type { PracticumConfig, MeasurementRow } from '../engine/types';

/**
 * Demodulation Practicum (TE02007) — Demodulasi
 */
export const demodulationConfig: PracticumConfig = {
  id: 'demodulation',
  title: 'Demodulation',
  titleId: 'Demodulasi',
  moduleCode: 'TE02007',
  description: 'Study the working principle and function of a demodulator circuit for AM signals.',
  descriptionId: 'Menjelaskan prinsip kerja dan fungsi sebuah rangkaian demodulator sinyal AM.',
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
      },
    },
    {
      moduleType: 'detector',
      nodeId: 'detector',
      label: 'PTE-011-02',
      initialParams: {
        decay: 0.995,
        detectorType: 'diode',
      },
    },
    {
      moduleType: 'amplifier',
      nodeId: 'amplifier',
      label: 'PTE-011-07',
      initialParams: {
        gain: 10,
      },
    },
    {
      moduleType: 'tuned-circuit',
      nodeId: 'tuned-circuit',
      label: 'PTE-011-04',
      initialParams: {
        tunedFrequency: 455000,
        bandwidth: 10000,
        attenuation: 0,
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
      id: 'conn-sig-tuned',
      fromNodeId: 'signal-source',
      fromPortId: 'output',
      toNodeId: 'tuned-circuit',
      toPortId: 'input',
    },
    {
      id: 'conn-tuned-amp',
      fromNodeId: 'tuned-circuit',
      fromPortId: 'output',
      toNodeId: 'amplifier',
      toPortId: 'input',
    },
    {
      id: 'conn-amp-detector',
      fromNodeId: 'amplifier',
      fromPortId: 'output',
      toNodeId: 'detector',
      toPortId: 'input',
    },
    {
      id: 'conn-sig-scope-ch1',
      fromNodeId: 'signal-source',
      fromPortId: 'output',
      toNodeId: 'oscilloscope',
      toPortId: 'ch1',
    },
    {
      id: 'conn-detector-scope-ch2',
      fromNodeId: 'detector',
      fromPortId: 'output',
      toNodeId: 'oscilloscope',
      toPortId: 'ch2',
    },
  ],

  procedure: [
    {
      stepNumber: 1,
      instruction: 'Install Signal Source PTE-011-01, Power Supply PTE-011-17, Detector PTE-011-02, Amplifier PTE-011-07, and Tuned Circuit PTE-011-04 on the panel frame.',
      instructionId: 'Pasang modul Signal Source PTE-011-01, Power Supply PTE-011-17, Detektor PTE-011-02, Amplifier PTE-011-07, dan Tuned Circuit PTE-011-04 pada rangka panel.',
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
      instruction: 'Connect the Signal Source output to the Tuned Circuit input. Connect the Tuned Circuit output to the Amplifier input, and the Amplifier output to the Detector input.',
      instructionId: 'Hubungkan keluaran Signal Source ke masukan Tuned Circuit. Hubungkan keluaran Tuned Circuit ke masukan Amplifier, dan keluaran Amplifier ke masukan Detektor.',
      requiredConnections: ['conn-sig-tuned', 'conn-tuned-amp', 'conn-amp-detector'],
    },
    {
      stepNumber: 4,
      instruction: 'Connect the oscilloscope CH1 to the AM modulated signal (Signal Source output) and CH2 to the demodulated signal (Detector output).',
      instructionId: 'Hubungkan osiloskop CH1 ke sinyal termodulasi AM (keluaran Signal Source) dan CH2 ke sinyal terdemodulasi (keluaran Detektor).',
      requiredConnections: ['conn-sig-scope-ch1', 'conn-detector-scope-ch2'],
    },
    {
      stepNumber: 5,
      instruction: 'Turn ON the Power Supply. Set the function generator to 300 Hz, 1 Vp-p.',
      instructionId: 'Nyalakan Power Supply. Atur function generator pada 300 Hz, 1 Vp-p.',
      paramChanges: [
        { nodeId: 'func-gen-1', params: { frequency: 300, amplitude: 1 } },
      ],
    },
    {
      stepNumber: 6,
      instruction: 'Set the Function Generator amplitude to approximately 0.5 Vp-p (representing 50% modulation). Observe the AM waveform on CH1 and the demodulated waveform on CH2.',
      instructionId: 'Atur amplitudo Function Generator sekitar 0.5 Vp-p (mewakili 50% modulasi). Amati gelombang AM pada CH1 dan gelombang terdemodulasi pada CH2.',
      paramChanges: [
        { nodeId: 'func-gen-1', params: { amplitude: 0.5 } },
      ],
      observation: 'Compare the AM signal (CH1) with the demodulated signal (CH2). The demodulated signal should resemble the original modulating waveform.',
      observationId: 'Bandingkan sinyal AM (CH1) dengan sinyal terdemodulasi (CH2). Sinyal terdemodulasi seharusnya menyerupai gelombang pemodulasi asli.',
    },
    {
      stepNumber: 7,
      instruction: 'Measure the frequency of the demodulated signal using the frequency counter. Does it match the modulating frequency?',
      instructionId: 'Ukur frekuensi sinyal terdemodulasi menggunakan pencacah frekuensi. Apakah sama dengan frekuensi pemodulasi?',
    },
    {
      stepNumber: 8,
      instruction: 'Increase the Function Generator amplitude to 1.0 Vp-p (representing 100% modulation). Observe the effect on the demodulated signal quality.',
      instructionId: 'Tingkatkan amplitudo Function Generator menjadi 1.0 Vp-p (mewakili 100% modulasi). Amati pengaruhnya terhadap kualitas sinyal terdemodulasi.',
      paramChanges: [
        { nodeId: 'func-gen-1', params: { amplitude: 1.0 } },
      ],
    },
    {
      stepNumber: 9,
      instruction: 'Increase the Function Generator amplitude beyond 1.0 Vp-p (overmodulation). What happens to the demodulated signal?',
      instructionId: 'Tingkatkan amplitudo Function Generator melampaui 1.0 Vp-p (overmodulasi). Apa yang terjadi pada sinyal terdemodulasi?',
      paramChanges: [
        { nodeId: 'func-gen-1', params: { amplitude: 1.5 } },
      ],
    },
    {
      stepNumber: 10,
      instruction: 'Return the Function Generator amplitude to 0.5 Vp-p. Adjust the RC time constant of the detector. Observe how it affects the demodulated signal quality.',
      instructionId: 'Kembalikan amplitudo Function Generator ke 0.5 Vp-p. Atur konstanta waktu RC detektor. Amati bagaimana pengaruhnya terhadap kualitas sinyal terdemodulasi.',
      paramChanges: [
        { nodeId: 'func-gen-1', params: { amplitude: 0.5 } },
      ],
    },
    {
      stepNumber: 11,
      instruction: 'Observe the demodulated signal on the oscilloscope. Compare the waveforms before and after adjusting the RC time constant or tuning.',
      instructionId: 'Amati sinyal terdemodulasi pada osiloskop. Bandingkan bentuk gelombang sebelum dan sesudah penyelarasan konstanta RC atau penalaan.',
    },
    {
      stepNumber: 12,
      instruction: 'Turn off all equipment and disconnect cables.',
      instructionId: 'Matikan semua peralatan dan lepaskan kabel.',
    },
  ],

  observationTargets: [
    {
      id: 'demod-freq',
      label: 'Demodulated Signal Frequency',
      labelId: 'Frekuensi Sinyal Terdemodulasi',
      unit: 'Hz',
      expectedValue: 300,
      tolerance: 5,
    },
    {
      id: 'mod-index-50-demod',
      label: 'Modulation Index at 50% (from demodulated signal)',
      labelId: 'Indeks Modulasi pada 50% (dari sinyal terdemodulasi)',
      unit: '%',
      expectedValue: 50,
      tolerance: 15,
    },
  ],
};

export const demodMeasurementRows: MeasurementRow[] = [
  {
    id: 'demod-50',
    label: 'm = 50%',
    targetId: 'mod-index-50-demod',
    fields: [
      { fieldId: 'emax', fieldLabel: 'Emax (demod)', unit: 'V', value: '' },
      { fieldId: 'emin', fieldLabel: 'Emin (demod)', unit: 'V', value: '' },
      { fieldId: 'freq', fieldLabel: 'f (demod)', unit: 'Hz', value: '', expected: 300 },
    ],
    calculated: [
      {
        fieldId: 'mod-index',
        fieldLabel: 'm%',
        unit: '%',
        formula: '(Emax - Emin) / (Emax + Emin) × 100',
        compute: (fields) => {
          const emax = fields.emax || 0;
          const emin = fields.emin || 0;
          if (emax + emin === 0) return 0;
          return ((emax - emin) / (emax + emin)) * 100;
        },
      },
    ],
  },
  {
    id: 'demod-100',
    label: 'm = 100%',
    fields: [
      { fieldId: 'emax', fieldLabel: 'Emax (demod)', unit: 'V', value: '' },
      { fieldId: 'emin', fieldLabel: 'Emin (demod)', unit: 'V', value: '' },
    ],
    calculated: [
      {
        fieldId: 'mod-index',
        fieldLabel: 'm%',
        unit: '%',
        formula: '(Emax - Emin) / (Emax + Emin) × 100',
        compute: (fields) => {
          const emax = fields.emax || 0;
          const emin = fields.emin || 0;
          if (emax + emin === 0) return 0;
          return ((emax - emin) / (emax + emin)) * 100;
        },
      },
    ],
  },
  {
    id: 'demod-over',
    label: 'm > 100%',
    fields: [
      { fieldId: 'distortion', fieldLabel: 'Distortion observed', unit: '', value: '' },
    ],
  },
];