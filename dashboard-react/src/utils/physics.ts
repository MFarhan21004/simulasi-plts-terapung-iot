import { PHYSICS, EMS_V1, EMS_V2 } from './constants';
import type {
  SimulationControls,
  SimulationState,
  RelayState,
  EmsMode,
} from '../types/simulation';

/** Tabel tegangan rangkaian terbuka baterai terhadap SOC (asumsi LKM-3). */
const VOC_TABLE: Array<{ soc: number; v: number }> = [
  { soc: 0.0, v: 3.0 },
  { soc: 0.1, v: 3.4 },
  { soc: 0.5, v: 3.7 },
  { soc: 0.9, v: 4.05 },
  { soc: 1.0, v: 4.2 },
];

export const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

/** Interpolasi linear V_oc(SOC). */
export function vocFromSoc(soc: number): number {
  if (soc <= VOC_TABLE[0].soc) return VOC_TABLE[0].v;
  const last = VOC_TABLE[VOC_TABLE.length - 1];
  if (soc >= last.soc) return last.v;
  for (let i = 0; i < VOC_TABLE.length - 1; i++) {
    const a = VOC_TABLE[i];
    const b = VOC_TABLE[i + 1];
    if (soc >= a.soc && soc <= b.soc) {
      const t = (soc - a.soc) / (b.soc - a.soc);
      return a.v + t * (b.v - a.v);
    }
  }
  return PHYSICS.V_BAT_NOM;
}

/** Posisi matahari 0–1 dari jam simulasi (terbit 06.00, terbenam 18.00). */
export function sunFromClock(timeSeconds: number): number {
  const minutes = (timeSeconds % 86400) / 60;
  if (minutes < 360 || minutes >= 1080) return 0;
  return Math.max(0, Math.sin(((minutes - 360) / 720) * Math.PI));
}

/**
 * Transmitansi awan 0–1.
 * Cuaca menentukan dasar langit, jumlah awan menentukan sedalam apa
 * tutupannya, dan mode otomatis membuat awan melintas sehingga daya
 * panel naik-turun seperti pada prototipe.
 */
export function cloudTransmittance(
  controls: SimulationControls,
  timeSeconds: number,
): number {
  const base =
    controls.weather === 'siang' ? 1 : controls.weather === 'mendung' ? 0.45 : 0.25;

  if (controls.cloudCount <= 0) return base;

  const density = Math.min(1, controls.cloudCount / 3);
  const coverage = controls.cloudAuto
    ? 0.5 + 0.5 * Math.sin(timeSeconds * controls.windSpeed * 0.0016)
    : 1;

  const dip = density * coverage * (1 - PHYSICS.T_CLOUD_MIN);
  return clamp(base * (1 - dip), PHYSICS.T_CLOUD_MIN * base, 1);
}

/** §6.2 — daya panel dengan koreksi suhu sel. */
export function panelOutput(irradiance: number) {
  if (irradiance <= 0) {
    return { power: 0, voltage: 0, current: 0, cellTemp: PHYSICS.T_AMB };
  }
  const cellTemp = PHYSICS.T_AMB + ((PHYSICS.NOCT - 20) / 800) * irradiance;
  const power = Math.max(
    0,
    PHYSICS.P_STC *
      (irradiance / 1000) *
      PHYSICS.PR *
      (1 - PHYSICS.GAMMA * (cellTemp - 25)),
  );
  const voltage = power > 0.001 ? PHYSICS.V_PV_NOM : 0;
  return {
    power,
    voltage,
    current: voltage > 0 ? power / voltage : 0,
    cellTemp,
  };
}

export interface EmsMemory {
  deficitTimer: number;
}

interface EmsInput {
  mode: EmsMode;
  relay: RelayState;
  batteryVoltage: number;
  batterySoc: number;
  panelPower: number;
  hydrogen: number;
  hydrogenCapacity: number;
  lampOn: boolean;
  lampPower: number;
  electrolyzerPower: number;
}

interface EmsResult {
  mode: EmsMode;
  relay: RelayState;
}

