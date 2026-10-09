/**
 * Geometri adegan simulasi.
 *
 * Semua benda ditempatkan dalam ruang desain tetap 1400 × 800. Kartu/benda
 * dipasang dengan posisi persen dari ruang itu, dan kabel SVG memakai viewBox
 * yang sama — jadi ujung kabel selalu menempel pada bendanya di lebar berapa pun.
 */

export const SCENE = { w: 1400, h: 800 } as const;

/** Garis batas langit dan daratan. */
export const HORIZON = 520;

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const OBJECTS = {
  reservoir: { x: 50, y: 352, w: 320, h: 212 },
  solarPanel: { x: 96, y: 302, w: 236, h: 118 },
  controller: { x: 430, y: 268, w: 282, h: 190 },
  battery: { x: 440, y: 560, w: 262, h: 100 },
  electrolyzer: { x: 800, y: 112, w: 242, h: 108 },
  tankH2: { x: 820, y: 282, w: 94, h: 318 },
  tankO2: { x: 936, y: 282, w: 94, h: 318 },
  /** Bak air tempat kedua tabung berdiri (elektrolisis air). */
  waterBath: { x: 796, y: 476, w: 258, h: 150 },
  fuelCell: { x: 1090, y: 398, w: 202, h: 116 },
  lamp: { x: 700, y: 572, w: 92, h: 116 },
  grid: { x: 1118, y: 618, w: 174, h: 100 },
  laptop: { x: 76, y: 620, w: 212, h: 132 },
  phone: { x: 302, y: 634, w: 74, h: 138 },
} satisfies Record<string, Box>;

/** Posisi CSS absolut (persen) untuk sebuah benda. */
export function place(b: Box) {
  return {
    left: `${(b.x / SCENE.w) * 100}%`,
    top: `${(b.y / SCENE.h) * 100}%`,
    width: `${(b.w / SCENE.w) * 100}%`,
    height: `${(b.h / SCENE.h) * 100}%`,
  };
}

/** Titik bebas dalam ruang desain (untuk label mengambang). */
export function at(x: number, y: number) {
  return { left: `${(x / SCENE.w) * 100}%`, top: `${(y / SCENE.h) * 100}%` };
}

export type FlowKey =
  | 'solarToController'
  | 'controllerToBattery'
  | 'batteryToController'
  | 'controllerToLoad'
  | 'controllerToElectrolyzer'
  | 'electrolyzerToTanks'
  | 'tankToFuelCell'
  | 'fuelCellToLoad'
  | 'gridToLoad'
  | 'controllerToDashboard';

export interface Cable {
  id: string;
  /** Tautan nirkabel — digambar putus-putus, bukan kabel tembaga. */
  wireless?: boolean;
  /**
   * Digambar di atas benda, bukan di belakangnya. Campuran depan-belakang
   * inilah yang membuat adegan terasa punya kedalaman.
   */
  front?: boolean;
  flow: FlowKey;
  d: string;
  color: string;
  /** Jalur gas, digambar sebagai pipa bergaris putus-putus. */
  pipe?: boolean;
  reverse?: boolean;
  /** Cabang yang berbagi satu nilai daya — labelnya ditekan agar tidak ganda. */
  hideLabel?: boolean;
  label?: { x: number; y: number };
}

/** Warna menurut jenis energi (README §8). */
export const WIRE = {
  solar: '#FFD43B',
  electric: '#20D9FF',
  battery: '#38E27A',
  hydrogen: '#27C7FF',
  oxygen: '#FF5F6D',
  grid: '#8FA3BC',
  telemetry: '#38E27A',
} as const;

