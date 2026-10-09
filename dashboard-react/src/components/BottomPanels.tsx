import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  BarChart3, Gauge, Droplets, ShieldCheck, CheckCircle2, AlertTriangle,
  Sun, Zap, Activity, BatteryFull,
} from 'lucide-react';
import type { SimulationControls, SimulationState } from '../types/simulation';
import { PHYSICS } from '../utils/constants';
import { fmt, watt } from '../utils/format';
import { Card, Metric, Badge } from './ui';

/** ── Data simulasi realtime ─────────────────────────────────────────── */
export function RealtimeMetrics({ s }: { s: SimulationState }) {
  return (
    <Card title="Data Simulasi (Realtime)" icon={<Gauge size={15} />}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Metric label="Iradiansi G" value={fmt(s.irradiance, 1)} unit="W/m²" color="#FBBF24" icon={<Sun size={11} />} />
        <Metric label="V panel" value={fmt(s.panelVoltage)} unit="V" color="#FBBF24" icon={<Zap size={11} />} />
        <Metric label="I panel" value={fmt(s.panelCurrent, 3)} unit="A" color="#22D3EE" icon={<Activity size={11} />} />
        <Metric label="P panel" value={fmt(s.panelPower)} unit="W" color="#FBBF24" icon={<Sun size={11} />} />
        <Metric label="V baterai" value={fmt(s.batteryVoltage)} unit="V" color="#4ADE80" icon={<BatteryFull size={11} />} />
        <Metric label="SOC baterai" value={fmt(s.batterySoc * 100, 1)} unit="%" color="#4ADE80" icon={<BatteryFull size={11} />} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-[#17283f] pt-3 sm:grid-cols-3">
        {[
          ['Suhu sel', `${fmt(s.cellTemp, 1)} °C`],
          ['T awan', `${fmt(s.cloudTransmittance * 100, 0)} %`],
          ['Beban total', watt(s.loadPower)],
          ['E panel ∑', `${fmt(s.energy.solar, 3)} Wh`],
          ['E beban ∑', `${fmt(s.energy.load, 3)} Wh`],
          ['E H₂ kimia ∑', `${fmt(s.energy.hydrogenChemical, 3)} Wh`],
        ].map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-2">
            <span className="text-[11px] text-[#8fa6c4]">{k}</span>
            <span className="num text-[11.5px] font-semibold text-[#e6edf7]">{v}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/** ── Donat pembagian daya ───────────────────────────────────────────── */
export function EnergyStatus({ s }: { s: SimulationState }) {
  // Pembagian diambil langsung dari daya tiap jalur agar jumlahnya
  // selalu cocok dengan apa yang dianimasikan pada diagram.
  const data = [
    { name: 'Ke beban', value: s.flows.controllerToLoad, color: '#FDE68A' },
    { name: 'Ke baterai', value: Math.max(0, s.batteryPower), color: '#4ADE80' },
    { name: 'Ke H₂', value: s.flows.controllerToElectrolyzer, color: '#38BDF8' },
    { name: 'Dari fuel cell', value: s.flows.fuelCellToLoad, color: '#A78BFA' },
    { name: 'Dari PLN', value: s.flows.gridToLoad, color: '#94A3B8' },
    { name: 'ESP32', value: PHYSICS.P_ESP, color: '#64748B' },
  ];
  const total = data.reduce((a, b) => a + b.value, 0);
  const shown = data.filter((d) => d.value > 0.001);

  return (
    <Card title="Status Energi" icon={<BarChart3 size={15} />}>
      <div className="flex items-center gap-3">
        <div className="relative h-[132px] w-[132px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={shown.length ? shown : [{ name: 'Tidak ada aliran', value: 1, color: '#1e3350' }]}
                dataKey="value"
                innerRadius={40}
                outerRadius={62}
                paddingAngle={2}
                stroke="none"
                isAnimationActive={false}
              >
                {(shown.length ? shown : [{ color: '#1e3350' }]).map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#0b1424',
                  border: '1px solid #1e3350',
                  borderRadius: 10,
                  fontSize: 11,
                }}
                formatter={(v) => watt(Number(v))}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="num text-[16px] font-extrabold text-[#e6edf7]">
                {fmt(total)}
              </div>
              <div className="text-[9px] text-[#5d7593]">W total aliran</div>
            </div>
          </div>
        </div>

        <ul className="min-w-0 flex-1 space-y-1">
          {data.map((d) => (
            <li key={d.name} className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: d.color }} />
              <span className="min-w-0 flex-1 text-[11px] text-[#8fa6c4]">{d.name}</span>
              <span className="num shrink-0 text-[11px] font-semibold text-[#e6edf7]">
                {fmt(d.value)} W
              </span>
              <span className="num w-[34px] shrink-0 text-right text-[10px] text-[#5d7593]">
                {total > 0.001 ? `${fmt((d.value / total) * 100, 0)}%` : '—'}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

/** ── Level penyimpanan gas ──────────────────────────────────────────── */
function StorageBar({
  label, volume, capacity, color,
}: { label: string; volume: number; capacity: number; color: string }) {
  const ratio = Math.max(0, Math.min(1, volume / capacity));
  return (
    <div className="rounded-xl border border-[#17283f] bg-[#0d1829]/70 p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-extrabold" style={{ color }}>{label}</span>
        <span className="num text-[12px] font-bold text-[#e6edf7]">
          {fmt(volume, 1)} <span className="text-[10px] text-[#5d7593]">/ {capacity} mL</span>
        </span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#07111f]">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${ratio * 100}%`,
            background: `linear-gradient(90deg, ${color}aa, ${color})`,
            boxShadow: `0 0 10px ${color}66`,
          }}
        />
      </div>
      <div className="num mt-1 text-right text-[11px] font-bold" style={{ color }}>
        {fmt(ratio * 100, 0)} %
      </div>
    </div>
  );
}

export function StorageLevels({
  s, controls,
}: { s: SimulationState; controls: SimulationControls }) {
  return (
    <Card title="Level Penyimpanan" icon={<Droplets size={15} />}>
      <div className="grid gap-2.5">
        <StorageBar label="H₂" volume={s.hydrogenVolume} capacity={controls.h2Capacity} color="#38BDF8" />
        <StorageBar label="O₂" volume={s.oxygenVolume} capacity={controls.o2Capacity} color="#F87171" />
      </div>
      <p className="mt-2.5 text-[10.5px] leading-snug text-[#5d7593]">
        Elektrolisis air menghasilkan H₂ : O₂ = 2 : 1, jadi volume O₂ selalu
        setengah dari H₂.
      </p>
    </Card>
  );
}

/** ── Status sistem ──────────────────────────────────────────────────── */
export function SystemStatus({ s }: { s: SimulationState }) {
  const checks = [
    {
      ok: s.panelPower > 0.01,
      good: 'Panel surya berfungsi',
      bad: 'Panel surya tidak menghasilkan daya',
    },
    {
      ok: s.batterySoc > 0.2,
      good: 'Baterai dalam batas aman',
      bad: `Baterai rendah (${fmt(s.batterySoc * 100, 0)}%)`,
    },
    {
      ok: s.relay.ch2 || s.hydrogenVolume > 0,
      good: 'Produksi H₂ normal',
      bad: 'Belum ada stok H₂',
    },
    {
      ok: !s.relay.ch3,
      good: 'Fuel cell siaga',
      bad: 'Fuel cell sedang memasok beban',
    },
    {
      ok: !s.relay.ch4,
      good: 'PLN dalam mode siaga',
      bad: 'PLN sedang menopang beban',
    },
  ];

  const tone = s.mode === 'DEFISIT' ? 'bad' : s.mode === 'SURPLUS' ? 'info' : 'good';

  return (
    <Card
      title="Mode Sistem"
      icon={<ShieldCheck size={15} />}
      action={<Badge tone={tone}>{s.mode}</Badge>}
    >
      <ul className="space-y-1.5">
        {checks.map((c, i) => (
          <li key={i} className="flex items-start gap-2">
            {c.ok ? (
              <CheckCircle2 size={14} className="mt-[1px] shrink-0 text-[#4ADE80]" />
            ) : (
              <AlertTriangle size={14} className="mt-[1px] shrink-0 text-[#FBBF24]" />
            )}
            <span className={`text-[11.5px] ${c.ok ? 'text-[#8fa6c4]' : 'text-[#FBBF24]'}`}>
              {c.ok ? c.good : c.bad}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#17283f] pt-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] text-[#8fa6c4]">Sumber lampu</span>
          <span className="num text-[11px] font-semibold text-[#e6edf7]">
            {s.relay.ch3 ? 'Fuel cell' : s.relay.ch4 ? 'PLN' : s.relay.ch1 ? 'Panel/bat.' : '—'}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] text-[#8fa6c4]">Relay aktif</span>
          <span className="num text-[11px] font-semibold text-[#22d3ee]">
            {[s.relay.ch1 && 'CH1', s.relay.ch2 && 'CH2', s.relay.ch3 && 'CH3', s.relay.ch4 && 'CH4']
              .filter(Boolean)
              .join(' ') || '—'}
          </span>
        </div>
      </div>
    </Card>
  );
}
