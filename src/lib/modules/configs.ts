import { ModuleConfig, ModuleId } from '../../types/modules';

// MODUL 1: Modulasi Amplitudo (TE02005)
// Modul PUDAK: Signal Source PTE-011-01, Amplifier PTE-011-07, Tuned Circuit PTE-011-04, Power Supply PTE-011-17
export const AM_CONFIG: ModuleConfig = {
  id: 'am',
  title: 'Modulasi Amplitudo',
  subtitle: 'Amplitude Modulation (AM) — TE02005',
  description:
    'Mempelajari prinsip modulasi amplitudo: sinyal informasi menumpang pada gelombang pembawa (carrier) sehingga amplitudo carrier berubah mengikuti sinyal informasi.',

  instruments: [
    { instrumentId: 'afg1',  label: 'Function Generator (Sinyal Informasi)', defaultX: 40,  defaultY: 60,  isRequired: true  },
    { instrumentId: 'osc',   label: 'Oscilloscope',                          defaultX: 520, defaultY: 60,  isRequired: true  },
    { instrumentId: 'gfc',   label: 'Frequency Counter',                     defaultX: 520, defaultY: 420, isRequired: true  },
    { instrumentId: 'pudak', label: 'PUDAK Signal Source + Amplifier + Tuned Circuit', defaultX: 40, defaultY: 280, isRequired: true },
  ],

  suggestedParams: {
    message: { waveform: 'sine', frequency: 300, amplitude: 0, offset: 0 },
  },

  steps: [
    {
      id: 0, title: 'Persiapan Peralatan',
      instruction: 'Pasang modul Signal Source PTE-011-01, Power Supply PTE-011-17, Amplifier PTE-011-07, dan Tuned Circuit PTE-011-04 pada rangka panel. Hubungkan terminal +15V, -15V, dan GND dengan penghubung U.',
      hint: 'Pastikan semua modul terpasang dengan benar sebelum menyalakan power.',
      validation: { type: 'manual', confirmLabel: 'Modul sudah terpasang dengan benar' },
    },
    {
      id: 1, title: 'Rangkai Koneksi Sinyal',
      instruction: 'Hubungkan terminal keluaran modul Signal Source PTE-011-01 ke modul Amplifier PTE-011-07 dan Tuned Circuit PTE-011-04, kemudian sambungkan osiloskop dan function generator seperti Gambar 5.2.',
      hint: 'Gunakan kabel BNC untuk menghubungkan port OUTPUT Signal Source ke input Amplifier.',
      requiredConnections: [
        { fromPortId: 'pudak_output', toPortId: 'osc_ch1', description: 'Signal Source OUTPUT → OSC CH1' },
        { fromPortId: 'afg1_main_out', toPortId: 'pudak_input_a', description: 'AFG MAIN OUT → Signal Source AUDIO INPUT' },
      ],
      validation: {
        type: 'connection',
        connections: [
          { fromPortId: 'pudak_output', toPortId: 'osc_ch1' },
          { fromPortId: 'afg1_main_out', toPortId: 'pudak_input_a' },
        ],
      },
    },
    {
      id: 2, title: 'Nyalakan Peralatan',
      instruction: 'Masukkan steker Power Supply PTE-011-17, osiloskop, dan function generator pada stop kontak. Nyalakan sumber tegangan dengan mengubah saklar ON/OFF ke posisi ON.',
      validation: { type: 'manual', confirmLabel: 'Semua peralatan sudah menyala' },
    },
    {
      id: 3, title: 'Atur Function Generator',
      instruction: 'Atur frekuensi keluaran function generator pada 300 Hz dengan taraf tegangan keluaran 0 Vp-p (tidak ada sinyal informasi dulu).',
      hint: 'Tekan tombol FUNC → pilih Sine, FREQ → ketik 300 → Hz, AMPL → 0 → Vpp',
      expectedParams: { afg1: { frequency: 300, amplitude: 0, waveform: 'sine' } },
      validation: {
        type: 'parameter',
        paramCheck: { instrumentId: 'afg1', field: 'frequency', expected: 300, tolerance: 10 },
      },
    },
    {
      id: 4, title: 'Atur Carrier 455 kHz',
      instruction: 'Atur pengontrol C pada modul Signal Source pada frekuensi 455 kHz dengan taraf pelemahan (pengontrol pelemahan) pada 0 dB. Amati bentuk gelombang pada osiloskop dan catat besar frekuensinya.',
      hint: 'Frekuensi carrier 455 kHz adalah frekuensi IF (Intermediate Frequency) standar AM.',
    },
    {
      id: 5, title: 'Modulasi AM 50%',
      instruction: 'Atur taraf tegangan keluaran function generator hingga peragaan gelombang termodulasi AM memiliki persentase kira-kira sebesar 50%. Rumus: m% = (Em/Ec) × 100. Gambarkan bentuk gelombang pada grafik.',
      hint: 'Naikkan amplitudo AFG perlahan sambil amati envelope gelombang AM di osiloskop. Pada 50%, bagian atas dan bawah envelope tidak menyentuh nol.',
    },
    {
      id: 6, title: 'Modulasi AM 100%',
      instruction: 'Atur taraf tegangan keluaran function generator hingga peragaan gelombang termodulasi AM memiliki persentase kira-kira sebesar 100%. Pada kondisi ini Emin = 0. Catat besar tegangan tersebut.',
      hint: 'Pada modulasi 100%, envelope gelombang tepat menyentuh nol di bagian bawah.',
    },
    {
      id: 7, title: 'Amati Waveform Synthesis',
      instruction: 'Rakit percobaan seperti Gambar 5.3 menggunakan modul Waveform Synthesis PTE-011-08. Pindahkan pengatur (switch) normal ke carrier. Nyalakan power dan atur frekuensi hingga diperoleh gelombang sempurna pada osiloskop.',
      hint: 'Waveform Synthesis menghasilkan sinyal AM dari komponen-komponen dasar.',
    },
    {
      id: 8, title: 'Kesimpulan',
      instruction: 'Bandingkan gelombang termodulasi dari modul Signal Source dengan keluaran modul Tuned Circuit. Jelaskan fungsi modul Tuned Circuit dalam percobaan ini.',
      validation: { type: 'observe', confirmLabel: 'Praktikum selesai, kesimpulan sudah dicatat' },
    },
  ],
};

