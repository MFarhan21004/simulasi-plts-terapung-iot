import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { SimulationState } from '../../types/simulation';
import { fmt, watt, volt } from '../../utils/format';
import { WIRE } from './sceneLayout';

/*
 * Benda-benda fisik adegan 2.5D.
 *
 * Arah cahaya konsisten dari kiri-atas (posisi matahari), sehingga:
 *   - sorotan tepi ada di kiri-atas tiap benda,
 *   - ketebalan/ekstrusi menjorok ke kanan-bawah,
 *   - bayangan jatuh ke kanan-bawah.
 */

/* ═══════════════════════════════════════════════════════════ primitif */

/**
 * Lempeng berketebalan: muka depan + sisi yang menjorok ke kanan-bawah.
 * Inilah pembentuk kesan 2.5D pada semua kotak perangkat.
 */
function Slab({
  depth = 8,
  radius = 12,
  face,
  side,
  border = 'rgba(160,190,230,0.18)',
  glow,
  children,
  className = '',
}: {
  depth?: number;
  radius?: number;
  face: string;
  side: string;
  border?: string;
  glow?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className="absolute inset-0"
      style={{ filter: 'drop-shadow(10px 16px 14px rgba(0,0,0,0.5))' }}
    >
      {/* Sisi (ketebalan) */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${depth * 0.75}px, ${depth}px)`,
          borderRadius: radius,
          background: side,
        }}
      />
      {/* Muka depan */}
      <div
        className={`absolute inset-0 overflow-hidden ${className}`}
        style={{
          borderRadius: radius,
          background: face,
          border: `1px solid ${border}`,
          boxShadow: `inset 1.5px 1.5px 0 rgba(255,255,255,0.13),
                      inset -1px -2px 0 rgba(0,0,0,0.42)${glow ? `, 0 0 30px ${glow}` : ''}`,
        }}
      >
        {/* Kilau kiri-atas */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.09) 0%, transparent 38%)',
          }}
        />
        {children}
      </div>
    </div>
  );
}

/** Lampu indikator kecil. */
function Led({ on, color = '#38E27A', size = 7 }: { on: boolean; color?: string; size?: number }) {
  return (
    <span
      className="inline-block shrink-0 rounded-full transition-all duration-300"
      style={{
        width: size,
        height: size,
        background: on
          ? `radial-gradient(circle at 35% 35%, #fff 0%, ${color} 45%, ${color} 100%)`
          : 'radial-gradient(circle at 35% 35%, #3a4a62, #1a2433)',
        boxShadow: on ? `0 0 8px ${color}, 0 0 2px ${color}` : 'inset 0 1px 2px rgba(0,0,0,0.6)',
      }}
    />
  );
}

/* ══════════════════════════════════════════════ ① Waduk + ② Panel surya */

/** Wadah air akrilik: dinding tebal, air berlapis, riak, dan pantulan. */
export function Reservoir({ light }: { light: number }) {
  return (
    <div className="absolute inset-0">
      {/* Sisi tebal dinding akrilik */}
      <div
        className="absolute inset-0 rounded-xl"
        style={{
          transform: 'translate(6px, 8px)',
          background: 'linear-gradient(180deg, rgba(70,96,128,0.55), rgba(30,44,64,0.7))',
        }}
      />
      {/* Muka dinding */}
      <div
        className="absolute inset-0 overflow-hidden rounded-xl border-2"
        style={{
          borderColor: 'rgba(186,212,240,0.42)',
          background: 'rgba(120,150,184,0.08)',
          boxShadow:
            'inset 2px 2px 0 rgba(255,255,255,0.14), 0 20px 34px rgba(0,0,0,0.42)',
        }}
      >
        {/* Air — tiga lapis kedalaman */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            top: '22%',
            background: `linear-gradient(180deg,
              hsl(195 62% ${27 + light * 18}%) 0%,
              hsl(203 64% ${19 + light * 13}%) 38%,
              hsl(214 66% ${11 + light * 8}%) 100%)`,
          }}
        >
          {/* Riak berlapis */}
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="absolute inset-x-[4%] h-[2px] rounded-full"
              style={{
                top: `${10 + i * 18}%`,
                background: `linear-gradient(90deg, transparent, rgba(190,232,255,${0.42 - i * 0.06}), transparent)`,
                animation: `ripple ${3.2 + i * 0.6}s ease-in-out infinite`,
                animationDelay: `${i * -0.7}s`,
              }}
            />
          ))}
          {/* Kilau cahaya matahari di permukaan */}
          <div
            className="absolute left-[8%] top-0 h-[30%] w-[22%] blur-[10px]"
            style={{ background: `rgba(255,228,150,${0.06 + light * 0.16})` }}
          />
        </div>

        {/* Garis permukaan air (tampak sedikit dari atas) */}
        <div
          className="absolute inset-x-0 h-[10px]"
          style={{
            top: 'calc(22% - 5px)',
            background: `linear-gradient(180deg, rgba(200,236,255,${0.18 + light * 0.2}), transparent)`,
            borderTop: '2px solid rgba(206,238,255,0.55)',
          }}
        />

        {/* Kaca: pantulan vertikal */}
        <div className="pointer-events-none absolute inset-y-0 left-[3%] w-[5%] bg-white/8 blur-[2px]" />
      </div>
    </div>
  );
}

