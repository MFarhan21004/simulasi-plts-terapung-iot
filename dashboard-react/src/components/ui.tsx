import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

/** Kartu panel standar dengan judul opsional. */
export function Card({
  title,
  icon,
  action,
  children,
  className = '',
  bodyClassName = '',
}: {
  title?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`card flex flex-col ${className}`}>
      {title && (
        <header className="flex items-center gap-2 border-b border-[#17283f] px-3.5 py-2.5">
          {icon && <span className="text-[#22d3ee]">{icon}</span>}
          <h2 className="text-[13px] font-semibold tracking-wide text-[#e6edf7]">
            {title}
          </h2>
          {action && <div className="ml-auto">{action}</div>}
        </header>
      )}
      <div className={`flex-1 p-4 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

/** Angka besar yang beranimasi halus saat berubah. */
export function Metric({
  label,
  value,
  unit,
  color = '#e6edf7',
  icon,
}: {
  label: string;
  value: string;
  unit?: string;
  color?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#17283f] bg-[#0d1829]/70 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#8fa6c4]">
        {icon && <span style={{ color }}>{icon}</span>}
        <span className="truncate">{label}</span>
      </div>
      <motion.div
        key={value}
        initial={{ opacity: 0.45, y: -2 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="num mt-1 text-[17px] font-bold leading-none"
        style={{ color }}
      >
        {value}
        {unit && <span className="ml-1 text-[11px] font-semibold opacity-70">{unit}</span>}
      </motion.div>
    </div>
  );
}

/** Slider dengan kotak angka yang bisa diketik. */
export function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  decimals = 0,
  onChange,
}: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  decimals?: number;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex items-center gap-2.5 py-1">
      <span className="w-[96px] shrink-0 text-[11.5px] leading-tight text-[#8fa6c4]">
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full outline-none
                   [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#07111f]
                   [&::-webkit-slider-thumb]:bg-[#22d3ee]
                   [&::-webkit-slider-thumb]:shadow-[0_0_0_3px_rgba(34,211,238,0.22)]
                   [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5
                   [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2
                   [&::-moz-range-thumb]:border-[#07111f] [&::-moz-range-thumb]:bg-[#22d3ee]"
        style={{
          background: `linear-gradient(90deg, #22d3ee ${pct}%, #1e3350 ${pct}%)`,
        }}
      />
      <span className="flex shrink-0 items-baseline gap-1">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={Number(value.toFixed(decimals))}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!Number.isNaN(v)) onChange(clamp(v));
          }}
          className="num w-[48px] rounded-lg border border-[#1e3350] bg-[#07111f] px-2 py-1
                     text-right text-[12px] font-semibold text-[#22d3ee] outline-none
                     transition focus:border-[#22d3ee] focus:ring-2 focus:ring-[#22d3ee]/25
                     [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none
                     [&::-webkit-outer-spin-button]:appearance-none"
        />
        {unit && (
          <span className="w-[28px] shrink-0 text-[9.5px] leading-none text-[#5d7593]">
            {unit}
          </span>
        )}
      </span>
    </div>
  );
}

/** Tombol bundar on/off bergaya panel kontrol. */
export function PowerToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-full border transition active:scale-95 ${
        checked
          ? 'border-[#4ade80] bg-[radial-gradient(circle_at_50%_32%,#4ade80,#15803d)] shadow-[0_0_16px_rgba(74,222,128,0.45)]'
          : 'border-[#1e3350] bg-[radial-gradient(circle_at_50%_32%,#223048,#131f33)] hover:border-[#8fa6c4]'
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" strokeWidth={2.4}>
        <path
          d="M7.5 7.5a6.5 6.5 0 1 0 9 0"
          stroke={checked ? '#06251a' : '#5d7593'}
          strokeLinecap="round"
        />
        <path d="M12 3v8" stroke={checked ? '#06251a' : '#5d7593'} strokeLinecap="round" />
      </svg>
    </button>
  );
}

/** Kelompok tombol pilihan tunggal. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string; icon?: ReactNode }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition ${
              active
                ? 'border-[#22d3ee]/60 bg-[#22d3ee]/12 text-[#22d3ee]'
                : 'border-[#1e3350] bg-[#0d1829]/60 text-[#8fa6c4] hover:border-[#2b476b]'
            }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** Dropdown bergaya konsisten dengan kontrol lain. */
export function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="flex-1 rounded-lg border border-[#1e3350] bg-[#07111f] px-2.5 py-1.5
                 text-[12px] text-[#e6edf7] outline-none transition
                 focus:border-[#22d3ee] focus:ring-2 focus:ring-[#22d3ee]/25"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Lencana status kecil. */
export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'info';
}) {
  const tones = {
    neutral: 'border-[#1e3350] bg-[#0d1829] text-[#8fa6c4]',
    good: 'border-[#4ade80]/45 bg-[#4ade80]/14 text-[#4ade80]',
    warn: 'border-[#fbbf24]/45 bg-[#fbbf24]/14 text-[#fbbf24]',
    bad: 'border-[#f87171]/45 bg-[#f87171]/14 text-[#f87171]',
    info: 'border-[#22d3ee]/45 bg-[#22d3ee]/14 text-[#22d3ee]',
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