// MODUL 2: Modulasi Frekuensi (TE02009)
// Modul PUDAK: Signal Source PTE-011-01, Power Supply PTE-011-17
export const FM_CONFIG: ModuleConfig = {
  id: 'fm',
  title: 'Modulasi Frekuensi',
  subtitle: 'Frequency Modulation (FM) — TE02009',
  description:
    'Mempelajari modulasi frekuensi: sinyal informasi memvariasikan frekuensi dari frekuensi gelombang pembawa. Carrier tetap tetapi frekuensinya bergeser sesuai amplitudo sinyal informasi.',

  instruments: [
    { instrumentId: 'afg1',  label: 'Function Generator (Sinyal Informasi)', defaultX: 40,  defaultY: 60,  isRequired: true },
    { instrumentId: 'osc',   label: 'Oscilloscope',                          defaultX: 520, defaultY: 60,  isRequired: true },
    { instrumentId: 'gfc',   label: 'Frequency Counter',                     defaultX: 520, defaultY: 420, isRequired: true },
    { instrumentId: 'pudak', label: 'PUDAK Signal Source (FM)',               defaultX: 40,  defaultY: 280, isRequired: true },
  ],

  suggestedParams: {
    message: { waveform: 'square', frequency: 1, amplitude: 2, offset: 0 },
  },

  steps: [
    {
      id: 0, title: 'Persiapan Peralatan',
      instruction: 'Pasang modul Signal Source PTE-011-01 dan Power Supply PTE-011-17 pada rangka panel dengan kedudukan yang benar. Hubungkan terminal +15V, -15V, dan GND dengan penghubung U seperti Gambar 9.1.',
      validation: { type: 'manual', confirmLabel: 'Modul terpasang dengan benar' },
    },
    {
      id: 1, title: 'Rangkai Koneksi',
      instruction: 'Hubungkan terminal keluaran modul Signal Source PTE-011-01 dengan osiloskop, function generator, dan frekuensi meter seperti Gambar 9.1.',
      requiredConnections: [
        { fromPortId: 'pudak_output', toPortId: 'osc_ch1', description: 'Signal Source OUTPUT → OSC CH1' },
        { fromPortId: 'pudak_output', toPortId: 'gfc_input', description: 'Signal Source OUTPUT → GFC INPUT' },
        { fromPortId: 'afg1_main_out', toPortId: 'pudak_input_a', description: 'AFG → Signal Source INPUT' },
      ],
      validation: { type: 'connection', connections: [
        { fromPortId: 'pudak_output', toPortId: 'osc_ch1' },
        { fromPortId: 'afg1_main_out', toPortId: 'pudak_input_a' },
      ]},
    },
    {
      id: 2, title: 'Atur Carrier 455 kHz',
      instruction: 'Atur pengontrol C pada frekuensi 455 kHz dengan taraf pelemahan (pengontrol pelemahan) pada 0 dB. Atur pengontrol SWEEP TIME/DIV dan VOLT/DIV hingga osiloskop memperagakan bentuk sinyal yang baik.',
      hint: 'Carrier 455 kHz adalah standar IF. Putar knob C perlahan sampai frekuensi counter menunjukkan 455kHz.',
    },
    {
      id: 3, title: 'Atur Function Generator',
      instruction: 'Atur taraf keluaran frekuensi dari function generator pada 1 Hz gelombang persegi (square wave) / 2 Volt p-p. Gambarkan bentuk gelombang dan catat besar frekuensi sinyal tersebut.',
      expectedParams: { afg1: { frequency: 1, amplitude: 2, waveform: 'square' } },
      validation: { type: 'parameter', paramCheck: { instrumentId: 'afg1', field: 'frequency', expected: 1, tolerance: 0.5 } },
    },
    {
      id: 4, title: 'Amati Gelombang FM',
      instruction: 'Amati gelombang FM pada osiloskop. Frekuensi sinyal carrier berubah mengikuti sinyal pemodulasi. Saat sinyal informasi positif, carrier melambat; saat negatif, carrier mempercepat (atau sebaliknya tergantung polaritas).',
      hint: 'Perhatikan cara kerapatan gelombang carrier berubah sesuai dengan perubahan sinyal square wave.',
    },
    {
      id: 5, title: 'Variasi Frekuensi 2-5 Hz',
      instruction: 'Atur taraf keluaran frekuensi dari function generator pada 2, 3, 4 dan 5 Hz. Bagaimana bentuk gelombangnya? Amati perubahan deviasi frekuensi.',
    },
    {
      id: 6, title: 'Ganti ke Gelombang Sinus',
      instruction: 'Pada frekuensi 1 Hz, ganti gelombang persegi menjadi gelombang sinus. Apa yang terjadi dengan bentuk gelombang keluaran modul Signal Source?',
      hint: 'Dengan sinus, perubahan frekuensi carrier akan lebih halus dan berkelanjutan (smooth FM).',
    },
    {
      id: 7, title: 'Variasi Kontroler B',
      instruction: 'Atur pengontrol B secara bertahap, dan perhatikan bentuk gelombang yang diperagakan osiloskop. Pengontrol B mengatur deviasi frekuensi maksimum. Bagaimana komentar anda?',
    },
    {
      id: 8, title: 'Kesimpulan',
      instruction: 'Selesaikan evaluasi: (1) Gambar modulator FM paling sederhana. (2) Perbedaan Direct FM dan Indirect FM. (3) Hitung indeks modulasi jika deviasi 20kHz, fm=10kHz.',
      validation: { type: 'observe', confirmLabel: 'Praktikum selesai' },
    },
  ],
};