/** Modul surya berperspektif di atas ponton, beserta pantulannya di air. */
export function SolarPanel({ s }: { s: SimulationState }) {
  const lit = Math.min(1, s.panelPower / 5);

  const cells = (
    <div className="grid h-full w-full grid-cols-6 grid-rows-3 gap-[2px] p-[3px]">
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className="rounded-[1px]"
          style={{
            background: `linear-gradient(140deg,
              hsl(222 70% ${17 + lit * 15}%) 0%,
              hsl(216 64% ${25 + lit * 19}%) 100%)`,
            boxShadow: 'inset 0 0 0 0.5px rgba(160,200,255,0.25)',
          }}
        />
      ))}
    </div>
  );

  const panel = (
    <div
      className="relative h-full w-full rounded-[4px]"
      style={{
        // Bingkai aluminium
        background: 'linear-gradient(135deg, #c9d4e2 0%, #7b8aa0 45%, #4b586c 100%)',
        padding: 3,
        boxShadow: lit > 0.06 ? `0 0 ${22 + lit * 30}px rgba(255,212,59,${lit * 0.4})` : 'none',
      }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[2px] bg-[#0a1630]">
        {cells}
        {/* Kilau matahari yang menyapu permukaan */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(115deg,
              rgba(255,255,255,${0.04 + lit * 0.26}) 0%,
              rgba(255,240,200,${lit * 0.1}) 30%,
              transparent 55%)`,
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="absolute inset-0" style={{ animation: 'bob 4.4s ease-in-out infinite' }}>
      {/* Modul miring dalam perspektif — tampak dari depan-atas */}
      <div
        className="absolute left-[6%] top-[-6%] h-[70%] w-[88%]"
        style={{
          transform: 'perspective(760px) rotateX(34deg) rotateZ(-5deg)',
          transformOrigin: '50% 100%',
        }}
      >
        {/* Ketebalan bingkai */}
        <div
          className="absolute inset-0 rounded-[4px] bg-[#2a3445]"
          style={{ transform: 'translate(3px, 6px)' }}
        />
        {panel}
      </div>

      {/* Kaki penopang */}
      <div className="absolute bottom-[24%] left-[18%] h-[22%] w-[4px] rounded-full bg-gradient-to-r from-[#aab6c6] to-[#5b687c]" />
      <div className="absolute bottom-[24%] right-[20%] h-[30%] w-[4px] rounded-full bg-gradient-to-r from-[#aab6c6] to-[#5b687c]" />
      <div className="absolute bottom-[24%] left-[17%] h-[3px] w-[66%] rounded-full bg-[#7b8aa0]" />

      {/* Ponton berketebalan */}
      <div className="absolute inset-x-[9%] bottom-[14%] flex justify-between">
        {[0, 1].map((i) => (
          <span key={i} className="relative block h-[14px] w-[38px]">
            <span className="absolute inset-0 translate-x-[2px] translate-y-[3px] rounded-[4px] bg-[#8a3d06]" />
            <span className="absolute inset-0 rounded-[4px] bg-gradient-to-b from-[#ffb468] via-[#f28a2a] to-[#c9600f] shadow-[inset_1px_1px_0_rgba(255,255,255,0.4)]" />
          </span>
        ))}
      </div>

      {/* Pantulan panel di permukaan air */}
      <div
        className="reflection pointer-events-none absolute left-[8%] top-[92%] h-[52%] w-[84%]"
        style={{
          opacity: 0.16 + lit * 0.16,
          filter: 'blur(1.6px)',
          WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.9), transparent 85%)',
          maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.9), transparent 85%)',
        }}
      >
        <div style={{ transform: 'perspective(760px) rotateX(-34deg) rotateZ(5deg)', height: '100%' }}>
          {panel}
        </div>
      </div>

      {/* Kotak sambung — titik berangkat kabel ke kontroler */}
      <span className="absolute bottom-[6%] right-[-2%] block h-[16px] w-[20px]">
        <span className="absolute inset-0 translate-x-[2px] translate-y-[3px] rounded-[3px] bg-[#0d141e]" />
        <span className="absolute inset-0 rounded-[3px] border border-[#5d7593]/50 bg-gradient-to-b from-[#3a475a] to-[#222c3b]" />
      </span>
    </div>
  );
}

/* ═════════════════════════════════════════════════ ④⑤⑦ Kotak kontrol IoT */

export function ControllerBox({ s }: { s: SimulationState }) {
  const tone =
    s.mode === 'DEFISIT' ? '#FF4D4D' : s.mode === 'SURPLUS' ? WIRE.electric : WIRE.battery;

  return (
    <div className="absolute inset-0">
      <Slab
        depth={10}
        radius={14}
        face="linear-gradient(160deg, #3a4a60 0%, #222e3f 38%, #151e2b 100%)"
        side="linear-gradient(160deg, #141b26, #0a0f17)"
        border="rgba(170,196,230,0.22)"
      >
        {/* Sekrup sudut */}
        {(['left-[7px] top-[7px]', 'right-[7px] top-[7px]', 'left-[7px] bottom-[7px]', 'right-[7px] bottom-[7px]'] as const).map(
          (pos) => (
            <span
              key={pos}
              className={`absolute ${pos} h-[6px] w-[6px] rounded-full`}
              style={{ background: 'radial-gradient(circle at 35% 35%, #d5dfec, #6b7a90)' }}
            />
          ),
        )}

        {/* Papan PCB di dalam casing */}
        <div
          className="absolute inset-[14px] rounded-lg p-2"
          style={{
            background:
              'radial-gradient(circle at 20% 15%, #0f3a2b 0%, #0a2a20 55%, #071d16 100%)',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(120,220,170,0.12)',
          }}
        >
          {/* Jalur tembaga PCB */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-30" preserveAspectRatio="none" viewBox="0 0 100 100">
            <g stroke="#c9a54a" strokeWidth={0.5} fill="none">
              <path d="M 6 30 H 30 V 55 H 52" />
              <path d="M 70 30 V 60 H 92" />
              <path d="M 10 80 H 40 V 68" />
              <path d="M 60 82 H 88" />
            </g>
          </svg>

          {/* Blok terminal */}
          <div className="relative flex gap-[3px]">
            {Array.from({ length: 9 }).map((_, i) => (
              <span
                key={i}
                className="h-[12px] flex-1 rounded-[2px] bg-gradient-to-b from-[#4c95f5] to-[#1c4c9c] shadow-[0_2px_0_#0d2a5a]"
              >
                <span className="mx-auto mt-[3px] block h-[4px] w-[4px] rounded-full bg-[#0d2a5a]" />
              </span>
            ))}
          </div>

          <div className="relative mt-2 flex gap-2">
            {/* Dua sensor INA219 */}
            <div className="flex w-[33%] flex-col gap-1.5">
              {['#1', '#2'].map((n) => (
                <div
                  key={n}
                  className="relative rounded-[3px] bg-gradient-to-b from-[#1fa564] to-[#0f6a3e] px-1 pb-[3px] pt-[2px] shadow-[2px_3px_0_#05301c]"
                >
                  <div className="text-[6.5px] font-bold leading-none text-[#c8f5dc]">INA219 {n}</div>
                  <div className="mt-[2px] flex items-center gap-[3px]">
                    <span className="h-[8px] w-[8px] rounded-[1px] bg-[#111]" />
                    <span className="h-[4px] flex-1 rounded-[1px] bg-[#c9a54a]/70" />
                  </div>
                </div>
              ))}
            </div>

            {/* ESP32 */}
            <div className="relative w-[32%] rounded-[3px] bg-gradient-to-b from-[#20242e] to-[#0c0f14] px-[7px] pb-[3px] pt-[4px] shadow-[2px_3px_0_#000]">
              <div className="absolute inset-y-[4px] left-[2px] flex flex-col justify-between">
                {Array.from({ length: 7 }).map((_, i) => (
                  <span key={i} className="h-[3px] w-[3px] rounded-[1px] bg-[#E0B23C]" />
                ))}
              </div>
              <div className="absolute inset-y-[4px] right-[2px] flex flex-col justify-between">
                {Array.from({ length: 7 }).map((_, i) => (
                  <span key={i} className="h-[3px] w-[3px] rounded-[1px] bg-[#E0B23C]" />
                ))}
              </div>
              {/* Pelindung logam modul WiFi */}
              <div className="h-[15px] rounded-[2px] bg-gradient-to-br from-[#e3e9f1] via-[#9aa7b8] to-[#6b7789]" />
              <div className="num mt-[3px] text-center text-[7px] font-bold text-[#cdd8e6]">ESP32</div>
              {/* Tombol BOOT/EN + LED daya */}
              <div className="mt-[2px] flex items-center justify-between px-[1px]">
                <span className="h-[3px] w-[5px] rounded-[1px] bg-[#555]" />
                <Led on color="#FF4D4D" size={4} />
                <span className="h-[3px] w-[5px] rounded-[1px] bg-[#555]" />
              </div>
            </div>

            {/* Modul relay 4 kanal */}
            <div className="w-[35%] rounded-[3px] bg-gradient-to-b from-[#2d6fd6] to-[#183f86] p-[4px] shadow-[2px_3px_0_#0b2350]">
              <div className="grid gap-[3px]">
                {(
                  [
                    ['CH1', s.relay.ch1],
                    ['CH2', s.relay.ch2],
                    ['CH3', s.relay.ch3],
                    ['CH4', s.relay.ch4],
                  ] as const
                ).map(([label, on]) => (
                  <div key={label} className="flex items-center gap-1">
                    <Led on={on} />
                    <span
                      className="num text-[8px] font-bold leading-none"
                      style={{ color: on ? '#e3fff0' : '#6f8bb3' }}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Modul daya */}
          <div className="relative mt-2 flex gap-1.5">
            {(
              [
                ['TP4056', 'from-[#d63434] to-[#7d1616]', '#FFD9D9'],
                ['Boost', 'from-[#2563d6] to-[#102f6e]', '#cfe0ff'],
                ['Buck', 'from-[#d67a18] to-[#7d4208]', '#FFE6C4'],
              ] as const
            ).map(([label, grad, fg]) => (
              <span
                key={label}
                className={`flex-1 rounded-[3px] bg-gradient-to-b ${grad} py-[3px] text-center text-[6.5px] font-bold shadow-[1px_2px_0_rgba(0,0,0,0.6)]`}
                style={{ color: fg }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Status EMS */}
          <div
            className="relative mt-2 rounded-md py-[5px] text-center text-[10px] font-extrabold tracking-wide"
            style={{
              background: `linear-gradient(180deg, ${tone}33, ${tone}14)`,
              color: tone,
              border: `1px solid ${tone}66`,
              boxShadow: `0 0 14px ${tone}33`,
            }}
          >
            EMS {s.mode}
          </div>
        </div>
      </Slab>

      {/* Port USB di sisi kanan casing */}
      <span className="absolute right-[-5px] top-[38%] h-[14px] w-[6px] rounded-r-[2px] bg-gradient-to-r from-[#8a96a8] to-[#4b5668]" />
      <span className="absolute right-[-5px] top-[54%] h-[10px] w-[6px] rounded-r-[2px] bg-gradient-to-r from-[#1b1f27] to-[#0c0f14]" />

      {/* Pancaran WiFi */}
      <svg className="absolute -top-[24px] right-[18px] h-[24px] w-[32px]" viewBox="0 0 32 24" fill="none">
        {[1, 2, 3].map((i) => (
          <motion.path
            key={i}
            d={`M ${16 - i * 5} ${22 - i * 2} A ${i * 5} ${i * 5} 0 0 1 ${16 + i * 5} ${22 - i * 2}`}
            stroke={WIRE.telemetry}
            strokeWidth={2}
            strokeLinecap="round"
            animate={{ opacity: [0.2, 0.95, 0.2] }}
            transition={{ duration: 1.9, repeat: Infinity, delay: i * 0.22 }}
          />
        ))}
      </svg>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ ③ Baterai */

export function BatteryModule({ s }: { s: SimulationState }) {
  const charging = s.batteryPower > 0.01;
  const discharging = s.batteryPower < -0.01;
  const critical = s.batterySoc < 0.2;
  const color = critical ? '#FF4D4D' : charging ? WIRE.battery : '#FFB020';
  const soc = Math.max(0, Math.min(1, s.batterySoc));

  return (
    <div className="absolute inset-0">
      {/* Terminal */}
      <span className="absolute -right-[11px] top-[34%] z-10 block h-[28%] w-[12px]">
        <span className="absolute inset-0 translate-x-[2px] translate-y-[3px] rounded-r-[3px] bg-[#5c1610]" />
        <span className="absolute inset-0 rounded-r-[3px] bg-gradient-to-b from-[#ff8a6c] to-[#c0392b]" />
      </span>
      <span className="absolute -left-[11px] top-[34%] z-10 block h-[28%] w-[12px]">
        <span className="absolute inset-0 translate-x-[2px] translate-y-[3px] rounded-l-[3px] bg-[#1b2230]" />
        <span className="absolute inset-0 rounded-l-[3px] bg-gradient-to-b from-[#a8b6c8] to-[#566479]" />
      </span>

      <Slab
        depth={9}
        radius={12}
        face="linear-gradient(165deg, #34445a 0%, #1e2939 50%, #141c28 100%)"
        side="linear-gradient(165deg, #121924, #090d14)"
        border={`${color}55`}
        glow={charging ? `${color}33` : undefined}
        className="px-3 py-2.5"
      >
        {/* Sel 18650 berderet — kesan isi modul */}
        <div className="relative h-[36px] overflow-hidden rounded-md border border-[#0a1322] bg-[#060c16] shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]">
          {/* Isi SOC — lebar dalam persen murni; calc() tidak bisa dianimasikan */}
          <div className="absolute inset-[3px]">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-[4px]"
            style={{
              background: `linear-gradient(180deg, ${color} 0%, ${color}cc 55%, ${color}88 100%)`,
              boxShadow: `0 0 18px ${color}88, inset 0 1px 0 rgba(255,255,255,0.45)`,
            }}
            initial={false}
            animate={{ width: `${soc * 100}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          >
            {/* Arus energi: bergerak masuk saat mengisi, keluar saat dipakai */}
            {(charging || discharging) && (
              <div
                className="batt-flow absolute inset-0 rounded-[4px]"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(115deg, rgba(255,255,255,0.28) 0 6px, transparent 6px 18px)',
                  animationDirection: charging ? 'normal' : 'reverse',
                }}
              />
            )}
          </motion.div>
          </div>
          {/* Sekat antarsel */}
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="absolute inset-y-[3px] w-px bg-black/40"
              style={{ left: `${i * 20}%` }}
            />
          ))}
          <span className="num absolute inset-0 grid place-items-center text-[15px] font-extrabold text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]">
            {fmt(soc * 100, 1)} %
          </span>
        </div>

        <div className="mt-1.5 flex items-baseline justify-between">
          <span className="num text-[12px] font-bold" style={{ color }}>
            {volt(s.batteryVoltage)}
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-[#8fa6c4]">
            {charging ? 'mengisi' : discharging ? 'dipakai' : 'diam'}
          </span>
          <span className="num text-[12px] font-bold" style={{ color }}>
            {charging ? '▲' : discharging ? '▼' : '—'} {watt(Math.abs(s.batteryPower))}
          </span>
        </div>
      </Slab>
    </div>
  );
}

