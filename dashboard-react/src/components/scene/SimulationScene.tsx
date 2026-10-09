import type { SimulationControls, SimulationState } from '../../types/simulation';
import { fmt, watt, volt, amp } from '../../utils/format';
import { Background } from './Background';
import { Cables, PowerTags } from './Cables';
import {
  Reservoir, SolarPanel, ControllerBox, BatteryModule,
  ElectrolyzerBox, GasTank, FuelCellBox, LedLamp, GridBox,
  LaptopDashboard, PhoneDashboard, WaterBath,
} from './objects';
import {
  OBJECTS, ANNOTATIONS, SCENE, WIRE, place, at,
  type Annotation, type Box,
} from './sceneLayout';

/** Anotasi mengambang bergaya diagram teknik. */
function Label({ a }: { a: Annotation }) {
  return (
    <div className="absolute" style={at(a.x, a.y)}>
      <div className="flex items-stretch overflow-hidden rounded-md border border-white/10 bg-[#050c18]/82 shadow-[0_8px_20px_rgba(0,0,0,0.5)] backdrop-blur-sm">
        <span className="w-[3px] bg-gradient-to-b from-[#20D9FF] to-[#38E27A]" />
        <div className="px-2 py-[5px]">
          <div className="whitespace-nowrap text-[11px] font-bold leading-tight text-[#e6edf7]">
            {a.title}
          </div>
          {a.sub && (
            <div className="num whitespace-nowrap text-[9px] leading-tight text-[#7d93b2]">
              {a.sub}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Label panel surya — satu-satunya anotasi yang membawa angka hidup,
 * karena di sinilah seluruh aliran energi bermula.
 */
function PanelTag({ s }: { s: SimulationState }) {
  const rows: Array<[string, string]> = [
    ['Iradiansi', `${fmt(s.irradiance, 0)} W/m²`],
    ['Tegangan', volt(s.panelVoltage)],
    ['Arus', amp(s.panelCurrent)],
    ['Suhu sel', `${fmt(s.cellTemp, 1)} °C`],
  ];
  return (
    <div className="absolute" style={at(40, 176)}>
      <div className="overflow-hidden rounded-lg border border-white/10 bg-[#050c18]/84 shadow-[0_10px_24px_rgba(0,0,0,0.55)] backdrop-blur-sm">
        <div className="flex items-center gap-3 border-b border-white/8 px-2.5 py-[5px]">
          <span className="h-[18px] w-[3px] rounded-full bg-gradient-to-b from-[#FFD43B] to-[#FF9F1C]" />
          <div>
            <div className="whitespace-nowrap text-[11px] font-bold leading-tight text-[#e6edf7]">
              Panel Surya Terapung
            </div>
            <div className="num text-[9px] leading-tight text-[#7d93b2]">6 V 5 W · miring 10°</div>
          </div>
          <span
            className="num ml-auto rounded-md px-1.5 py-[2px] text-[13px] font-extrabold"
            style={{
              color: WIRE.solar,
              background: `${WIRE.solar}1a`,
              textShadow: `0 0 10px ${WIRE.solar}66`,
            }}
          >
            {watt(s.panelPower)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-[1px] px-2.5 py-[5px]">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-2">
              <span className="text-[9px] text-[#7d93b2]">{k}</span>
              <span className="num text-[10px] font-semibold text-[#e6edf7]">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Bayangan kontak di tanah — membuat benda tampak berdiri di lantai,
 * bukan melayang di depan latar.
 */
function GroundShadow({ box, spread = 1 }: { box: Box; spread?: number }) {
  const w = box.w * 0.92 * spread;
  const h = 18;
  return (
    <div
      className="absolute rounded-[50%]"
      style={{
        ...place({ x: box.x + (box.w - w) / 2 + 8, y: box.y + box.h - h / 2 + 4, w, h }),
        background: 'radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 45%, transparent 72%)',
        filter: 'blur(3px)',
      }}
    />
  );
}

/**
 * Adegan digital twin 2.5D.
 *
 * Urutan kedalaman (belakang → depan):
 *   lingkungan → bayangan tanah → kabel belakang → benda → kabel depan → anotasi
 */
export function SimulationScene({
  state,
  controls,
}: {
  state: SimulationState;
  controls: SimulationControls;
}) {
  const light = state.sun * state.cloudTransmittance;

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#1b2d47] shadow-[0_30px_70px_rgba(0,0,0,0.55)]">
      {/* Lebar minimum menjaga proporsi; di layar sempit adegan digeser,
          bukan diperkecil atau diregangkan */}
      <div
        className="relative w-full min-w-[980px] overflow-hidden"
        style={{ aspectRatio: `${SCENE.w} / ${SCENE.h}` }}
      >
        {/* Lingkungan — hanya digambar ulang saat cahaya berubah satu tingkat */}
        <Background
          lightStep={Math.round(light * 20)}
          sunStep={Math.round(state.sun * 20)}
          night={state.sun <= 0.02}
          weather={controls.weather}
          cloudCount={controls.cloudCount}
          cloudAuto={controls.cloudAuto}
          windSpeed={controls.windSpeed}
        />

        {/* Bayangan kontak benda yang berdiri di tanah */}
        <div className="absolute inset-0 z-[5]">
          <GroundShadow box={OBJECTS.reservoir} />
          <GroundShadow box={OBJECTS.battery} />
          <GroundShadow box={OBJECTS.waterBath} />
          <GroundShadow box={OBJECTS.lamp} spread={0.8} />
          <GroundShadow box={OBJECTS.grid} />
          <GroundShadow box={OBJECTS.laptop} />
          <GroundShadow box={OBJECTS.phone} spread={1.2} />
        </div>

        {/* Kabel yang lewat DI BELAKANG benda */}
        <div className="absolute inset-0 z-10">
          <Cables flows={state.flows} layer="back" />
        </div>

        {/* ── Benda fisik ── */}
        <div className="absolute z-[11]" style={place(OBJECTS.reservoir)}>
          <Reservoir light={light} />
        </div>
        <div className="absolute z-[12]" style={place(OBJECTS.solarPanel)}>
          <SolarPanel s={state} />
        </div>
        <div className="absolute z-[12]" style={place(OBJECTS.electrolyzer)}>
          <ElectrolyzerBox s={state} />
        </div>
        {/* Bak air: dinding belakang di balik tabung */}
        <div className="absolute z-[11]" style={place(OBJECTS.waterBath)}>
          <WaterBath layer="back" light={light} active={state.relay.ch2} />
        </div>
        <div className="absolute z-[12]" style={place(OBJECTS.tankH2)}>
          <GasTank
            label="H₂"
            volume={state.hydrogenVolume}
            capacity={controls.h2Capacity}
            color={WIRE.hydrogen}
            bubbling={state.relay.ch2}
          />
        </div>
        <div className="absolute z-[12]" style={place(OBJECTS.tankO2)}>
          <GasTank
            label="O₂"
            volume={state.oxygenVolume}
            capacity={controls.o2Capacity}
            color={WIRE.oxygen}
            bubbling={state.relay.ch2}
          />
        </div>
        {/* Bak air: air bening + dinding depan menutupi kaki tabung */}
        <div className="absolute z-[12]" style={place(OBJECTS.waterBath)}>
          <WaterBath layer="front" light={light} active={state.relay.ch2} />
        </div>
        <div className="absolute z-[12]" style={place(OBJECTS.fuelCell)}>
          <FuelCellBox s={state} />
        </div>
        <div className="absolute z-[13]" style={place(OBJECTS.controller)}>
          <ControllerBox s={state} />
        </div>
        <div className="absolute z-[13]" style={place(OBJECTS.battery)}>
          <BatteryModule s={state} />
        </div>
        <div className="absolute z-[12]" style={place(OBJECTS.grid)}>
          <GridBox s={state} />
        </div>
        <div className="absolute z-[14]" style={place(OBJECTS.laptop)}>
          <LaptopDashboard s={state} />
        </div>
        <div className="absolute z-[15]" style={place(OBJECTS.phone)}>
          <PhoneDashboard s={state} />
        </div>

        {/* Kabel yang melintas DI DEPAN benda */}
        <div className="absolute inset-0 z-20">
          <Cables flows={state.flows} layer="front" />
        </div>

        {/* Lampu di atas kabel depan agar cahayanya menutupi ujung kabel */}
        <div className="absolute z-[21]" style={place(OBJECTS.lamp)}>
          <LedLamp s={state} />
        </div>

        {/* Angka daya pada kabel */}
        <div className="absolute inset-0 z-[25]">
          <PowerTags flows={state.flows} />
        </div>

        {/* ── Anotasi (lapisan teratas) ── */}
        <div className="absolute inset-0 z-30">
          <PanelTag s={state} />
          {ANNOTATIONS.map((a) => (
            <Label key={a.title} a={a} />
          ))}
        </div>
      </div>
    </div>
  );
}
