import { Clock, Pause, Play, RotateCcw, Leaf } from 'lucide-react';
import type { SimulationState } from '../types/simulation';
import { clock } from '../utils/format';
import { Badge } from './ui';

/**
 * Bilah atas: identitas, jam simulasi, dan kendali jalan/jeda.
 * Aplikasi ini sengaja satu halaman — tidak ada navigasi tab.
 */
export function Header({
  state,
  paused,
  onTogglePause,
  onReset,
}: {
  state: SimulationState;
  paused: boolean;
  onTogglePause: () => void;
  onReset: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#17283f] bg-[#07111f]/92 backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-3">
        {/* Identitas */}
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#22d3ee]/35 bg-[#22d3ee]/12 text-[#22d3ee]">
            <Leaf size={20} />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-extrabold leading-tight text-[#e6edf7]">
              Simulasi PLTS Terapung + Baterai +{' '}
              <span className="text-[#22d3ee]">H₂ Hijau</span>
            </h1>
            <p className="truncate text-[11px] text-[#5d7593]">
              LKM-3 MSTR Energi — Praktek Rekayasa | Kelompok 1
            </p>
          </div>
        </div>

        {/* Status ringkas + kendali */}
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-[#17283f] bg-[#0b1424] px-3 py-1.5">
            <Clock size={15} className="text-[#22d3ee]" />
            <div className="leading-tight">
              <div className="text-[9.5px] font-medium text-[#5d7593]">Waktu Simulasi</div>
              <div className="num text-[13px] font-bold text-[#e6edf7]">
                {clock(state.time)}
              </div>
            </div>
            <Badge tone={state.dayPhase === 'SIANG' ? 'good' : 'info'}>
              {state.dayPhase}
            </Badge>
          </div>

          <Badge
            tone={
              state.mode === 'DEFISIT' ? 'bad' : state.mode === 'SURPLUS' ? 'info' : 'good'
            }
          >
            EMS {state.mode}
          </Badge>

          <button
            type="button"
            onClick={onTogglePause}
            className="flex items-center gap-1.5 rounded-lg bg-[#1d4ed8] px-3.5 py-2 text-[12px] font-bold text-white transition hover:bg-[#2563eb]"
          >
            {paused ? <Play size={14} /> : <Pause size={14} />}
            {paused ? 'Lanjut' : 'Jeda'}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 rounded-lg border border-[#f87171]/40 bg-[#f87171]/12 px-3.5 py-2 text-[12px] font-bold text-[#f87171] transition hover:bg-[#f87171]/20"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>
    </header>
  );
}