/* ═════════════════════════════════════════════════════ ⑪ Elektroliser */

export function ElectrolyzerBox({ s }: { s: SimulationState }) {
  const on = s.relay.ch2;
  return (
    <div className="absolute inset-0">
      <Slab
        depth={9}
        radius={12}
        face="linear-gradient(160deg, #2a3a78 0%, #1a2557 45%, #111a3d 100%)"
        side="linear-gradient(160deg, #0d1330, #070b1d)"
        border={on ? 'rgba(39,199,255,0.6)' : 'rgba(150,170,230,0.2)'}
        glow={on ? 'rgba(39,199,255,0.28)' : undefined}
        className="px-3 py-2"
      >
        {/* Kisi ventilasi */}
        <div className="absolute right-3 top-2.5 flex gap-[2px]">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="h-[10px] w-[2px] rounded-full bg-black/40" />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Led on={on} color={WIRE.hydrogen} size={9} />
          <span className="num text-[10px] font-bold text-[#e6edf7]">2,0 V · ±0,5 A</span>
        </div>

        {/* Pelat elektroda */}
        <div className="mt-1.5 flex h-[26px] items-end gap-[3px]">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.span
              key={i}
              className="flex-1 rounded-t-[2px]"
              style={{
                height: `${52 + ((i * 7) % 4) * 16}%`,
                background: on
                  ? `linear-gradient(180deg, #8ae6ff, ${WIRE.hydrogen})`
                  : 'linear-gradient(180deg, #4a5f80, #2c3c56)',
                boxShadow: on ? `0 0 7px ${WIRE.hydrogen}99` : 'none',
              }}
              animate={on ? { opacity: [0.4, 1, 0.4] } : { opacity: 0.7 }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.07 }}
            />
          ))}
        </div>

        <div className="mt-1 flex items-baseline justify-between">
          <span className="num text-[12px] font-bold" style={{ color: on ? WIRE.hydrogen : '#5d7593' }}>
            {watt(s.electrolyzerActivePower)}
          </span>
          <span
            className="num rounded px-1 text-[8.5px] font-bold"
            style={{ background: on ? `${WIRE.hydrogen}22` : 'transparent', color: on ? WIRE.hydrogen : '#5d7593' }}
          >
            CH2 {on ? 'ON' : 'OFF'}
          </span>
        </div>
      </Slab>
    </div>
  );
}

