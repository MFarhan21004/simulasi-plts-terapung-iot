import { Sun, Cloud, CloudRain, CloudSun, Clock, Zap, Clapperboard } from 'lucide-react';
import type {
  SimulationControls, SimulationState, WeatherPreset, EmsVersion, ScenarioId,
} from '../types/simulation';
import { SCENARIOS } from '../data/scenarios';
import { clock } from '../utils/format';
import { Card, SliderRow, PowerToggle, SegmentedControl, Select, Badge } from './ui';

export function ControlSidebar({
  controls,
  state,
  onChange,
  onScenario,
}: {
  controls: SimulationControls;
  state: SimulationState;
  onChange: (patch: Partial<SimulationControls>) => void;
  onScenario: (id: ScenarioId) => void;
}) {
  return (
    <aside className="flex w-full flex-col gap-2.5 xl:w-[330px] xl:shrink-0">
      {/* ── Matahari ── */}
      <Card title="Matahari" icon={<Sun size={15} />} bodyClassName="px-3 py-2">
        <SliderRow
          label="Intensitas cahaya"
          value={Math.round(controls.solarIntensity * 100)}
          min={0}
          max={100}
          unit="%"
          onChange={(v) => onChange({ solarIntensity: v / 100, autoDayNight: false })}
        />
        <p className="mt-1 text-[10.5px] leading-snug text-[#5d7593]">
          Mengubah nilai ini mematikan siklus siang/malam otomatis.
        </p>
      </Card>

      {/* ── Cuaca ── */}
      <Card title="Cuaca" icon={<Cloud size={15} />} bodyClassName="px-3 py-2">
        <SegmentedControl<WeatherPreset>
          value={controls.weather}
          onChange={(weather) => onChange({ weather })}
          options={[
            { value: 'siang', label: 'Siang', icon: <Sun size={12} /> },
            { value: 'mendung', label: 'Mendung', icon: <CloudSun size={12} /> },
            { value: 'hujan', label: 'Hujan', icon: <CloudRain size={12} /> },
          ]}
        />
        <div className="mt-2">
          <SliderRow
            label="Kecepatan angin"
            value={controls.windSpeed}
            min={0}
            max={30}
            unit="px/s"
            onChange={(windSpeed) => onChange({ windSpeed })}
          />
          <SliderRow
            label="Jumlah awan"
            value={controls.cloudCount}
            min={0}
            max={3}
            onChange={(cloudCount) => onChange({ cloudCount })}
          />
          <div className="flex items-center gap-3 py-1.5">
            <span className="w-[96px] shrink-0 text-[11.5px] text-[#8fa6c4]">Mode gerak</span>
            <Select
              value={controls.cloudAuto ? 'auto' : 'manual'}
              onChange={(v) => onChange({ cloudAuto: v === 'auto' })}
              options={[
                { value: 'auto', label: 'Otomatis (awan melintas)' },
                { value: 'manual', label: 'Diam (tutupan tetap)' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* ── Waktu ── */}
      <Card title="Waktu Simulasi" icon={<Clock size={15} />} bodyClassName="px-3 py-2">
        <div className="flex items-center gap-3 py-1.5">
          <span className="w-[96px] shrink-0 text-[11.5px] text-[#8fa6c4]">Skala waktu</span>
          <Select
            value={String(controls.timeScale)}
            onChange={(v) => onChange({ timeScale: Number(v) })}
            options={[
              { value: '1', label: '1× (waktu nyata)' },
              { value: '10', label: '10×' },
              { value: '60', label: '60×' },
              { value: '600', label: '600×' },
              { value: '3600', label: '3600×' },
            ]}
          />
        </div>
        <div className="flex items-center gap-3 py-1.5">
          <span className="w-[96px] shrink-0 text-[11.5px] leading-tight text-[#8fa6c4]">
            Siklus siang/malam
          </span>
          <PowerToggle
            checked={controls.autoDayNight}
            onChange={(autoDayNight) => onChange({ autoDayNight })}
            label="Siklus siang malam otomatis"
          />
        </div>
        <div className="mt-1 flex items-center justify-between border-t border-[#17283f] pt-2">
          <span className="text-[12px] text-[#8fa6c4]">Jam simulasi</span>
          <span className="num text-[13px] font-bold text-[#22d3ee]">{clock(state.time)}</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-[12px] text-[#8fa6c4]">Periode</span>
          <Badge tone={state.dayPhase === 'SIANG' ? 'good' : 'info'}>{state.dayPhase}</Badge>
        </div>
      </Card>

      {/* ── Beban & EMS ── */}
      <Card title="Beban & EMS" icon={<Zap size={15} />} bodyClassName="px-3 py-2">
        <div className="flex items-center gap-3 py-1.5">
          <span className="w-[96px] shrink-0 text-[11.5px] text-[#8fa6c4]">Lampu LED</span>
          <PowerToggle
            checked={controls.lampOn}
            onChange={(lampOn) => onChange({ lampOn })}
            label="Saklar lampu LED"
          />
        </div>
        <div className="flex items-center gap-3 py-1.5">
          <span className="w-[96px] shrink-0 text-[11.5px] text-[#8fa6c4]">Versi EMS</span>
          <Select<EmsVersion>
            value={controls.emsVersion}
            onChange={(emsVersion) => onChange({ emsVersion })}
            options={[
              { value: 'v2', label: 'v2 (histeresis)' },
              { value: 'v1', label: 'v1 (tanpa histeresis)' },
            ]}
          />
        </div>

        <div className="mt-1 border-t border-[#17283f] pt-1">
          <SliderRow
            label={<>Efisiensi Faraday η<sub>F</sub></>}
            value={Math.round(controls.faradayEfficiency * 100)}
            min={50}
            max={100}
            unit="%"
            onChange={(v) => onChange({ faradayEfficiency: v / 100 })}
          />
          <SliderRow
            label="SOC awal"
            value={Math.round(controls.initialSoc * 100)}
            min={0}
            max={100}
            unit="%"
            onChange={(v) => onChange({ initialSoc: v / 100 })}
          />
          <SliderRow
            label="Stok H₂ awal"
            value={controls.initialH2}
            min={0}
            max={200}
            unit="mL"
            onChange={(initialH2) => onChange({ initialH2 })}
          />
          <SliderRow
            label="Daya lampu"
            value={controls.lampPower}
            min={0}
            max={5}
            step={0.1}
            decimals={1}
            unit="W"
            onChange={(lampPower) => onChange({ lampPower })}
          />
          <SliderRow
            label="Daya ke H₂"
            value={controls.electrolyzerPower}
            min={0.2}
            max={2}
            step={0.1}
            decimals={1}
            unit="W"
            onChange={(electrolyzerPower) => onChange({ electrolyzerPower })}
          />
          <SliderRow
            label="Kapasitas tangki H₂"
            value={controls.h2Capacity}
            min={10}
            max={200}
            step={5}
            unit="mL"
            onChange={(h2Capacity) => onChange({ h2Capacity })}
          />
          <SliderRow
            label="Kapasitas tangki O₂"
            value={controls.o2Capacity}
            min={10}
            max={200}
            step={5}
            unit="mL"
            onChange={(o2Capacity) => onChange({ o2Capacity })}
          />
        </div>
      </Card>

      {/* ── Skenario ── */}
      <Card title="Skenario Bawaan" icon={<Clapperboard size={15} />} bodyClassName="px-3 py-2">
        <div className="grid grid-cols-2 gap-2">
          {SCENARIOS.map((sc) => {
            const active = state.scenario === sc.id;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => onScenario(sc.id)}
                className={`rounded-lg border px-2.5 py-2 text-left transition ${
                  active
                    ? 'border-[#22d3ee]/60 bg-[#22d3ee]/12'
                    : 'border-[#1e3350] bg-[#0d1829]/60 hover:border-[#2b476b] hover:bg-[#101c30]'
                }`}
              >
                <div
                  className={`text-[11.5px] font-bold ${active ? 'text-[#22d3ee]' : 'text-[#e6edf7]'}`}
                >
                  {sc.label}
                </div>
                <div className="mt-0.5 text-[9.5px] leading-snug text-[#5d7593]">
                  {sc.description}
                </div>
              </button>
            );
          })}
        </div>
      </Card>
    </aside>
  );
}