/** EMS v2 — dengan histeresis dan tundaan defisit (LKM-3 Lampiran 2). */
function emsV2(input: EmsInput, dt: number, mem: EmsMemory): EmsResult {
  const relay: RelayState = { ...input.relay };
  let mode = input.mode;

  const baseLoad = PHYSICS.P_ESP + (input.lampOn ? input.lampPower : 0);
  const loadCoveredBySolar = input.panelPower >= baseLoad;
  const powerSurplus = input.panelPower > baseLoad + input.electrolyzerPower;
  const tankFull = input.hydrogen >= input.hydrogenCapacity;
  const gridNeeded = !loadCoveredBySolar && input.batterySoc <= EMS_V2.GRID_SOC;
  const voltageLow = input.batteryVoltage <= EMS_V2.DEFICIT_V;

  // Matahari kembali cukup → lepas dari sumber malam
  if (mode === 'DEFISIT' && loadCoveredBySolar) {
    const canElectrolyze = powerSurplus && !tankFull;
    mem.deficitTimer = 0;
    return {
      mode: canElectrolyze ? 'SURPLUS' : 'NORMAL',
      relay: { ch1: true, ch2: canElectrolyze, ch3: false, ch4: false },
    };
  }

  if (mode === 'DEFISIT') {
    relay.ch1 = false;
    relay.ch2 = false;
    // Stok H₂ habis saat fuel cell menyala → pindah ke PLN
    if (relay.ch3 && input.hydrogen < 0.1) {
      relay.ch3 = false;
      relay.ch4 = true;
    }
    if (input.batteryVoltage >= EMS_V2.NORMAL_V && !gridNeeded) {
      mem.deficitTimer = 0;
      return { mode: 'NORMAL', relay: { ch1: true, ch2: false, ch3: false, ch4: false } };
    }
    return { mode, relay };
  }

  // NORMAL / SURPLUS
  relay.ch3 = false;
  relay.ch4 = false;
  relay.ch1 = input.lampOn;

  if (mode === 'SURPLUS') {
    relay.ch2 = true;
    if (!powerSurplus || tankFull) {
      mode = 'NORMAL';
      relay.ch2 = false;
    }
  } else if (powerSurplus && !tankFull) {
    mode = 'SURPLUS';
    relay.ch2 = true;
  }

  // Deteksi defisit dengan tundaan — inilah yang mencegah relay berdetak
  if (!loadCoveredBySolar && (voltageLow || gridNeeded)) {
    mem.deficitTimer += dt;
    if (mem.deficitTimer >= EMS_V2.DEFICIT_DELAY) {
      const useFuelCell = input.hydrogen >= EMS_V2.DEFICIT_H2;
      return {
        mode: 'DEFISIT',
        relay: { ch1: false, ch2: false, ch3: useFuelCell, ch4: !useFuelCell },
      };
    }
  } else {
    mem.deficitTimer = 0;
  }

  return { mode, relay };
}

/** EMS v1 — tanpa histeresis, sengaja dipertahankan sebagai pembanding. */
function emsV1(input: EmsInput): EmsResult {
  const relay: RelayState = { ...input.relay };
  let mode = input.mode;

  const baseLoad = PHYSICS.P_ESP + (input.lampOn ? input.lampPower : 0);
  const tankFull = input.hydrogen >= input.hydrogenCapacity;

  if (input.panelPower >= baseLoad) {
    const surplus = input.panelPower > baseLoad + input.electrolyzerPower && !tankFull;
    return {
      mode: surplus ? 'SURPLUS' : 'NORMAL',
      relay: { ch1: input.lampOn, ch2: surplus, ch3: false, ch4: false },
    };
  }

  // Ambang tunggal — relay bisa berdetak di sekitar titik ini
  if (input.batteryVoltage >= EMS_V1.SURPLUS_V && !tankFull) {
    relay.ch2 = true;
    mode = 'SURPLUS';
  } else {
    relay.ch2 = false;
    if (mode === 'SURPLUS') mode = 'NORMAL';
  }

  if (input.batteryVoltage < EMS_V1.DEFICIT_V) {
    const useFuelCell = input.hydrogen > 0.1;
    return {
      mode: 'DEFISIT',
      relay: { ch1: false, ch2: false, ch3: useFuelCell, ch4: !useFuelCell },
    };
  }

  if (mode === 'DEFISIT' && input.batteryVoltage >= EMS_V1.RECOVER_V) {
    return { mode: 'NORMAL', relay: { ch1: input.lampOn, ch2: false, ch3: false, ch4: false } };
  }

  return { mode, relay };
}