/* ═══════════════════════════════════════════ Tabung silinder H₂ dan O₂ */

/**
 * Tabung kaca silinder: tutup elips atas-bawah, dinding melengkung,
 * permukaan cairan elips, gelembung, dan kilau kaca.
 */
export function GasTank({
  label,
  volume,
  capacity,
  color,
  bubbling,
}: {
  label: string;
  volume: number;
  capacity: number;
  color: string;
  bubbling: boolean;
}) {
  const ratio = Math.max(0, Math.min(1, volume / capacity));
  const CAP = 20; // tinggi elips tutup (px)

  return (
    <div
      className="absolute inset-0"
      style={{ filter: `drop-shadow(10px 18px 16px rgba(0,0,0,0.5))${bubbling ? ` drop-shadow(0 0 16px ${color}55)` : ''}` }}
    >
      {/* Badan silinder */}
      <div
        className="absolute inset-x-0 overflow-hidden"
        style={{
          top: CAP / 2,
          bottom: CAP / 2,
          background: 'rgba(14,32,54,0.55)',
          borderLeft: '2px solid rgba(186,212,240,0.32)',
          borderRight: '2px solid rgba(186,212,240,0.32)',
        }}
      >
        {/* Cairan — permukaan elipsnya menempel di puncak elemen ini, jadi
            keduanya selalu bergerak bersama dan tidak pernah "patah". */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            height: `${ratio * 100}%`,
            transition: 'height 0.35s ease-out',
            background: `linear-gradient(90deg,
              ${color}aa 0%, ${color}ee 30%, ${color} 50%, ${color}ee 70%, ${color}99 100%)`,
          }}
        />

        {/* Gelembung */}
        {bubbling &&
          Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className="bubble absolute bottom-2 block rounded-full"
              style={{
                left: `${12 + i * 10.5}%`,
                width: 3 + (i % 3) * 1.5,
                height: 3 + (i % 3) * 1.5,
                background: 'radial-gradient(circle at 35% 35%, #fff, rgba(255,255,255,0.35))',
                animationDuration: `${1.6 + i * 0.26}s`,
                animationDelay: `${i * 0.22}s`,
              }}
            />
          ))}

        {/* Lengkung dinding: gelap di tepi, terang di tengah */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(90deg,
              rgba(0,0,0,0.5) 0%,
              rgba(0,0,0,0.05) 22%,
              rgba(255,255,255,0.16) 36%,
              rgba(255,255,255,0.03) 50%,
              rgba(0,0,0,0.08) 74%,
              rgba(0,0,0,0.5) 100%)`,
          }}
        />
        {/* Garis kilau tajam */}
        <div className="pointer-events-none absolute inset-y-[6%] left-[26%] w-[5px] rounded-full bg-white/30 blur-[1px]" />

        {/* Skala ukur */}
        <div className="pointer-events-none absolute inset-y-[6%] right-[10%] flex flex-col justify-between">
          {Array.from({ length: 11 }).map((_, i) => (
            <span
              key={i}
              className="block h-px bg-white/35"
              style={{ width: i % 5 === 0 ? 12 : 6, marginLeft: 'auto' }}
            />
          ))}
        </div>
      </div>

      {/* Permukaan cairan — elips agar tampak silinder. Selalu terpasang
          (hanya disembunyikan saat kosong) supaya tidak muncul ulang dari
          posisi awal setiap kali volume kembali ke nol. */}
      <div
        className="pointer-events-none absolute inset-x-0"
        style={{ top: CAP / 2, bottom: CAP / 2 }}
      >
        <div
          className="absolute inset-x-[2px] rounded-[50%]"
          style={{
            height: CAP * 0.8,
            bottom: `${ratio * 100}%`,
            marginBottom: -CAP * 0.4,
            opacity: ratio > 0.002 ? 1 : 0,
            transition: 'bottom 0.35s ease-out, opacity 0.3s',
            background: `radial-gradient(ellipse at 40% 40%, #ffffffcc 0%, ${color} 55%, ${color}cc 100%)`,
            boxShadow: `0 0 12px ${color}`,
          }}
        />
      </div>

      {/* Tutup bawah (terisi cairan bila ada) */}
      <div
        className="absolute inset-x-0 bottom-0 rounded-[50%]"
        style={{
          height: CAP,
          background:
            ratio > 0.002
              ? `radial-gradient(ellipse at 50% 30%, ${color}, ${color}88)`
              : 'rgba(14,32,54,0.7)',
          border: '2px solid rgba(186,212,240,0.32)',
          borderTopColor: 'transparent',
        }}
      />

      {/* Tutup atas: cincin kaca + sumbat logam */}
      <div
        className="absolute inset-x-0 top-0 rounded-[50%]"
        style={{
          height: CAP,
          background: 'radial-gradient(ellipse at 50% 40%, rgba(220,236,255,0.22), rgba(20,40,64,0.6))',
          border: '2px solid rgba(206,226,250,0.5)',
        }}
      />
      <div className="absolute left-1/2 top-[-6px] h-[12px] w-[34%] -translate-x-1/2 rounded-[3px] bg-gradient-to-b from-[#c9d4e2] to-[#5b687c] shadow" />

      {/* Label melekat pada kaca */}
      <div className="absolute inset-x-0 top-[34px] flex justify-center">
        <div className="rounded-md border border-white/12 bg-[#050c18]/70 px-2 py-1 text-center backdrop-blur-[2px]">
          <div className="text-[16px] font-extrabold leading-none" style={{ color, textShadow: `0 0 10px ${color}88` }}>
            {label}
          </div>
          <div className="num mt-[3px] text-[11px] font-bold leading-none text-white">
            {fmt(volume, 1)} mL
          </div>
          <div className="num mt-[2px] text-[8px] leading-none text-white/55">/ {capacity} mL</div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ ⑫ Fuel cell */

