/**
 * Parameter fisik sistem — nilai diambil dari LKM-3 MSTR Energi
 * (lihat README_FINAL_ANTIGRAVITY.md §6) agar angka pada dashboard ini
 * identik dengan simulasi kanvas versi vanilla.
 */
export const PHYSICS = {
  /** Panel surya */
  P_STC: 5,          // W pada Standard Test Condition
  PR: 0.8,           // performance ratio
  G_MAX: 1000,       // W/m²
  GAMMA: 0.004,      // koefisien suhu /°C
  NOCT: 45,          // °C
  T_AMB: 30,         // °C
  V_PV_NOM: 5.1,     // V ilustratif

  /** Baterai Li-ion 2×18650 */
  V_BAT_NOM: 3.7,
  BAT_AH: 5.2,
  E_BAT_MAX: 19.24,  // Wh = 3,7 × 5,2
  ETA_CHG: 0.85,
  ETA_DIS: 0.9,
  R_INT: 0.15,       // Ω

  /** Beban */
  P_ESP: 0.4,        // W — ESP32 + sensor, selalu menyala
  P_LAMP: 1.0,       // W

  /** Elektroliser */
  V_EL: 2.0,         // V
  F_CONST: 96485,    // C/mol
  V_M: 24.465,       // L/mol pada 25 °C 1 atm

  /** Fuel cell PEM */
  ETA_FC: 0.5,
  E_MOL_H2: 67.2,    // Wh/mol

  /** Awan */
  T_CLOUD_MIN: 0.15,
} as const;

/** Ambang keputusan EMS (LKM-3 Lampiran 2). */
export const EMS_V2 = {
  SURPLUS_OFF: 3.95,
  DEFICIT_V: 3.4,
  DEFICIT_DELAY: 5,  // detik simulasi
  DEFICIT_H2: 5,     // mL stok minimum untuk fuel cell
  NORMAL_V: 3.8,
  GRID_SOC: 0.2,
} as const;

export const EMS_V1 = {
  SURPLUS_V: 4.1,
  DEFICIT_V: 3.5,
  RECOVER_V: 3.7,
} as const;

/** Palet warna aliran energi — satu sumber untuk SVG maupun kartu. */
export const FLOW_COLORS = {
  solar: '#FBBF24',
  electric: '#22D3EE',
  battery: '#4ADE80',
  hydrogen: '#38BDF8',
  oxygen: '#F87171',
  load: '#FDE68A',
  grid: '#94A3B8',
} as const;