export const CABLES: Cable[] = [
  // Panel surya → kotak kontrol
  {
    id: 'solar-controller',
    flow: 'solarToController',
    d: 'M 352 392 C 392 386, 400 348, 430 340',
    color: WIRE.solar,
    hideLabel: true,
  },
  // Bus → baterai (mengisi)
  {
    id: 'controller-battery',
    flow: 'controllerToBattery',
    d: 'M 556 458 L 556 560',
    color: WIRE.battery,
    label: { x: 556, y: 512 },
  },
  // Baterai → bus (mengosongkan), jalur sama arah berlawanan
  {
    id: 'battery-controller',
    flow: 'batteryToController',
    d: 'M 556 458 L 556 560',
    color: WIRE.solar,
    reverse: true,
    label: { x: 556, y: 512 },
  },
  // Bus → elektroliser
  {
    id: 'controller-electrolyzer',
    flow: 'controllerToElectrolyzer',
    d: 'M 712 318 C 756 312, 766 176, 800 166',
    color: WIRE.electric,
    label: { x: 760, y: 240 },
  },
  // Bus → lampu LED
  {
    id: 'controller-load',
    flow: 'controllerToLoad',
    d: 'M 712 414 C 732 446, 740 540, 746 572',
    color: WIRE.solar,
    front: true,
    label: { x: 744, y: 508 },
  },
  // Elektroliser → tabung H₂
  {
    id: 'electrolyzer-h2',
    flow: 'electrolyzerToTanks',
    d: 'M 862 220 L 864 282',
    color: WIRE.hydrogen,
    pipe: true,
    hideLabel: true,
  },
  // Elektroliser → tabung O₂
  {
    id: 'electrolyzer-o2',
    flow: 'electrolyzerToTanks',
    d: 'M 982 220 L 980 282',
    color: WIRE.oxygen,
    pipe: true,
    hideLabel: true,
  },
  // Tabung H₂ → fuel cell (pipa gas, memutar di bawah tabung O₂)
  {
    id: 'h2-fuelcell',
    flow: 'tankToFuelCell',
    d: 'M 912 566 C 968 608, 1046 574, 1090 486',
    color: WIRE.hydrogen,
    pipe: true,
    label: { x: 1058, y: 566 },
  },
  // Fuel cell → lampu LED
  {
    id: 'fuelcell-load',
    flow: 'fuelCellToLoad',
    d: 'M 1094 508 C 1016 650, 878 692, 790 660',
    color: WIRE.battery,
    front: true,
    label: { x: 922, y: 678 },
  },
  // PLN → lampu LED
  {
    id: 'grid-load',
    flow: 'gridToLoad',
    d: 'M 1118 668 C 1032 730, 878 744, 784 684',
    color: WIRE.grid,
    front: true,
    label: { x: 962, y: 744 },
  },
  // ESP32 ⇢ dasbor laptop (WiFi)
  {
    id: 'esp-laptop',
    flow: 'controllerToDashboard',
    d: 'M 452 458 C 412 548, 300 604, 190 620',
    color: WIRE.telemetry,
    wireless: true,
    hideLabel: true,
  },
  // ESP32 ⇢ dasbor ponsel (WiFi)
  {
    id: 'esp-phone',
    flow: 'controllerToDashboard',
    d: 'M 468 458 C 440 528, 408 592, 338 634',
    color: WIRE.telemetry,
    wireless: true,
    hideLabel: true,
  },
];

/** Anotasi mengambang bergaya diagram teknik. */
export interface Annotation {
  x: number;
  y: number;
  title: string;
  sub?: string;
}

export const ANNOTATIONS: Annotation[] = [
  { x: 430, y: 222, title: 'Kotak Kontrol IoT', sub: 'ESP32 (WiFi) · INA219 ×2' },
  { x: 440, y: 674, title: 'Baterai Li-ion 3,7 V', sub: '5.200 mAh (2×18650)' },
  { x: 800, y: 60, title: 'Elektroliser', sub: 'H₂ : O₂ = 2 : 1' },
  { x: 1090, y: 344, title: 'Fuel Cell (H₂ → listrik)', sub: 'PEM · η = 50%' },
  { x: 612, y: 700, title: 'Lampu LED', sub: 'beban DC 5 V' },
  { x: 1118, y: 568, title: 'PLN', sub: 'siaga / cadangan' },
  { x: 76, y: 580, title: 'Dasbor laptop', sub: 'telemetri 1 detik' },
  { x: 300, y: 594, title: 'Dasbor ponsel' },
];