export function FuelCellBox({ s }: { s: SimulationState }) {
  const on = s.relay.ch3;
  return (
    <div className="absolute inset-0">
      <Slab
        depth={9}
        radius={12}
        face={
          on
            ? 'linear-gradient(160deg, #1c6b3f 0%, #10462a 50%, #0a2e1c 100%)'
            : 'linear-gradient(160deg, #34445a 0%, #1e2939 50%, #141c28 100%)'
        }
        side={on ? 'linear-gradient(160deg, #072014, #04140c)' : 'linear-gradient(160deg, #121924, #090d14)'}
        border={on ? 'rgba(56,226,122,0.65)' : 'rgba(160,190,230,0.18)'}
        glow={on ? 'rgba(56,226,122,0.32)' : undefined}
        className="px-3 py-2"
      >
        <div className="flex items-center gap-2">
          <Led on={on} size={9} />
          <span className="num text-[10px] font-bold text-[#e6edf7]">PEM · η = 50%</span>
        </div>

        {/* Tumpukan sel bahan bakar */}
        <div className="relative mt-1.5 flex h-[30px] items-stretch gap-[2px] rounded-[3px] bg-black/30 p-[3px]">
          {Array.from({ length: 13 }).map((_, i) => (
            <motion.span
              key={i}
              className="flex-1 rounded-[1px]"
              style={{
                background: on
                  ? `linear-gradient(180deg, #a8f5c6, ${WIRE.battery})`
                  : 'linear-gradient(180deg, #4a5f80, #2c3c56)',
                boxShadow: on ? `0 0 6px ${WIRE.battery}88` : 'none',
              }}
              animate={on ? { opacity: [0.45, 1, 0.45] } : { opacity: 0.75 }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.07 }}
            />
          ))}
        </div>

        <div className="mt-1 flex items-baseline justify-between">
          <span className="num text-[12px] font-bold" style={{ color: on ? WIRE.battery : '#5d7593' }}>
            {watt(s.fuelCellPower)}
          </span>
          <span className="num text-[8.5px] text-[#8fa6c4]">
            H₂ {fmt(on ? s.fuelCellPower * 0.73 : 0, 2)} mL/mnt
          </span>
        </div>
      </Slab>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ ⑥ Lampu LED */

export function LedLamp({ s }: { s: SimulationState }) {
  const source = s.relay.ch3 ? 'fuel cell' : s.relay.ch4 ? 'PLN' : s.relay.ch1 ? 'panel / baterai' : null;
  const power = s.relay.ch3
    ? s.flows.fuelCellToLoad
    : s.relay.ch4
      ? s.flows.gridToLoad
      : s.flows.controllerToLoad;
  const lit = power > 0.01;

  return (
    <div className="absolute inset-0 flex flex-col items-center">
      {/* Kolam cahaya di tanah */}
      <div
        className="pointer-events-none absolute left-1/2 top-[64%] h-[46%] w-[260%] -translate-x-1/2 rounded-[50%] transition-opacity duration-500"
        style={{
          opacity: lit ? 1 : 0,
          background:
            'radial-gradient(ellipse, rgba(255,226,120,0.38) 0%, rgba(255,212,59,0.1) 45%, transparent 70%)',
        }}
      />
      {/* Halo */}
      <div
        className="pointer-events-none absolute left-1/2 top-[-34%] h-[150%] w-[230%] -translate-x-1/2 rounded-full transition-opacity duration-500"
        style={{
          opacity: lit ? 1 : 0,
          background:
            'radial-gradient(circle, rgba(255,246,186,0.5) 0%, rgba(255,212,59,0.14) 34%, transparent 66%)',
        }}
      />

      {/* Bohlam */}
      <motion.div
        className="relative grid h-[60px] w-[60px] place-items-center rounded-full"
        style={{
          background: lit
            ? 'radial-gradient(circle at 40% 32%, #FFFFF4 0%, #FFE98A 40%, #FFB020 100%)'
            : 'radial-gradient(circle at 40% 32%, #4a5872 0%, #232e40 100%)',
          boxShadow: lit
            ? '0 0 40px rgba(255,212,59,0.8), 0 0 80px rgba(255,212,59,0.35), inset -6px -8px 14px rgba(190,110,0,0.4)'
            : 'inset -6px -8px 14px rgba(0,0,0,0.5), 6px 10px 16px rgba(0,0,0,0.45)',
          border: `1px solid ${lit ? 'rgba(255,240,180,0.7)' : 'rgba(148,176,214,0.3)'}`,
        }}
        animate={lit ? { scale: [1, 1.035, 1] } : { scale: 1 }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Kilau kaca */}
        <span className="absolute left-[22%] top-[16%] h-[22%] w-[16%] rotate-[-30deg] rounded-full bg-white/60 blur-[1px]" />
        <svg viewBox="0 0 40 40" className="h-[26px] w-[26px]">
          <path
            d="M12 27 L16 14 L20 25 L24 14 L28 27"
            fill="none"
            stroke={lit ? 'rgba(170,100,0,0.9)' : 'rgba(148,176,214,0.45)'}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>

      {/* Fitting berulir */}
      <div className="relative h-[14px] w-[28px]">
        <span className="absolute inset-0 translate-x-[2px] translate-y-[2px] rounded-b-[4px] bg-[#1d2533]" />
        <span
          className="absolute inset-0 rounded-b-[4px]"
          style={{
            background:
              'repeating-linear-gradient(180deg, #b4c0d0 0 2px, #6b7890 2px 4px)',
          }}
        />
      </div>
      <div className="h-[5px] w-[16px] rounded-b-[2px] bg-[#2f3a4d]" />

      {/* Nilai */}
      <div className="mt-1 text-center">
        <div
          className="num text-[14px] font-extrabold leading-none"
          style={{ color: lit ? '#FFE98A' : '#4a6180', textShadow: lit ? '0 0 10px rgba(255,212,59,0.6)' : 'none' }}
        >
          {lit ? watt(power) : 'OFF'}
        </div>
        <div className="mt-[3px] text-[8.5px] leading-tight text-[#8fa6c4]">
          {source ?? 'tidak ada suplai'}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ PLN */

export function GridBox({ s }: { s: SimulationState }) {
  const on = s.relay.ch4;
  return (
    <div className="absolute inset-0">
      <Slab
        depth={7}
        radius={10}
        face={
          on
            ? 'linear-gradient(160deg, #7a5410 0%, #4a330a 100%)'
            : 'linear-gradient(160deg, #2a374a 0%, #172131 100%)'
        }
        side="linear-gradient(160deg, #0e141e, #070a10)"
        border={on ? 'rgba(255,176,32,0.7)' : 'rgba(160,190,230,0.15)'}
        glow={on ? 'rgba(255,176,32,0.3)' : undefined}
        className="px-2.5 py-2"
      >
        <div className="flex items-center justify-between">
          <Led on={on} color="#FFB020" />
          <span className="num text-[8.5px] text-[#5d7593]">CH4</span>
        </div>
        <svg viewBox="0 0 44 22" className="mx-auto mt-1 h-[22px] w-[46px]">
          <g stroke={on ? '#FFB020' : '#56708f'} strokeWidth={1.4} strokeLinecap="round" fill="none">
            <path d="M22 2 L14 21 M22 2 L30 21" />
            <path d="M17 14 L27 14 M19.5 8.5 L24.5 8.5" />
            <path d="M11 6 L33 6" />
            <path d="M11 6 L11 9 M33 6 L33 9" />
          </g>
        </svg>
        <div className="num text-center text-[10px] font-bold" style={{ color: on ? '#FFB020' : '#5d7593' }}>
          {on ? watt(s.gridPower) : 'siaga'}
        </div>
      </Slab>
    </div>
  );
}

/* ═════════════════════════════════════════════ ⑧⑨ Dasbor laptop & ponsel */

function Screen({ s, small }: { s: SimulationState; small?: boolean }) {
  const modeColor =
    s.mode === 'DEFISIT' ? '#FF4D4D' : s.mode === 'SURPLUS' ? WIRE.electric : WIRE.battery;

  const rows: Array<[string, string, string]> = small
    ? [
        ['PV', watt(s.panelPower), WIRE.solar],
        ['SOC', `${fmt(s.batterySoc * 100, 0)} %`, WIRE.battery],
        ['H₂', `${fmt(s.hydrogenVolume, 1)} mL`, WIRE.hydrogen],
        ['FC', watt(s.fuelCellPower), WIRE.battery],
      ]
    : [
        ['V · I panel', `${fmt(s.panelVoltage)} V · ${fmt(s.panelCurrent, 2)} A`, WIRE.solar],
        ['P panel', watt(s.panelPower), WIRE.solar],
        ['Baterai', `${fmt(s.batterySoc * 100, 0)} % · ${fmt(s.batteryVoltage)} V`, WIRE.battery],
        ['H₂ / O₂', `${fmt(s.hydrogenVolume, 1)} / ${fmt(s.oxygenVolume, 1)} mL`, WIRE.hydrogen],
      ];

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-[3px] bg-[#061220]">
      <div
        className="shrink-0 bg-[#20D9FF]/14 px-1.5 font-bold text-[#20D9FF]"
        style={{ fontSize: small ? 6 : 8, paddingBlock: small ? 2 : 3 }}
      >
        {small ? 'PLTS IoT' : 'Monitoring PLTS + H₂'}
      </div>
      <div className="flex flex-1 flex-col justify-center gap-[1px] px-1.5">
        {rows.map(([label, value, color]) => (
          <div key={label} className="flex items-baseline justify-between gap-1">
            <span className="truncate text-[#8fa6c4]" style={{ fontSize: small ? 5.5 : 7 }}>
              {label}
            </span>
            <span className="num shrink-0 font-bold" style={{ fontSize: small ? 6 : 7.5, color }}>
              {value}
            </span>
          </div>
        ))}
      </div>
      <div className="shrink-0 px-1.5 pb-1">
        <div
          className="rounded-[2px] text-center font-extrabold text-[#06131f]"
          style={{ background: modeColor, fontSize: small ? 5.5 : 7, paddingBlock: 1 }}
        >
          {s.mode}
        </div>
        <div className="mt-[3px] flex gap-[2px]">
          {(
            [
              [s.panelPower / 5, WIRE.solar],
              [s.batterySoc, WIRE.battery],
              [s.hydrogenVolume / 50, WIRE.hydrogen],
            ] as const
          ).map(([ratio, color], i) => (
            <span key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/12">
              <span
                className="block h-full rounded-full"
                style={{ width: `${Math.max(4, Math.min(1, ratio) * 100)}%`, background: color }}
              />
            </span>
          ))}
        </div>
      </div>
      {/* Pantulan kaca layar */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
    </div>
  );
}

/** ⑧ Laptop: layar sedikit condong ke belakang di atas alas keyboard. */
export function LaptopDashboard({ s }: { s: SimulationState }) {
  return (
    <div className="absolute inset-0" style={{ filter: 'drop-shadow(10px 16px 14px rgba(0,0,0,0.5))' }}>
      {/* Layar */}
      <div
        className="absolute inset-x-[4%] top-0 h-[80%]"
        style={{ transform: 'perspective(700px) rotateX(7deg)', transformOrigin: '50% 100%' }}
      >
        <div className="absolute inset-0 translate-x-[3px] translate-y-[3px] rounded-[7px] bg-[#0f1520]" />
        <div
          className="absolute inset-0 rounded-[7px] border border-[#4a5e7c] p-[5px]"
          style={{ background: 'linear-gradient(160deg, #3d4d68 0%, #1f2a3b 100%)' }}
        >
          <Screen s={s} />
        </div>
      </div>
      {/* Alas keyboard dalam perspektif */}
      <div
        className="absolute inset-x-0 bottom-0 h-[24%]"
        style={{ transform: 'perspective(500px) rotateX(58deg)', transformOrigin: '50% 0%' }}
      >
        <div
          className="h-full w-full rounded-[6px] border border-[#4a5e7c]"
          style={{ background: 'linear-gradient(180deg, #46566f 0%, #29354a 100%)' }}
        >
          <div className="grid h-[70%] grid-cols-12 gap-[2px] p-[4px]">
            {Array.from({ length: 36 }).map((_, i) => (
              <span key={i} className="rounded-[1px] bg-[#1b2433]" />
            ))}
          </div>
          <div className="mx-auto h-[18%] w-[26%] rounded-[2px] bg-[#1b2433]" />
        </div>
      </div>
    </div>
  );
}

/** ⑨ Ponsel: sedikit diputar agar tampak berdiri di samping laptop. */
export function PhoneDashboard({ s }: { s: SimulationState }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        transform: 'perspective(600px) rotateY(-14deg)',
        filter: 'drop-shadow(8px 14px 12px rgba(0,0,0,0.5))',
      }}
    >
      <div className="absolute inset-0 translate-x-[4px] translate-y-[3px] rounded-[11px] bg-[#0b1018]" />
      <div
        className="absolute inset-0 rounded-[11px] border border-[#4a5e7c] p-[4px]"
        style={{ background: 'linear-gradient(160deg, #3d4d68 0%, #1f2a3b 100%)' }}
      >
        <div className="mx-auto mb-[3px] h-[2px] w-[34%] rounded-full bg-white/25" />
        <div className="h-[calc(100%-14px)]">
          <Screen s={s} small />
        </div>
        <div className="mx-auto mt-[3px] h-[5px] w-[5px] rounded-full border border-white/25" />
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════ Bak air (akuarium) elektrolisis */

/**
 * Bak kaca berisi air tempat tabung H₂ dan O₂ berdiri.
 * Digambar dua lapis: `back` (dinding belakang + air gelap) di belakang
 * tabung, dan `front` (air bening + dinding depan) di depannya — jadi
 * bagian bawah tabung tampak benar-benar terendam.
 */
export function WaterBath({ layer, light, active }: { layer: 'back' | 'front'; light: number; active: boolean }) {
  const TOP = '18%'; // permukaan air dari tepi atas bak

  if (layer === 'back') {
    return (
      <div className="absolute inset-0">
        {/* Ketebalan dinding kanan-bawah */}
        <div
          className="absolute inset-0 rounded-[10px]"
          style={{ transform: 'translate(7px, 9px)', background: 'linear-gradient(180deg, rgba(60,86,118,0.6), rgba(24,36,54,0.8))' }}
        />
        {/* Dinding belakang + air bagian dalam */}
        <div className="absolute inset-0 overflow-hidden rounded-[10px] bg-[#0b1a2c]/70">
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              top: TOP,
              background: `linear-gradient(180deg, hsl(196 60% ${18 + light * 12}%) 0%, hsl(212 64% ${9 + light * 6}%) 100%)`,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0" style={{ filter: 'drop-shadow(10px 16px 14px rgba(0,0,0,0.45))' }}>
      <div
        className="absolute inset-0 overflow-hidden rounded-[10px] border-2"
        style={{
          borderColor: 'rgba(190,216,244,0.45)',
          boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.16)',
        }}
      >
        {/* Air bening di depan tabung */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            top: TOP,
            background: `linear-gradient(180deg,
              rgba(110,200,245,${0.22 + light * 0.12}) 0%,
              rgba(40,110,180,0.32) 55%,
              rgba(16,50,96,0.5) 100%)`,
          }}
        >
          {/* Riak */}
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute inset-x-[5%] h-[2px] rounded-full"
              style={{
                top: `${14 + i * 22}%`,
                background: `linear-gradient(90deg, transparent, rgba(200,236,255,${0.4 - i * 0.07}), transparent)`,
                animation: `ripple ${3 + i * 0.6}s ease-in-out infinite`,
                animationDelay: `${i * -0.8}s`,
              }}
            />
          ))}
          {/* Gelembung kecil dari elektroda saat elektrolisis berjalan */}
          {active &&
            [12, 24, 34, 64, 74, 86].map((left, i) => (
              <span
                key={i}
                className="bubble absolute bottom-2 block rounded-full bg-white/70"
                style={{
                  left: `${left}%`,
                  width: 3 + (i % 2),
                  height: 3 + (i % 2),
                  animationDuration: `${1.4 + i * 0.25}s`,
                  animationDelay: `${i * 0.3}s`,
                }}
              />
            ))}
        </div>
        {/* Permukaan air, tampak sedikit dari atas */}
        <div
          className="absolute inset-x-0 h-[10px]"
          style={{
            top: `calc(${TOP} - 5px)`,
            background: `linear-gradient(180deg, rgba(210,240,255,${0.25 + light * 0.2}), transparent)`,
            borderTop: '2px solid rgba(210,240,255,0.6)',
          }}
        />
        {/* Kilau kaca */}
        <div className="pointer-events-none absolute inset-y-[6%] left-[3%] w-[4%] rounded-full bg-white/12 blur-[2px]" />
        <div className="pointer-events-none absolute inset-y-[10%] right-[5%] w-[2%] rounded-full bg-white/8 blur-[1px]" />
      </div>
    </div>
  );
}
