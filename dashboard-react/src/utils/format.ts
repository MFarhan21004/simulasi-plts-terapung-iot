/** Pemformat angka — satu tempat agar satuan konsisten di seluruh dashboard. */

export const fmt = (value: number, digits = 2) =>
  Number.isFinite(value) ? value.toFixed(digits) : '—';

export const watt = (v: number, d = 2) => `${fmt(v, d)} W`;
export const volt = (v: number, d = 2) => `${fmt(v, d)} V`;
export const amp = (v: number, d = 3) => `${fmt(v, d)} A`;
export const ml = (v: number, d = 1) => `${fmt(v, d)} mL`;
export const percent = (v: number, d = 1) => `${fmt(v * 100, d)} %`;
export const wattHour = (v: number, d = 3) => `${fmt(v, d)} Wh`;

/** Detik simulasi → HH:MM:SS. */
export function clock(seconds: number): string {
  const s = Math.floor(seconds % 86400);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}