// MODUL 3: Demodulasi (TE02007)
// Modul PUDAK: Signal Source PTE-011-01, Detector PTE-011-02, Amplifier PTE-011-07, Tuned Circuit PTE-011-04
export const DEMOD_CONFIG: ModuleConfig = {
  id: 'demodulasi',
  title: 'Demodulasi',
  subtitle: 'AM Demodulation — TE02007',
  description:
    'Mempelajari proses demodulasi AM: memisahkan sinyal informasi dari gelombang pembawa. Demodulator AM menggunakan diode envelope detector.',

  instruments: [
    { instrumentId: 'afg1',  label: 'Function Generator (Sinyal Informasi)', defaultX: 40,  defaultY: 60,  isRequired: true },
    { instrumentId: 'osc',   label: 'Oscilloscope',                          defaultX: 520, defaultY: 60,  isRequired: true },
    { instrumentId: 'gfc',   label: 'Frequency Counter',                     defaultX: 520, defaultY: 420, isRequired: false },
    { instrumentId: 'pudak', label: 'PUDAK Signal Source + Detector',        defaultX: 40,  defaultY: 280, isRequired: true },
  ],

  steps: [
    {
      id: 0, title: 'Persiapan Peralatan',
      instruction: 'Pasang modul Signal Source PTE-011-01, Power Supply PTE-011-17, Detector PTE-011-02, dan Tuned Circuit PTE-011-04 pada rangka panel. Hubungkan terminal 15V, -15V, dan GND dengan penghubung U seperti Gambar 7.2.',
      validation: { type: 'manual', confirmLabel: 'Modul terpasang' },
    },
    {
      id: 1, title: 'Rangkai Koneksi',
      instruction: 'Hubungkan terminal keluaran modul Signal Source PTE-011-01 dengan modul Tuned Circuit PTE-011-04, osiloskop, dan function generator seperti Gambar 7.2.',
      requiredConnections: [
        { fromPortId: 'afg1_main_out', toPortId: 'pudak_input_a', description: 'AFG → Signal Source' },
        { fromPortId: 'pudak_output',  toPortId: 'osc_ch1', description: 'Detector OUTPUT → OSC CH1' },
      ],
      validation: { type: 'connection', connections: [
        { fromPortId: 'afg1_main_out', toPortId: 'pudak_input_a' },
        { fromPortId: 'pudak_output',  toPortId: 'osc_ch1' },
      ]},
    },
    {
      id: 2, title: 'Nyalakan dan Atur Awal',
      instruction: 'Nyalakan semua peralatan. Atur frekuensi keluaran function generator pada 300 Hz dengan taraf tegangan keluaran 0 Vp-p.',
      expectedParams: { afg1: { frequency: 300, amplitude: 0 } },
    },
    {
      id: 3, title: 'Atur Carrier 455 kHz',
      instruction: 'Atur pengontrol C pada frekuensi 455 kHz dengan taraf pelemahan pada 0 dB. Atur SWEEP TIME/DIV dan VOLT/DIV hingga osiloskop memperagakan bentuk sinyal yang baik. Gambarkan bentuk gelombang.',
    },
    {
      id: 4, title: 'Modulasi AM 50%',
      instruction: 'Atur taraf tegangan keluaran function generator hingga peragaan gelombang termodulasi AM memiliki persentase kira-kira sebesar 50%.',
    },
    {
      id: 5, title: 'Hubungkan Amplifier ke Detector',
      instruction: 'Hubungkan terminal keluaran modul Amplifier ke terminal masukan (diode) modul Detektor. Terminal keluaran detektor dihubungkan ke terminal masukan penguat (audio amp) seperti Gambar 7.2.',
    },
    {
      id: 6, title: 'Amati Keluaran Detector',
      instruction: 'Pindahkan probe osiloskop pada terminal keluaran audio amp pada modul Detektor. Gambarkan hasil pengamatan. Ini adalah sinyal informasi hasil demodulasi!',
      hint: 'Keluaran detector harusnya menyerupai sinyal 300Hz yang dikirimkan oleh function generator.',
    },
    {
      id: 7, title: 'Modulasi AM 100%',
      instruction: 'Atur taraf tegangan keluaran function generator hingga peragaan gelombang termodulasi AM memiliki persentase kira-kira sebesar 100%. Amati keluaran detector dan bandingkan.',
    },
    {
      id: 8, title: 'Kesimpulan',
      instruction: 'Jawab evaluasi: (1) Jelaskan prinsip kerja rangkaian detektor. (2) Gambarkan rangkaian demodulator AM. (3) Fungsi demodulator pada super heterodyne receiver.',
      validation: { type: 'observe', confirmLabel: 'Praktikum demodulasi selesai' },
    },
  ],
};