/**
 * Satu langkah simulasi, `dt` detik waktu simulasi.
 * Murni: menerima keadaan lama dan mengembalikan keadaan baru.
 * `mem` menyimpan pewaktu defisit yang harus bertahan antar langkah.
 */
export function stepSimulation(
  prev: SimulationState,
  controls: SimulationControls,
  dt: number,
  mem: EmsMemory,
): SimulationState {
  const time = prev.time + dt;

  // 1. Matahari & awan
  const sun = controls.autoDayNight ? sunFromClock(time) : controls.solarIntensity;
  const tCloud = cloudTransmittance(controls, time);
  const irradiance = PHYSICS.G_MAX * sun * tCloud;

  // 2. Panel
  const panel = panelOutput(irradiance);

  // 3. Keputusan EMS
  const emsInput: EmsInput = {
    mode: prev.mode,
    relay: prev.relay,
    batteryVoltage: prev.batteryVoltage,
    batterySoc: prev.batterySoc,
    panelPower: panel.power,
    hydrogen: prev.hydrogenVolume,
    hydrogenCapacity: controls.h2Capacity,
    lampOn: controls.lampOn,
    lampPower: controls.lampPower,
    electrolyzerPower: controls.electrolyzerPower,
  };
  const ems =
    controls.emsVersion === 'v1' ? emsV1(emsInput) : emsV2(emsInput, dt, mem);
  const relay = ems.relay;

  // 4. Neraca daya bus
  const lampLoad = controls.lampOn ? controls.lampPower : 0;
  const electrolyzerPower = relay.ch2 ? controls.electrolyzerPower : 0;
  const totalLoad = PHYSICS.P_ESP + lampLoad + electrolyzerPower;

  // Fuel cell dan PLN memasok beban langsung, tidak lewat baterai
  const fuelCellSupply = relay.ch3 ? lampLoad : 0;
  const gridPower = relay.ch4 ? Math.max(0, totalLoad - panel.power) : 0;
  const netPower = panel.power + fuelCellSupply + gridPower - totalLoad;

  // 5. Baterai
  const deltaWh =
    netPower >= 0
      ? PHYSICS.ETA_CHG * netPower * (dt / 3600)
      : (netPower / PHYSICS.ETA_DIS) * (dt / 3600);

  const batteryEnergy = clamp(prev.batteryEnergy + deltaWh, 0, PHYSICS.E_BAT_MAX);
  const batterySoc = batteryEnergy / PHYSICS.E_BAT_MAX;
  const voc = vocFromSoc(batterySoc);
  const batteryCurrent = Math.abs(netPower) > 0.001 ? netPower / voc : 0;
  const batteryVoltage = clamp(voc + batteryCurrent * PHYSICS.R_INT, 2.5, 4.3);

  // 6. Elektroliser — Hukum Faraday
  let hydrogenVolume = prev.hydrogenVolume;
  let oxygenVolume = prev.oxygenVolume;
  if (relay.ch2 && hydrogenVolume < controls.h2Capacity) {
    const current = electrolyzerPower / PHYSICS.V_EL;
    const molH2 =
      (controls.faradayEfficiency * current * dt) / (2 * PHYSICS.F_CONST);
    const mlH2 = molH2 * PHYSICS.V_M * 1000;
    hydrogenVolume = Math.min(controls.h2Capacity, hydrogenVolume + mlH2);
    oxygenVolume = Math.min(controls.o2Capacity, oxygenVolume + mlH2 / 2);
  }

  // 7. Fuel cell
  let fuelCellPower = 0;
  if (relay.ch3) {
    const demand = controls.lampPower;
    const chemicalIn = demand / PHYSICS.ETA_FC;
    const molNeeded = (chemicalIn * (dt / 3600)) / PHYSICS.E_MOL_H2;
    let mlNeeded = molNeeded * PHYSICS.V_M * 1000;

    if (hydrogenVolume < mlNeeded) {
      mlNeeded = hydrogenVolume;
      const molAvailable = mlNeeded / (PHYSICS.V_M * 1000);
      fuelCellPower =
        dt > 0 ? (molAvailable * PHYSICS.E_MOL_H2 * PHYSICS.ETA_FC * 3600) / dt : 0;
    } else {
      fuelCellPower = demand;
    }
    hydrogenVolume = Math.max(0, hydrogenVolume - mlNeeded);
  }

  // 8. Jalur aliran energi untuk animasi
  const flows = {
    solarToController: panel.power,
    controllerToBattery: netPower > 0 ? netPower : 0,
    batteryToController: netPower < 0 ? -netPower : 0,
    controllerToLoad: controls.lampOn && relay.ch1 ? controls.lampPower : 0,
    controllerToElectrolyzer: electrolyzerPower,
    electrolyzerToTanks: electrolyzerPower,
    tankToFuelCell: fuelCellPower,
    fuelCellToLoad: fuelCellPower,
    gridToLoad: gridPower,
    // ESP32 mengirim telemetri terus-menerus selama dayanya tersedia
    controllerToDashboard: PHYSICS.P_ESP,
  };

  // 9. Akumulasi energi
  const hours = dt / 3600;

  return {
    time,
    dayPhase: sun > 0 ? 'SIANG' : 'MALAM',
    sun,
    cloudTransmittance: tCloud,
    irradiance,
    panelVoltage: panel.voltage,
    panelCurrent: panel.current,
    panelPower: panel.power,
    cellTemp: panel.cellTemp,
    batteryEnergy,
    batterySoc,
    batteryVoltage,
    batteryCurrent,
    batteryPower: netPower,
    hydrogenVolume,
    oxygenVolume,
    electrolyzerActivePower: electrolyzerPower,
    fuelCellPower,
    gridPower,
    loadPower: totalLoad,
    mode: ems.mode,
    relay,
    flows,
    energy: {
      solar: prev.energy.solar + panel.power * hours,
      load: prev.energy.load + totalLoad * hours,
      hydrogenChemical: prev.energy.hydrogenChemical + electrolyzerPower * hours,
      fuelCell: prev.energy.fuelCell + fuelCellPower * hours,
    },
    scenario: prev.scenario,
  };
}

