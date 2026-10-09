import { createInitialState, stepSimulation, type EmsMemory } from '../src/utils/physics';
import { DEFAULT_CONTROLS, SCENARIOS } from '../src/data/scenarios';
import type { SimulationControls, SimulationState } from '../src/types/simulation';
import { PHYSICS } from '../src/utils/constants';

function run(controls: SimulationControls, seconds: number, seed?: Partial<SimulationState>) {
  const mem: EmsMemory = { deficitTimer: 0 };
  let st = { ...createInitialState(controls), ...seed };
  for (let i = 0; i < seconds; i++) st = stepSimulation(st, controls, 1, mem);
  return st;
}

const out: string[] = [];
const ok = (cond: boolean, msg: string) => out.push(`${cond ? 'PASS' : 'FAIL'}  ${msg}`);

// 1. Siang cerah: panel menghasilkan daya, baterai mengisi
{
  const c = { ...DEFAULT_CONTROLS, autoDayNight: false, solarIntensity: 1, cloudCount: 0 };
  const s = run(c, 120);
  ok(s.panelPower > 3, `panel berdaya saat cerah (${s.panelPower.toFixed(2)} W)`);
  ok(s.mode === 'SURPLUS', `mode SURPLUS saat daya berlebih (${s.mode})`);
  ok(s.relay.ch2, 'CH2 (elektroliser) aktif saat surplus');
  ok(s.hydrogenVolume > 0, `H2 terkumpul (${s.hydrogenVolume.toFixed(3)} mL)`);
  const ratio = s.hydrogenVolume / s.oxygenVolume;
  ok(Math.abs(ratio - 2) < 0.01, `rasio H2:O2 = ${ratio.toFixed(3)} : 1`);
}

// 2. Malam + SOC rendah + stok H2: fuel cell harus mengambil alih
{
  const c = { ...DEFAULT_CONTROLS, autoDayNight: false, solarIntensity: 0, initialSoc: 0.12, initialH2: 40 };
  // 40 mL H2 pada beban 1 W (eta 50%) secara teori bertahan ~198 detik,
  // jadi pada detik ke-60 fuel cell harus masih memasok.
  const s = run(c, 60);
  ok(s.panelPower === 0, 'panel nol saat malam');
  ok(s.mode === 'DEFISIT', `mode DEFISIT (${s.mode})`);
  ok(s.relay.ch3 && !s.relay.ch4, 'CH3 fuel cell aktif, CH4 PLN mati');
  ok(s.fuelCellPower > 0, `fuel cell memasok (${s.fuelCellPower.toFixed(2)} W)`);
  ok(s.hydrogenVolume < 40 && s.hydrogenVolume > 0,
     `stok H2 berkurang tapi belum habis (${s.hydrogenVolume.toFixed(2)} mL)`);

  // Setelah stok habis, sistem harus turun ke PLN tanpa mematikan beban.
  const after = run(c, 320);
  ok(after.hydrogenVolume < 0.01, `stok H2 habis (${after.hydrogenVolume.toFixed(3)} mL)`);
  ok(after.relay.ch4 && !after.relay.ch3, 'kaskade benar: fuel cell habis -> PLN mengambil alih');
  ok(after.gridPower > 0, `PLN menopang beban (${after.gridPower.toFixed(2)} W)`);
}

// 3. Malam tanpa stok H2: PLN cadangan yang menopang
{
  const c = { ...DEFAULT_CONTROLS, autoDayNight: false, solarIntensity: 0, initialSoc: 0.1, initialH2: 0 };
  const s = run(c, 300);
  ok(s.relay.ch4 && !s.relay.ch3, 'CH4 PLN aktif saat H2 habis');
  ok(s.gridPower > 0, `PLN menarik daya (${s.gridPower.toFixed(2)} W)`);
}

// 4. Neraca daya: jumlah jalur = daya panel (siang, tanpa sumber cadangan)
{
  const c = { ...DEFAULT_CONTROLS, autoDayNight: false, solarIntensity: 1, cloudCount: 0 };
  const s = run(c, 60);
  const sum = s.flows.controllerToLoad + Math.max(0, s.batteryPower)
            + s.flows.controllerToElectrolyzer + PHYSICS.P_ESP;
  ok(Math.abs(sum - s.panelPower) < 0.001,
     `neraca daya seimbang (jalur ${sum.toFixed(4)} W vs panel ${s.panelPower.toFixed(4)} W)`);
}

// 5. Mendung menurunkan daya dibanding cerah
{
  const cerah = run({ ...DEFAULT_CONTROLS, autoDayNight: false, solarIntensity: 1, cloudCount: 0 }, 30);
  const mendung = run({ ...DEFAULT_CONTROLS, autoDayNight: false, solarIntensity: 1, weather: 'mendung', cloudCount: 3, cloudAuto: false }, 30);
  ok(mendung.panelPower < cerah.panelPower * 0.5,
     `mendung memangkas daya (${mendung.panelPower.toFixed(2)} W vs ${cerah.panelPower.toFixed(2)} W)`);
}

// 6. Tangki tidak pernah melampaui kapasitas
{
  const c = { ...DEFAULT_CONTROLS, autoDayNight: false, solarIntensity: 1, cloudCount: 0, h2Capacity: 10, o2Capacity: 10 };
  const s = run(c, 20000);
  ok(s.hydrogenVolume <= 10.0001, `H2 tidak melebihi kapasitas (${s.hydrogenVolume.toFixed(3)} / 10 mL)`);
  ok(s.oxygenVolume <= 10.0001, `O2 tidak melebihi kapasitas (${s.oxygenVolume.toFixed(3)} / 10 mL)`);
}

// 7. SOC selalu di dalam 0..1
{
  const c = { ...DEFAULT_CONTROLS, autoDayNight: false, solarIntensity: 1, cloudCount: 0 };
  const s = run(c, 50000);
  ok(s.batterySoc >= 0 && s.batterySoc <= 1, `SOC dalam batas (${(s.batterySoc * 100).toFixed(1)}%)`);
}

// 8. Semua skenario berjalan tanpa NaN
{
  for (const sc of SCENARIOS) {
    const c = { ...DEFAULT_CONTROLS, ...sc.controls };
    const s = run(c, 600, sc.seed ? {
      batterySoc: sc.seed.soc, batteryEnergy: (sc.seed.soc ?? 0.7) * PHYSICS.E_BAT_MAX,
      hydrogenVolume: sc.seed.hydrogen ?? 0,
    } : undefined);
    const nums = [s.panelPower, s.batterySoc, s.batteryVoltage, s.hydrogenVolume, s.oxygenVolume, s.fuelCellPower, s.gridPower];
    ok(nums.every(Number.isFinite), `skenario "${sc.label}" stabil (mode ${s.mode})`);
  }
}

console.log(out.join('\n'));
const failed = out.filter((l) => l.startsWith('FAIL')).length;
console.log(`\n${out.length - failed}/${out.length} pemeriksaan lolos`);