// MODUL 4: Sinyal Digital (TE03001)
// Modul PUDAK: Data Source PTE-001-01, Data Receiver PTE-001-05, Audio Module PTE-001-06, Power Supply PTE-001-12
export const DIGITAL_CONFIG: ModuleConfig = {
  id: 'digital',
  title: 'Sinyal Digital',
  subtitle: 'Digital Signal Communication — TE03001',
  description:
    'Mempelajari sinyal digital dalam komunikasi: transmisi data dalam bentuk bit, konversi ADC/DAC, dan demonstrasi sistem telepon digital sederhana.',

  instruments: [
    { instrumentId: 'afg1',  label: 'Function Generator',  defaultX: 40,  defaultY: 60,  isRequired: true },
    { instrumentId: 'osc',   label: 'Oscilloscope',        defaultX: 520, defaultY: 60,  isRequired: true },
    { instrumentId: 'pudak', label: 'PUDAK Data Source + Data Receiver', defaultX: 40, defaultY: 280, isRequired: true },
  ],

  steps: [
    {
      id: 0, title: 'Persiapan Peralatan',
      instruction: 'Siapkan osiloskop. Tempatkan modul Data Source PTE-001-01 dan Power Supply PTE-001-12 pada rangka panel. Dalam keadaan peralatan non-aktif, buat hubungan peralatan seperti Gambar 1.1.',
      validation: { type: 'manual', confirmLabel: 'Modul siap' },
    },
    {
      id: 1, title: 'Atur Osiloskop',
      instruction: 'Atur osiloskop: COUPLE untuk Ch.1 dan Ch.2 pada posisi DC. VOLTS/DIV pada 5V. SWEEP TIME/DIV pada 20μs, external trigger dengan level (+).',
      hint: 'External trigger diperlukan untuk sinkronisasi dengan bit clock dari Data Source.',
    },
    {
      id: 2, title: 'Amati Bit Clock dan Word Clock',
      instruction: 'Aktifkan semua peralatan. Pada Ch.1 terlihat BIT CLOCK yang menentukan nilai di mana bit sinyal-sinyal akan dibangkitkan. Ch.2 memperlihatkan WORD CLOCK yang berubah setelah 8 bit.',
      requiredConnections: [
        { fromPortId: 'pudak_output',   toPortId: 'osc_ch1', description: 'BIT CLOCK → OSC CH1' },
        { fromPortId: 'pudak_mod_out',  toPortId: 'osc_ch2', description: 'WORD CLOCK → OSC CH2' },
      ],
      validation: { type: 'connection', connections: [
        { fromPortId: 'pudak_output', toPortId: 'osc_ch1' },
      ]},
    },
    {
      id: 3, title: 'Atur Pola Bit',
      instruction: 'Pindahkan Ch.2 osiloskop ke terminal NRZ DATA. Tempatkan saklar pilih FORMAT DATA pada posisi untuk data 8 bit, saklar pilih Data Source pada posisi tengah. Susun pola 01001100 dengan tombol-tombol penyusun pola.',
      hint: 'Pola bit 01001100 dalam biner = desimal 76. Tombol yang aktif (LED ON) = bit 1.',
    },
    {
      id: 4, title: 'Konversi Analog ke Digital',
      instruction: 'Tempatkan saklar pilih Data Source pada kedudukan ADC. Atur function generator menghasilkan gelombang segi-tiga dengan tegangan 4Vp-p pada 0.01Hz. Hubungkan ke ANALOG INPUT Data Source dan amati NRZ DATA pada osiloskop.',
      requiredConnections: [
        { fromPortId: 'afg1_main_out', toPortId: 'pudak_input_a', description: 'AFG → Data Source ANALOG INPUT' },
      ],
      expectedParams: { afg1: { frequency: 0.01, amplitude: 4, waveform: 'ramp' } },
    },
    {
      id: 5, title: 'Penerimaan Digital Word',
      instruction: 'Tempatkan modul Data Receiver PTE-001-05 pada rangka panel. Hubungkan NRZ DATA dari Data Source ke Data Receiver. Amati LED pada modul Data Receiver — pola yang sama seperti yang dikirim oleh Data Source.',
    },
    {
      id: 6, title: 'Keluaran Analog (DAC)',
      instruction: 'Sambungkan Ch.1 osiloskop ke terminal ANALOG INPUT dan Ch.2 ke terminal ANALOG OUT. Atur function generator pada frekuensi 100Hz. Amati bentuk gelombang yang dihasilkan oleh Data Receiver (ini adalah hasil DAC).',
      requiredConnections: [
        { fromPortId: 'pudak_output', toPortId: 'osc_ch2', description: 'Data Receiver ANALOG OUT → OSC CH2' },
      ],
    },
    {
      id: 7, title: 'Demonstrasi Telepon Digital',
      instruction: 'Gunakan Audio Module PTE-001-06 sebagai microphone dan speaker. Rangkai seperti Gambar 1.6. Atur generator fungsi pada 500Hz. Ucapkan sesuatu pada microphone dan dengarkan hasilnya.',
      hint: 'Ini mendemonstrasikan transmisi suara via sistem digital sederhana!',
    },
    {
      id: 8, title: 'Kesimpulan',
      instruction: 'Suatu sistem komunikasi digital mengirim dan menerima informasi dengan proses digital. Informasi analog dapat dialihkan ke digital (ADC) dan dikembalikan ke analog (DAC).',
      validation: { type: 'observe', confirmLabel: 'Praktikum sinyal digital selesai' },
    },
  ],
};