/** Keadaan awal yang konsisten dengan nilai kontrol. */
export function createInitialState(controls: SimulationControls): SimulationState {
  const soc = controls.initialSoc;
  const voc = vocFromSoc(soc);
  return {
    // Mulai pukul 10.00 agar sistem sudah aktif saat dashboard dibuka
    time: 10 * 3600,
    dayPhase: 'SIANG',
    sun: 0,
    cloudTransmittance: 1,
    irradiance: 0,
    panelVoltage: 0,
    panelCurrent: 0,
    panelPower: 0,
    cellTemp: PHYSICS.T_AMB,
    batteryEnergy: soc * PHYSICS.E_BAT_MAX,
    batterySoc: soc,
    batteryVoltage: voc,
    batteryCurrent: 0,
    batteryPower: 0,
    hydrogenVolume: Math.min(controls.initialH2, controls.h2Capacity),
    oxygenVolume: Math.min(controls.initialH2 / 2, controls.o2Capacity),
    electrolyzerActivePower: 0,
    fuelCellPower: 0,
    gridPower: 0,
    loadPower: 0,
    mode: 'NORMAL',
    relay: { ch1: controls.lampOn, ch2: false, ch3: false, ch4: false },
    flows: {
      solarToController: 0,
      controllerToBattery: 0,
      batteryToController: 0,
      controllerToLoad: 0,
      controllerToElectrolyzer: 0,
      electrolyzerToTanks: 0,
      tankToFuelCell: 0,
      fuelCellToLoad: 0,
      gridToLoad: 0,
      controllerToDashboard: PHYSICS.P_ESP,
    },
    energy: { solar: 0, load: 0, hydrogenChemical: 0, fuelCell: 0 },
    scenario: 'standar',
  };
}
