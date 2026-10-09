/** Tipe bersama untuk seluruh mesin simulasi dan komponen UI. */

export type EmsMode = 'NORMAL' | 'SURPLUS' | 'DEFISIT';
export type DayPhase = 'SIANG' | 'MALAM';
export type EmsVersion = 'v1' | 'v2';
export type WeatherPreset = 'siang' | 'mendung' | 'hujan';
export type ScenarioId =
  | 'standar'
  | 'siang-cerah'
  | 'awan-lewat'
  | 'mendung'
  | 'malam-defisit'
  | 'kendala-v1'
  | 'perbaikan-v2';

/** Kanal relay pada modul 4 kanal di kotak kontrol IoT. */
export interface RelayState {
  /** Beban lampu disuplai bus (panel/baterai). */
  ch1: boolean;
  /** Elektroliser aktif (surplus daya). */
  ch2: boolean;
  /** Fuel cell menyuplai beban. */
  ch3: boolean;
  /** PLN cadangan menyuplai beban. */
  ch4: boolean;
}

/** Daya sesaat tiap jalur kabel, dipakai untuk animasi aliran energi. */
export interface FlowState {
  /** Panel → kotak IoT. */
  solarToController: number;
  /** Bus → baterai (mengisi). */
  controllerToBattery: number;
  /** Baterai → bus (mengosongkan). */
  batteryToController: number;
  /** Bus → lampu LED. */
  controllerToLoad: number;
  /** Bus → elektroliser. */
  controllerToElectrolyzer: number;
  /** Elektroliser → tangki gas. */
  electrolyzerToTanks: number;
  /** Tangki H₂ → fuel cell. */
  tankToFuelCell: number;
  /** Fuel cell → lampu LED. */
  fuelCellToLoad: number;
  /** PLN → lampu LED. */
  gridToLoad: number;
  /** ESP32 ⇢ dasbor laptop & ponsel (WiFi). Selalu aktif. */
  controllerToDashboard: number;
}

/** Nilai yang dapat diubah pengguna lewat panel kontrol kanan. */
export interface SimulationControls {
  /** Intensitas cahaya 0–1. */
  solarIntensity: number;
  autoDayNight: boolean;
  weather: WeatherPreset;
  windSpeed: number;
  cloudCount: number;
  cloudAuto: boolean;
  timeScale: number;
  lampOn: boolean;
  emsVersion: EmsVersion;
  /** Efisiensi Faraday 0–1. */
  faradayEfficiency: number;
  /** SOC awal 0–1, dipakai saat reset. */
  initialSoc: number;
  initialH2: number;
  lampPower: number;
  electrolyzerPower: number;
  h2Capacity: number;
  o2Capacity: number;
}

/** Keadaan terhitung — selalu diturunkan dari kontrol + langkah fisika. */
export interface SimulationState {
  /** Detik sejak tengah malam. */
  time: number;
  dayPhase: DayPhase;
  /** Posisi matahari efektif 0–1 setelah siklus siang/malam. */
  sun: number;
  /** Transmitansi awan 0–1. */
  cloudTransmittance: number;
  /** Iradiansi efektif W/m². */
  irradiance: number;

  panelVoltage: number;
  panelCurrent: number;
  panelPower: number;
  cellTemp: number;

  batteryEnergy: number;
  batterySoc: number;
  batteryVoltage: number;
  batteryCurrent: number;
  /** Positif = mengisi, negatif = mengosongkan. */
  batteryPower: number;

  hydrogenVolume: number;
  oxygenVolume: number;
  electrolyzerActivePower: number;
  fuelCellPower: number;
  gridPower: number;
  loadPower: number;

  mode: EmsMode;
  relay: RelayState;
  flows: FlowState;

  /** Energi kumulatif (Wh). */
  energy: {
    solar: number;
    load: number;
    hydrogenChemical: number;
    fuelCell: number;
  };

  scenario: ScenarioId;
}
