import { createInitialState, stepSimulation, energyBudget, type EmsMemory } from '../src/utils/physics';
import { DEFAULT_CONTROLS as APP_DEFAULTS, SCENARIOS } from '../src/data/scenarios';

// Pemeriksaan fisika memakai konfigurasi prototipe LKM-3 apa adanya
// (1 panel, 1 lampu 1 W, baterai 5,2 Ah, tangki 50 mL), terlepas dari
// nilai bawaan aplikasi yang sudah diperbesar.
const DEFAULT_CONTROLS = {
  ...APP_DEFAULTS,
  panelCount: 1,
  lampCount: 1,
  batteryAh: 5.2,
  h2Capacity: 50,
  o2Capacity: 50,
};
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

// 8. Jumlah panel: rangkaian paralel → daya & arus berlipat, tegangan tetap
{
  const one = run({ ...DEFAULT_CONTROLS, autoDayNight: false, solarIntensity: 1, cloudCount: 0, panelCount: 1 }, 5);
  const three = run({ ...DEFAULT_CONTROLS, autoDayNight: false, solarIntensity: 1, cloudCount: 0, panelCount: 3 }, 5);
  ok(Math.abs(three.panelPower - 3 * one.panelPower) < 1e-9,
     `3 panel = 3x daya (${three.panelPower.toFixed(2)} W vs ${one.panelPower.toFixed(2)} W)`);
  ok(Math.abs(three.panelCurrent - 3 * one.panelCurrent) < 1e-9,
     `3 panel = 3x arus (${three.panelCurrent.toFixed(3)} A)`);
  ok(three.panelVoltage === one.panelVoltage, `tegangan tetap ${three.panelVoltage} V (paralel)`);
  const six = run({ ...DEFAULT_CONTROLS, autoDayNight: false, solarIntensity: 1, cloudCount: 0, panelCount: 6 }, 600);
  const sum = six.flows.controllerToLoad + Math.max(0, six.batteryPower)
            + six.flows.controllerToElectrolyzer + PHYSICS.P_ESP;
  ok(Math.abs(sum - six.panelPower) < 0.001 || six.batterySoc >= 0.999,
     `neraca daya tetap seimbang dengan 6 panel (${six.panelPower.toFixed(2)} W)`);
}

// 8b. Ladang surya 100 panel
{
  const one = run({ ...DEFAULT_CONTROLS, autoDayNight: false, solarIntensity: 1, cloudCount: 0, panelCount: 1 }, 5);
  const hundred = run({ ...DEFAULT_CONTROLS, autoDayNight: false, solarIntensity: 1, cloudCount: 0, panelCount: 100 }, 3600);
  ok(Math.abs(hundred.panelPower - 100 * one.panelPower) < 1e-6,
     `100 panel = 100x daya (${hundred.panelPower.toFixed(1)} W)`);
  ok([hundred.batterySoc, hundred.batteryVoltage, hundred.hydrogenVolume].every(Number.isFinite)
     && hundred.batterySoc <= 1, `100 panel tetap stabil (SOC ${(hundred.batterySoc * 100).toFixed(0)}%)`);
}

// 8c. Jumlah lampu & kapasitas baterai
{
  const l1 = run({ ...DEFAULT_CONTROLS, autoDayNight: false, solarIntensity: 1, cloudCount: 0, lampCount: 1 }, 5);
  const l5 = run({ ...DEFAULT_CONTROLS, autoDayNight: false, solarIntensity: 1, cloudCount: 0, lampCount: 5, panelCount: 5 }, 5);
  ok(Math.abs(l5.flows.controllerToLoad - 5 * l1.flows.controllerToLoad) < 1e-9,
     `5 lampu = 5x beban lampu (${l5.flows.controllerToLoad.toFixed(1)} W)`);
  const big = run({ ...DEFAULT_CONTROLS, batteryAh: 52 }, 1);
  ok(Math.abs(big.batteryCapacityWh - 192.4) < 0.01, `baterai 52 Ah = ${big.batteryCapacityWh.toFixed(1)} Wh`);
}

// 8d. Anggaran energi harian
{
  const one = energyBudget({ ...DEFAULT_CONTROLS });
  ok(one.perPanelWh > 15 && one.perPanelWh < 30, `1 panel ≈ ${one.perPanelWh.toFixed(1)} Wh/hari`);
  const many = energyBudget({ ...APP_DEFAULTS, lampCount: 20, lampHours: 24, panelCount: 1 });
  ok(many.balanceWh < 0 && many.panelsNeeded > 1, `beban besar → defisit, butuh ${many.panelsNeeded} panel`);
  const fit = energyBudget({ ...APP_DEFAULTS, lampCount: 20, lampHours: 24, panelCount: Math.min(20, many.panelsNeeded) });
  ok(many.panelsNeeded > 20 || fit.balanceWh >= 0, 'panel minimum memang mencukupi kebutuhan');
}

// 9. Semua skenario berjalan tanpa NaN
{
  for (const sc of SCENARIOS) {
    const c = { ...APP_DEFAULTS, ...sc.controls };
    const s = run(c, 600, sc.seed ? {
      batterySoc: sc.seed.soc, batteryEnergy: (sc.seed.soc ?? 0.7) * PHYSICS.V_BAT_NOM * c.batteryAh,
      hydrogenVolume: sc.seed.hydrogen ?? 0,
    } : undefined);
    const nums = [s.panelPower, s.batterySoc, s.batteryVoltage, s.hydrogenVolume, s.oxygenVolume, s.fuelCellPower, s.gridPower];
    ok(nums.every(Number.isFinite), `skenario "${sc.label}" stabil (mode ${s.mode})`);
  }
}

console.log(out.join('\n'));
const failed = out.filter((l) => l.startsWith('FAIL')).length;
console.log(`\n${out.length - failed}/${out.length} pemeriksaan lolos`);
