import type { ScenarioId, SimulationControls } from '../types/simulation';

export interface Scenario {
  id: ScenarioId;
  label: string;
  description: string;
  /** Nilai kontrol yang ditimpa saat skenario dipilih. */
  controls: Partial<SimulationControls>;
  /** Keadaan awal yang dipaksakan, di luar kontrol biasa. */
  seed?: { soc?: number; hydrogen?: number };
}

export const DEFAULT_CONTROLS: SimulationControls = {
  solarIntensity: 1,
  autoDayNight: true,
  weather: 'siang',
  windSpeed: 6,
  cloudCount: 1,
  cloudAuto: true,
  timeScale: 60,
  lampOn: true,
  emsVersion: 'v2',
  faradayEfficiency: 1,
  initialSoc: 0.7,
  initialH2: 0,
  lampPower: 1,
  electrolyzerPower: 1,
  h2Capacity: 50,
  o2Capacity: 50,
};

export const SCENARIOS: Scenario[] = [
  {
    id: 'siang-cerah',
    label: 'Siang Cerah',
    description: 'Matahari 100%, tanpa awan, SOC 85%',
    controls: {
      autoDayNight: false,
      solarIntensity: 1,
      weather: 'siang',
      cloudCount: 0,
      initialSoc: 0.85,
    },
    seed: { soc: 0.85 },
  },
  {
    id: 'awan-lewat',
    label: 'Awan Lewat',
    description: 'Satu awan tebal melintas, daya naik-turun',
    controls: {
      autoDayNight: false,
      solarIntensity: 1,
      weather: 'siang',
      cloudCount: 2,
      cloudAuto: true,
      windSpeed: 10,
    },
  },
  {
    id: 'mendung',
    label: 'Mendung',
    description: 'Awan menutup penuh, daya tinggal ~15%',
    controls: {
      autoDayNight: false,
      solarIntensity: 1,
      weather: 'mendung',
      cloudCount: 3,
      cloudAuto: false,
      windSpeed: 0,
    },
  },
  {
    id: 'malam-defisit',
    label: 'Malam / Defisit',
    description: 'Matahari 0%, SOC 12%, stok H₂ 40 mL',
    controls: {
      autoDayNight: false,
      solarIntensity: 0,
      weather: 'siang',
      cloudCount: 0,
      initialSoc: 0.12,
      initialH2: 40,
    },
    seed: { soc: 0.12, hydrogen: 40 },
  },
  {
    id: 'kendala-v1',
    label: 'Kendala EMS v1',
    description: 'Tanpa histeresis — relay berdetak di ambang',
    controls: {
      autoDayNight: false,
      solarIntensity: 1,
      weather: 'siang',
      cloudCount: 0,
      emsVersion: 'v1',
      initialSoc: 0.93,
    },
    seed: { soc: 0.93 },
  },
  {
    id: 'perbaikan-v2',
    label: 'Perbaikan EMS v2',
    description: 'Histeresis + tundaan — peralihan stabil',
    controls: {
      autoDayNight: false,
      solarIntensity: 1,
      weather: 'siang',
      cloudCount: 0,
      emsVersion: 'v2',
      initialSoc: 0.93,
    },
    seed: { soc: 0.93 },
  },
];