// MODUL 5: Sample and Hold (TE03005)
// Modul PUDAK: Sample Hold and Multiplex PTE-001-09, Power Supply PTE-001-12
export const SAMPLE_HOLD_CONFIG: ModuleConfig = {
  id: 'sample_hold',
  title: 'Sample and Hold',
  subtitle: 'Sampling & Penahanan — TE03005',
  description:
    'Mempelajari proses sampling dan penahanan sinyal: bagaimana sinyal analog dicuplik secara periodik, ditahan (hold) dalam kapasitor, dan direkonstruksi kembali.',

  instruments: [
    { instrumentId: 'afg1',  label: 'Function Generator (Sinyal Informasi)', defaultX: 40,  defaultY: 60,  isRequired: true },
    { instrumentId: 'osc',   label: 'Oscilloscope',                          defaultX: 520, defaultY: 60,  isRequired: true },
    { instrumentId: 'gfc',   label: 'Frequency Counter',                     defaultX: 520, defaultY: 420, isRequired: true },
    { instrumentId: 'pudak', label: 'PUDAK Sample Hold and Multiplex PTE-001-09', defaultX: 40, defaultY: 280, isRequired: true },
  ],

  suggestedParams: {
    message: { waveform: 'sine', frequency: 100, amplitude: 3, offset: 0 },
  },

  steps: [
    {
      id: 0, title: 'Persiapan dan Atur Osiloskop',
      instruction: 'Tempatkan peralatan pada rangka panel dan hubungkan seperti Gambar 5.3. Atur osiloskop: COUPLE Ch.1 & Ch.2 pada DC. VOLT/DIV pada 5V. SWEEP TIME/DIV pada 10μs.',
      validation: { type: 'manual', confirmLabel: 'Osiloskop sudah diatur' },
    },
    {
      id: 1, title: 'Hubungkan Clock',
      instruction: 'Hubungkan CLOCK OUTPUT ke CLOCK INPUT CONTROL LOGIC pada modul Sample Hold and Multiplex. Hubungkan frequency counter ke keluaran PULSE1 modul Sample Hold and Multiplex.',
      requiredConnections: [
        { fromPortId: 'pudak_output', toPortId: 'gfc_input', description: 'PULSE1 → GFC INPUT' },
      ],
    },
    {
      id: 2, title: 'Cek Frekuensi PULSE1 dan PULSE2',
      instruction: 'Aktifkan semua peralatan. Catat frekuensi keluaran PULSE1 yang ditunjukkan oleh frequency counter. Pindahkan frequency counter ke PULSE2 — samakah besar frekuensinya? Jelaskan!',
      hint: 'PULSE1 dan PULSE2 adalah dua sinyal pencuplik yang bergantian fase — keduanya harus memiliki frekuensi yang sama karena berasal dari clock yang sama, hanya berbeda fase.',
    },
    {
      id: 3, title: 'Atur Clock 5 kHz',
      instruction: 'Hubungkan frequency counter ke CLOCK OUTPUT. Putar tombol CLOCK FREQUENCY modul Sample Hold and Multiplex hingga penunjukan frequency counter sebesar 5kHz.',
    },
    {
      id: 4, title: 'Atur Sample Pulse Width 5μs',
      instruction: 'Hubungkan Ch.1 osiloskop ke keluaran PULSE1. Atur tombol SAMPLE PULSE WIDTH CONTROL LOGIC hingga didapatkan lebar pulsa pencuplik sebesar 5μs yang ditampilkan oleh Ch.1 osiloskop.',
    },
    {
      id: 5, title: 'Atur Function Generator',
      instruction: 'Atur generator fungsi untuk menghasilkan sinyal sinus sebesar 100Hz, 3Vp-p. Hubungkan ke INPUT1 modul Sample Hold and Multiplex. Atur juga VOLT/DIV pada 2V/div, sweep time pada 2ms/div, trigger pada Ch.1.',
      requiredConnections: [
        { fromPortId: 'afg1_main_out', toPortId: 'pudak_input_a', description: 'AFG → PUDAK INPUT1' },
      ],
      expectedParams: { afg1: { frequency: 100, amplitude: 3, waveform: 'sine' } },
    },
    {
      id: 6, title: 'Pindahkan Ch.1 ke INPUT1',
      instruction: 'Pindahkan Ch.1 osiloskop ke INPUT1 (sinyal asli). Hubungkan Ch.2 osiloskop ke kapasitor bagian atas (keluaran rangkaian yang menggunakan INPUT1 sebagai masukannya).',
      requiredConnections: [
        { fromPortId: 'pudak_output', toPortId: 'osc_ch2', description: 'S&H OUTPUT → OSC CH2' },
      ],
    },
    {
      id: 7, title: 'Amati Sinyal Hasil Sampling',
      instruction: 'Amati sinyal yang ditampilkan Ch.2 osiloskop (hasil pencuplikan) dan bandingkan dengan sinyal pada Ch.1 (sinyal asli). Terlihat seperti tangga (stepped waveform)!',
      hint: 'Sinyal hasil S&H berbentuk tangga karena tegangan "diingat" kapasitor untuk setiap periode pencuplikan.',
    },
    {
      id: 8, title: 'Pengaruh Lebar Pulsa',
      instruction: 'Perkecil lebar pulsa pencuplik dengan memutar tombol SAMPLE PULSE WIDTH berlawanan arah jarum jam. Perhatikan amplitudo sinyal hasil pencuplikan. Apakah amplitudonya menurun? Mengapa?',
    },
    {
      id: 9, title: 'Rekonstruksi via Filter',
      instruction: 'Hubungkan keluaran kapasitor ke masukan FILTER1. Pindahkan Ch.2 ke keluaran FILTER1. Bandingkan bentuk sinyal keluaran dengan sinyal masukan. Filter menghaluskan tangga menjadi sinyal sinus kembali!',
    },
    {
      id: 10, title: 'Kesimpulan',
      instruction: 'Atur CLOCK FREQUENCY hingga 20kHz. Atur AFG ke 500Hz, 5Vp-p. Variasikan lebar pulsa dari 25μs hingga 2μs dan catat tegangan keluaran Filter1 ke dalam Tabel 5.1.',
      validation: { type: 'observe', confirmLabel: 'Tabel data sudah diisi, praktikum selesai' },
    },
  ],
};

