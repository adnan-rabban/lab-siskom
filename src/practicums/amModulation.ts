import type { PracticumConfig, MeasurementRow } from '../engine/types';

/**
 * AM Modulation Practicum (TE02005) — Modulasi Amplitudo
 * Based on the PUDAK Scientific lab module.
 */
export const amModulationConfig: PracticumConfig = {
  id: 'am-modulation',
  title: 'Amplitude Modulation',
  titleId: 'Modulasi Amplitudo',
  moduleCode: 'TE02005',
  description: 'Generate and analyze amplitude modulated waveforms using the PUDAK PTE-011 module series.',
  descriptionId: 'Membangkitkan dan menganalisa gelombang termodulasi amplitudo menggunakan modul PUDAK PTE-011.',
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
      moduleType: 'amplifier',
      nodeId: 'amplifier',
      label: 'PTE-011-07',
      initialParams: {
        gain: 0,
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
    {
      moduleType: 'waveform-synthesis',
      nodeId: 'waveform-synthesis',
      label: 'PTE-011-08',
      initialParams: {
        modulationIndex: 0.5,
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
      id: 'conn-sig-amp',
      fromNodeId: 'signal-source',
      fromPortId: 'output',
      toNodeId: 'amplifier',
      toPortId: 'input',
    },
    {
      id: 'conn-sig-ws-carrier',
      fromNodeId: 'signal-source',
      fromPortId: 'output',
      toNodeId: 'waveform-synthesis',
      toPortId: 'carrier-in',
    },
    {
      id: 'conn-funcgen-ws-mod',
      fromNodeId: 'func-gen-1',
      fromPortId: 'output',
      toNodeId: 'waveform-synthesis',
      toPortId: 'mod-in',
    },
    {
      id: 'conn-amp-tuned',
      fromNodeId: 'amplifier',
      fromPortId: 'output',
      toNodeId: 'tuned-circuit',
      toPortId: 'input',
    },
    {
      id: 'conn-ws-scope',
      fromNodeId: 'waveform-synthesis',
      fromPortId: 'output',
      toNodeId: 'oscilloscope',
      toPortId: 'ch1',
    },
    {
      id: 'conn-tuned-scope',
      fromNodeId: 'tuned-circuit',
      fromPortId: 'output',
      toNodeId: 'oscilloscope',
      toPortId: 'ch2',
    },
  ],

  procedure: [
    {
      stepNumber: 1,
      instruction: 'Install Signal Source PTE-011-01, Power Supply PTE-011-17, Amplifier PTE-011-07, and Tuned Circuit PTE-011-04 on the panel frame. Connect +15V, -15V, and GND terminals with U-links.',
      instructionId: 'Pasang modul Signal Source PTE-011-01, Power Supply PTE-011-17 dan modul Amplifier PTE-011-07, Tuned Circuit PTE-011-04, pada rangka panel. Hubungkan terminal 15V, -15V dan GND dengan penghubung U.',
      requiredConnections: ['conn-psu-signal'],
    },
    {
      stepNumber: 2,
      instruction: 'Prepare the oscilloscope and other supporting equipment.',
      instructionId: 'Siapkan osiloskop dan peralatan pendukung lainnya.',
    },
    {
      stepNumber: 3,
      instruction: 'Before plugging in the power, make sure the POWER ON/OFF switch is in the OFF position.',
      instructionId: 'Perhatikan, sebelum steker dimasukkan ke stop kontak sumber tegangan jala-jala, yakinkan bahwa saklar POWER ON/OFF selalu dalam posisi OFF.',
    },
    {
      stepNumber: 4,
      instruction: 'Connect the output terminal of Signal Source PTE-011-01 to Amplifier PTE-011-07, Tuned Circuit PTE-011-04, oscilloscope, and function generator.',
      instructionId: 'Hubungkan terminal keluaran modul Signal Source PTE-011-01 dengan modul Amplifier PTE-011-07, Tuned Circuit PTE-011-04, osiloskop, function generator.',
      requiredConnections: [
        'conn-sig-amp',
        'conn-amp-tuned',
        'conn-sig-ws-carrier',
        'conn-funcgen-ws-mod',
        'conn-ws-scope',
        'conn-tuned-scope',
      ],
    },
    {
      stepNumber: 5,
      instruction: 'Turn ON the Power Supply PTE-011-17, oscilloscope, and function generator.',
      instructionId: 'Masukkan steker Power Supply PTE-011-17, osiloskop dan function generator pada stop kontak, kemudian nyalakan sumber tegangan dengan merubah posisi saklar ON/OFF ke posisi ON.',
    },
    {
      stepNumber: 6,
      instruction: 'Set the function generator frequency to 300 Hz with output level at 0 Vp-p.',
      instructionId: 'Atur frekuensi keluaran function generator pada 300 Hz dengan taraf tegangan keluaran 0 Vp-p.',
      paramChanges: [{ nodeId: 'func-gen-1', params: { frequency: 300, amplitude: 0 } }],
    },
    {
      stepNumber: 7,
      instruction: 'Set controller C to frequency 455 kHz with attenuation at 0 dB. Then adjust SWEEP TIME/DIV and VOLT/DIV until the oscilloscope displays a clear waveform.',
      instructionId: 'Atur pengontrol C pada frekuensi 455 kHz dengan taraf pelemahan (pengontrol pelemahan) pada 0 dB, kemudian atur pengontrol SWEEP TIME/DIV dan VOLT/DIV hingga osiloskop memperagakan bentuk sinyal yang baik/mudah diamati.',
      paramChanges: [
        { nodeId: 'signal-source', params: { frequency: 455000, attenuation: 0 } },
      ],
      observation: 'Draw the waveform shape and note the signal frequency.',
      observationId: 'Gambarkan bentuk gelombang dan catat besar frekuensi sinyal tersebut.',
    },
    {
      stepNumber: 8,
      instruction: 'Increase the function generator output level until the AM modulated waveform shows approximately 50% modulation. What output voltage level achieves this?',
      instructionId: 'Atur taraf tegangan keluaran function generator, hingga peragaan gelombang termodulasi AM memiliki persentase kira-kira sebesar 50%. Pada taraf tegangan keluaran berapa hal ini dicapai?',
      paramChanges: [{ nodeId: 'func-gen-1', params: { amplitude: 0.5 } }],
    },
    {
      stepNumber: 9,
      instruction: 'Adjust the tuning control. At what frequency does resonance occur? If the modulated waveform quality is poor, adjust the attenuation control.',
      instructionId: 'Atur pengontrol penalaan, pada frekuensi berapa gelombang termodulasi ini resonansi? Jika peragaan gelombang termodulasi kurang baik, atur pengontrol pelemahan.',
    },
    {
      stepNumber: 10,
      instruction: 'Compare the modulated waveform from Signal Source output with the Tuned Circuit output. Explain your answer!',
      instructionId: 'Bandingkan bentuk gelombang termodulasi keluaran modul Signal Source dengan keluaran modul Tuned Circuit. Jelaskan jawaban anda!',
    },
    {
      stepNumber: 11,
      instruction: 'What is the function of the Tuned Circuit module in this experiment?',
      instructionId: 'Apa fungsi modul Tuned Circuit dalam percobaan ini?',
    },
    {
      stepNumber: 12,
      instruction: 'Increase the function generator output until the AM modulated waveform shows approximately 100% modulation. At what output voltage level is this achieved?',
      instructionId: 'Atur taraf tegangan keluaran function generator, hingga peragaan gelombang termodulasi AM memiliki persentase kira-kira sebesar 100%. Pada taraf tegangan keluaran berapakah hal ini dicapai?',
      paramChanges: [{ nodeId: 'func-gen-1', params: { amplitude: 1.0 } }],
    },
    {
      stepNumber: 13,
      instruction: 'Move the Signal Source output connection to terminal C1=47 nF. Observe the modulated waveform and compare with the previous state. What are your comments and why?',
      instructionId: 'Pindahkan sambungan sinyal keluaran dari modul Signal Source ke terminal C1=47 nF. Amati peragaan bentuk gelombang termodulasi dan bandingkan dengan keadaan sebelumnya. Bagaimanakah komentar anda dan kenapa menjadi demikian?',
    },
    {
      stepNumber: 14,
      instruction: 'Move the information signal (function generator) connection to terminal R1=2k2. Observe the modulated waveform and compare with steps 12 and 13. What are your comments and why?',
      instructionId: 'Pindahkan sambungan sinyal informasi (function generator) ke terminal R1=2k2. Amati peragaan bentuk gelombang termodulasi dan bandingkan dengan langkah 12 dan 13. Bagaimanakah komentar anda dan kenapa menjadi demikian?',
    },
    {
      stepNumber: 15,
      instruction: 'Turn off the power supply and other equipment.',
      instructionId: 'Matikan sumber tegangan modul dan perangkat pendukung lainnya.',
    },
    {
      stepNumber: 16,
      instruction: 'Disconnect probes and connecting cables.',
      instructionId: 'Lepaskan probe dan kabel penghubung lainnya.',
    },
    {
      stepNumber: 17,
      instruction: 'Assemble the experiment as shown in the next diagram.',
      instructionId: 'Rakit percobaan seperti gambar di bawah ini.',
    },
  ],

  observationTargets: [
    {
      id: 'carrier-freq',
      label: 'Carrier Frequency',
      labelId: 'Frekuensi Pembawa',
      unit: 'kHz',
      expectedValue: 455,
      tolerance: 2,
    },
    {
      id: 'mod-freq',
      label: 'Modulating Frequency',
      labelId: 'Frekuensi Pemodulasi',
      unit: 'Hz',
      expectedValue: 300,
      tolerance: 5,
    },
    {
      id: 'mod-index-50',
      label: 'Modulation Index at 50%',
      labelId: 'Indeks Modulasi pada 50%',
      unit: '%',
      expectedValue: 50,
      tolerance: 10,
    },
    {
      id: 'mod-index-100',
      label: 'Modulation Index at 100%',
      labelId: 'Indeks Modulasi pada 100%',
      unit: '%',
      expectedValue: 100,
      tolerance: 10,
    },
  ],
};

/**
 * Measurement table rows for the AM modulation practicum.
 * Students fill in Emax, Emin, and the system auto-calculates m%.
 */
export const amMeasurementRows: MeasurementRow[] = [
  {
    id: 'meas-50',
    label: 'm ≈ 50%',
    targetId: 'mod-index-50',
    fields: [
      { fieldId: 'emax', fieldLabel: 'Emax', unit: 'V', value: '' },
      { fieldId: 'emin', fieldLabel: 'Emin', unit: 'V', value: '' },
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
    id: 'meas-100',
    label: 'm ≈ 100%',
    targetId: 'mod-index-100',
    fields: [
      { fieldId: 'emax', fieldLabel: 'Emax', unit: 'V', value: '' },
      { fieldId: 'emin', fieldLabel: 'Emin', unit: 'V', value: '' },
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
    id: 'meas-c1',
    label: 'C1 = 47nF',
    fields: [
      { fieldId: 'emax', fieldLabel: 'Emax', unit: 'V', value: '' },
      { fieldId: 'emin', fieldLabel: 'Emin', unit: 'V', value: '' },
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
    id: 'meas-r1',
    label: 'R1 = 2k2',
    fields: [
      { fieldId: 'emax', fieldLabel: 'Emax', unit: 'V', value: '' },
      { fieldId: 'emin', fieldLabel: 'Emin', unit: 'V', value: '' },
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
];
