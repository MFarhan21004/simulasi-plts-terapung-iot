/**
 * config.js — Semua konstanta & parameter simulasi
 * Sumber: LKM-3 MSTR Energi dan asumsi tambahan (lihat README §6.9)
 */
window.Config = {
  // === Canvas ===
  CANVAS_W: 1200,
  CANVAS_H: 675,

  // === Tata letak kanvas (README §4) ===
  // Satu sumber koordinat untuk renderer.js dan particles.js agar
  // ujung kabel selalu menempel pada komponen yang benar.
  LAYOUT: {
    HORIZON: 455,
    sun:       { x: 118,  y: 86 },
    reservoir: { x: 44,   y: 330, w: 262, h: 146 },
    waterTop:  354,
    panel:     { cx: 172, cy: 332, w: 166, h: 56, tilt: -12 },
    iot:       { x: 346,  y: 252, w: 252, h: 166 },
    esp:       { x: 440,  y: 292, w: 68,  h: 74 },
    ina:       { x: 362,  y: 292, w: 62,  h: 34, gap: 40 },
    relay:     { x: 522,  y: 292, w: 60,  h: 74 },
    battery:   { x: 368,  y: 492, w: 186, h: 72 },
    lamp:      { x: 648,  y: 500, r: 22 },
    elBox:     { x: 690,  y: 118, w: 182, h: 56 },
    bath:      { x: 700,  y: 392, w: 210, h: 108 },
    bathTop:   408,
    tubeH2:    { x: 734,  y: 242, w: 48,  h: 244 },
    tubeO2:    { x: 832,  y: 242, w: 48,  h: 244 },
    fc:        { x: 930,  y: 400, w: 104, h: 84 },
    pln:       { x: 930,  y: 512, w: 104, h: 48 },
    laptop:    { x: 1050, y: 384, w: 138, h: 104 },
    phone:     { x: 1058, y: 520, w: 60,  h: 112 }
  },

  // === Panel Surya (LKM-3) ===
  P_STC: 5,             // W — daya panel pada STC
  PR: 0.8,              // performance ratio
  PANEL_AREA: 0.045,    // m²
  G_MAX: 1000,          // W/m² — iradiansi acuan STC

  // === Koefisien suhu (asumsi) ===
  GAMMA: 0.004,         // /°C
  NOCT: 45,             // °C
  T_AMB: 30,            // °C

  // === Tegangan panel ilustratif ===
  V_PV_NOM: 5.1,        // V (tetap saat P_pv > 0)

  // === Baterai Li-ion (LKM-3) ===
  V_BAT_NOM: 3.7,       // V nominal
  BAT_AH: 5.2,          // Ah (2×18650)
  E_BAT_MAX: 19.24,     // Wh = 3.7 × 5.2
  ETA_CHG: 0.85,        // efisiensi pengisian (asumsi)
  ETA_DIS: 0.90,        // efisiensi pengosongan (asumsi)
  R_INT: 0.15,          // Ω — resistansi dalam (asumsi)

  // Tabel V_oc(SOC) — interpolasi linear (asumsi)
  VOC_TABLE: [
    { soc: 0.00, v: 3.00 },
    { soc: 0.10, v: 3.40 },
    { soc: 0.50, v: 3.70 },
    { soc: 0.90, v: 4.05 },
    { soc: 1.00, v: 4.20 }
  ],

  // === Beban (LKM-3) ===
  P_ESP: 0.4,           // W — ESP32 + sensor, selalu aktif
  P_LAMP: 1.0,          // W — lampu LED

  // === Elektroliser (LKM-3) ===
  V_EL: 2.0,            // V
  I_EL: 0.5,            // A
  F_CONST: 96485,       // C/mol — konstanta Faraday
  V_M: 24.465,          // L/mol — volume molar gas ideal 25°C 1 atm
  ETA_F_DEFAULT: 1.0,   // efisiensi Faraday default
  H2_TUBE_MAX: 50,      // mL — kapasitas tabung H₂
  O2_TUBE_MAX: 50,      // mL — kapasitas tabung O₂

  // === Fuel Cell (LKM-3) ===
  ETA_FC: 0.50,         // efisiensi fuel cell
  E_MOL_H2: 67.2,       // Wh/mol — energi per mol H₂ (LHV ÷ 2)
  // 2.74 mWh per mL H₂ pada 25°C
  MWH_PER_ML_H2: 2.74,

  // === EMS v2 Thresholds (LKM-3 Lampiran 2) ===
  EMS_V2: {
    SURPLUS_V:    4.10,  // V — aktifkan elektroliser
    SURPLUS_OFF:  3.95,  // V — matikan elektroliser (histeresis)
    DEFICIT_V:    3.40,  // V — ambang defisit
    DEFICIT_DELAY: 5,    // detik simulasi
    DEFICIT_H2:   5,     // mL — stok minimum untuk fuel cell
    NORMAL_V:     3.80,  // V — kembali ke NORMAL
    GRID_SOC:     0.20   // PLN aktif malam hari saat SOC baterai <= 20%
  },

  // === EMS v1 Thresholds (sebelum perbaikan) ===
  EMS_V1: {
    SURPLUS_V:    4.10,
    DEFICIT_V:    3.50
  },

  // === Awan (asumsi) ===
  T_CLOUD_MIN: 0.15,    // transmitansi minimum (awan tebal)
  CLOUD_DEFAULT_DENSITY: 0.7,
  CLOUD_DEFAULT_SPEED: 5,   // px/detik
  CLOUD_COUNT_DEFAULT: 2,

  // === Waktu ===
  TIME_SCALES: [1, 10, 60, 600, 3600],
  TIME_SCALE_DEFAULT: 60,

  // === Partikel ===
  PARTICLE_V0: 30,      // px/s — kecepatan dasar
  PARTICLE_K: 20,       // koefisien kecepatan terhadap √P

  // === Default state ===
  DEFAULT_SOC: 0.70,
  DEFAULT_H2: 0,        // mL
  DEFAULT_LAMP: true,
  DEFAULT_EMS_VERSION: 'v2'
};