// MODUL 6: Aliasing dan Multiplexing (TE03006)
// Modul PUDAK: Sample Hold and Multiplex PTE-001-09 (sama dengan S&H!)
export const ALIASING_CONFIG: ModuleConfig = {
  id: 'aliasing',
  title: 'Aliasing & Multiplexing',
  subtitle: 'Aliasing and Multiplex Signaling — TE03006',
  description:
    'Mempelajari aliasing (frekuensi bayangan saat fs < 2fm) dan Time Division Multiplexing (TDM): pengiriman dua sinyal sekaligus pada satu kanal dengan metode pencuplikan bergantian.',

  instruments: [
    { instrumentId: 'afg1',  label: 'Function Generator ①', defaultX: 40,  defaultY: 60,  isRequired: true },
    { instrumentId: 'afg2',  label: 'Function Generator ②', defaultX: 40,  defaultY: 280, isRequired: true },
    { instrumentId: 'osc',   label: 'Oscilloscope',         defaultX: 520, defaultY: 60,  isRequired: true },
    { instrumentId: 'gfc',   label: 'Frequency Counter',    defaultX: 520, defaultY: 420, isRequired: true },
    { instrumentId: 'pudak', label: 'PUDAK Sample Hold and Multiplex PTE-001-09', defaultX: 240, defaultY: 160, isRequired: true },
  ],

  suggestedParams: {
    message:  { waveform: 'sine', frequency: 1000, amplitude: 1, offset: 0 },
    carrier: { waveform: 'sine', frequency: 400,  amplitude: 1, offset: 0 },
  },

  steps: [
    {
      id: 0, title: 'Persiapan — Percobaan Aliasing',
      instruction: 'Siapkan peralatan dan tempatkan pada rangka panel serta hubungkan seperti Gambar 6.4. Hubungkan CLOCK OUTPUT ke CLOCK INPUT yang terdapat pada module Sample Hold and Multiplex.',
      validation: { type: 'manual', confirmLabel: 'Alat siap untuk percobaan aliasing' },
    },
    {
      id: 1, title: 'Atur Clock 20 kHz',
      instruction: 'Aktifkan semua peralatan dan atur tombol CLOCK FREQUENCY modul Sample Hold and Multiplex hingga frekuensi pulsa pencuplik pada PULSE1 sebesar 20kHz yang ditunjukkan oleh frequency counter.',
      requiredConnections: [
        { fromPortId: 'pudak_output', toPortId: 'gfc_input', description: 'PULSE1 → GFC INPUT' },
      ],
    },
    {
      id: 2, title: 'Atur Sample Pulse Width 10μs',
      instruction: 'Atur tombol SAMPLE PULSE WIDTH CONTROL LOGIC hingga lebar pulsa pencuplik pada PULSE1 sebesar 10μs, yang ditunjukkan oleh Ch.1 osiloskop.',
    },
    {
      id: 3, title: 'Atur Function Generator 1 kHz',
      instruction: 'Atur generator fungsi agar menghasilkan gelombang sinus sebesar 1kHz, 1Vp-p, serta hubungkan keluarannya ke INPUT1 modul Sample Hold and Multiplex.',
      requiredConnections: [
        { fromPortId: 'afg1_main_out', toPortId: 'pudak_input_a', description: 'AFG① → PUDAK INPUT1' },
      ],
      expectedParams: { afg1: { frequency: 1000, amplitude: 1, waveform: 'sine' } },
    },
    {
      id: 4, title: 'Amati Aliasing',
      instruction: 'Hubungkan Ch.2 osiloskop pada keluaran FILTER2. Pindahkan Ch.1 ke INPUT1. Sambil mengamati, naikkan frekuensi sinyal masukan perlahan-lahan hingga 50kHz. Pada frekuensi pencuplik 20kHz, frekuensi sinyal maksimum yang masih dapat ditangani adalah berapa?',
      hint: 'Menurut teori Nyquist, frekuensi sinyal masukan maksimum = fs/2 = 10kHz. Di atas itu, mulai terjadi aliasing.',
    },
    {
      id: 5, title: 'Anti-Aliasing Filter',
      instruction: 'Pindahkan keluaran generator fungsi ke masukan FILTER1 dan hubungkan keluaran FILTER1 ke INPUT1. Atur frekuensi sinyal masukan agar nilainya menjadi 1kHz. Naikkan kembali frekuensi masukan hingga 50kHz sambil amati. Bandingkan hasilnya!',
      hint: 'Filter menghalangi frekuensi tinggi masuk ke sampler — inilah fungsi anti-aliasing filter!',
    },
    {
      id: 6, title: 'Time Division Multiplexing',
      instruction: 'Hubungkan peralatan seperti Gambar 6.5. Aktifkan dan atur CLOCK FREQUENCY hingga CLOCK OUTPUT = 40kHz. Putar tombol SAMPLE PULSE WIDTH setengah putaran.',
    },
    {
      id: 7, title: 'Amati Commutating Signal',
      instruction: 'Amati bentuk sinyal COMMUTATING SIGNAL pada Ch.1 osiloskop, serta amati PULSE1 dan PULSE2 dengan Ch.2 osiloskop. Lihat Gambar 6.6: commutating signal bergantian antara PULSE1 dan PULSE2.',
      hint: 'COMMUTATING SIGNAL adalah sinyal yang mengontrol multiplexer — saat positif INPUT1 dihubungkan, saat negatif INPUT2 dihubungkan ke output.',
    },
    {
      id: 8, title: 'TDM dengan Dua Sinyal',
      instruction: 'Ganti hubungan seperti Gambar 6.7. Atur AFG① pada 1kHz, 1Vp-p untuk FILTER1. Aktifkan AFG② dan atur pada 400Hz, 1Vp-p untuk FILTER3. Amati MULTIPLEXED OUTPUT pada Ch.1 — terlihat dua sinyal bergantian!',
      requiredConnections: [
        { fromPortId: 'afg1_main_out', toPortId: 'pudak_input_a', description: 'AFG① → FILTER1' },
        { fromPortId: 'afg2_main_out', toPortId: 'pudak_input_b', description: 'AFG② → FILTER3' },
      ],
      expectedParams: {
        afg1: { frequency: 1000, amplitude: 1, waveform: 'sine' },
      },
    },
    {
      id: 9, title: 'Amati Cross-Talk',
      instruction: 'Amati keluaran FILTER2 pada Ch.2. Tampak sinyal keluaran terganggu oleh kehadiran sinyal kedua — ini disebut cross-talk! Hitung tingkat cross-talk: 20log₁₀(Amplitudo FILTER4 / Amplitudo FILTER2) dalam dB.',
    },
    {
      id: 10, title: 'Kesimpulan',
      instruction: 'Kesimpulan: (1) Aliasing terjadi jika fs < 2fm. (2) Anti-aliasing filter dibutuhkan. (3) TDM mengirim dua sinyal pada satu kanal. (4) Cross-talk adalah gangguan antar kanal dalam TDM.',
      validation: { type: 'observe', confirmLabel: 'Praktikum aliasing & multiplexing selesai' },
    },
  ],
};

// Registry semua modul
export const MODULE_CONFIGS: Record<ModuleId, ModuleConfig> = {
  am:          AM_CONFIG,
  fm:          FM_CONFIG,
  demodulasi:  DEMOD_CONFIG,
  digital:     DIGITAL_CONFIG,
  sample_hold: SAMPLE_HOLD_CONFIG,
  aliasing:    ALIASING_CONFIG,
};

export function getModuleConfig(id: ModuleId): ModuleConfig {
  return MODULE_CONFIGS[id];
}