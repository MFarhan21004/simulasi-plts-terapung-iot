import { memo, useMemo } from 'react';
import type { WeatherPreset } from '../../types/simulation';
import { SCENE, HORIZON } from './sceneLayout';

/**
 * Lingkungan adegan, disusun dari belakang ke depan:
 *   atmosfer → langit → bintang → matahari/bulan → awan → pegunungan
 *   → lantai berperspektif → rumput → hujan → vinyet
 *
 * Komponen ini sengaja hanya menerima nilai primitif yang sudah dibulatkan.
 * Adegan di-render ulang tiap frame, tapi latar cukup digambar ulang saat
 * cahaya berubah satu tingkat — bukan 60 kali per detik.
 */
export interface BackgroundProps {
  /** Cahaya efektif dibulatkan ke 0–20. */
  lightStep: number;
  /** Intensitas matahari dibulatkan ke 0–20. */
  sunStep: number;
  night: boolean;
  weather: WeatherPreset;
  cloudCount: number;
  cloudAuto: boolean;
  windSpeed: number;
}

const H_PCT = (HORIZON / SCENE.h) * 100;

/** Pembangkit acak deterministik — posisi bintang/hujan tetap antar render. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function BackgroundInner({
  lightStep,
  sunStep,
  night,
  weather,
  cloudCount,
  cloudAuto,
  windSpeed,
}: BackgroundProps) {
  const light = lightStep / 20;
  const sun = sunStep / 20;

  // Cuaca meredupkan dan menurunkan saturasi langit
  const sat = weather === 'hujan' ? 22 : weather === 'mendung' ? 34 : 60;
  const dim = weather === 'hujan' ? 0.55 : weather === 'mendung' ? 0.75 : 1;
  const L = light * dim;

  // Mendung/hujan selalu menampilkan awan meski jumlah awan 0
  const shownClouds =
    weather === 'hujan' ? Math.max(3, cloudCount) : weather === 'mendung' ? Math.max(2, cloudCount) : cloudCount;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* ── 1. Atmosfer + 2. Langit ── */}
      <div
        className="absolute inset-x-0 top-0 transition-[background] duration-1000"
        style={{
          height: `${H_PCT}%`,
          background: `linear-gradient(180deg,
            hsl(224 ${sat}% ${4 + L * 16}%) 0%,
            hsl(214 ${sat}% ${8 + L * 25}%) 46%,
            hsl(203 ${sat}% ${13 + L * 33}%) 100%)`,
        }}
      />

      {/* ── 3. Bintang (malam) ── */}
      <Stars visible={night} />

      {/* ── 4. Matahari / bulan ── */}
      <SunMoon light={L} sun={sun} night={night} />

      {/* ── 5. Awan ── */}
      <Clouds
        count={shownClouds}
        auto={cloudAuto}
        windSpeed={windSpeed}
        tone={weather === 'hujan' ? 'storm' : weather === 'mendung' ? 'grey' : 'white'}
        light={L}
      />

      {/* ── 6. Pegunungan di cakrawala ── */}
      <Mountains light={L} />

      {/* ── 7. Lantai berperspektif + 8. rumput ── */}
      <Ground light={L} />

      {/* ── 9. Hujan ── */}
      {weather === 'hujan' && <Rain />}

      {/* ── 10. Cahaya atmosfer & vinyet ── */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 70% 55% at 14% 12%,
            rgba(255,212,59,${0.1 * L * (night ? 0 : 1)}) 0%, transparent 60%)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 85% 75% at 50% 45%, transparent 55%, rgba(3,8,16,0.55) 100%)',
        }}
      />
    </div>
  );
}

export const Background = memo(BackgroundInner);

/* ─────────────────────────────────────────────────────────── Bintang */

function Stars({ visible }: { visible: boolean }) {
  const stars = useMemo(() => {
    const rnd = seeded(7);
    return Array.from({ length: 46 }, () => ({
      left: rnd() * 100,
      top: rnd() * H_PCT * 0.82,
      size: 1 + rnd() * 1.8,
      dur: 2.4 + rnd() * 3.2,
      delay: -rnd() * 5,
    }));
  }, []);

  return (
    <div
      className="absolute inset-0 transition-opacity duration-1000"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {stars.map((s, i) => (
        <span
          key={i}
          className="star absolute rounded-full bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDuration: `${s.dur}s`,
            animationDelay: `${s.delay}s`,
            boxShadow: '0 0 4px rgba(255,255,255,0.7)',
          }}
        />
      ))}
    </div>
  );
}

/* ───────────────────────────────────────────────────── Matahari / bulan */

function SunMoon({ light, sun, night }: { light: number; sun: number; night: boolean }) {
  const size = 70 + sun * 18;

  return (
    <div
      className="absolute transition-all duration-1000"
      style={{ left: '5%', top: night ? '9%' : '5.5%', width: size, height: size }}
    >
      {/* Sorot cahaya */}
      <div
        className="absolute rounded-full transition-opacity duration-1000"
        style={{
          inset: `${-size * 1.5}px`,
          opacity: night ? 0.35 : 1,
          background: night
            ? 'radial-gradient(circle, rgba(203,213,225,0.28) 0%, transparent 62%)'
            : `radial-gradient(circle,
                rgba(255,212,59,${0.26 + light * 0.36}) 0%,
                rgba(255,170,40,${0.08 + light * 0.14}) 36%,
                transparent 68%)`,
        }}
      />

      {/* Sinar */}
      {!night && sun > 0.08 && (
        <svg
          className="absolute"
          style={{ inset: `${-size * 0.5}px`, animation: 'sun-spin 60s linear infinite' }}
          viewBox="0 0 100 100"
        >
          {Array.from({ length: 16 }).map((_, i) => {
            const a = (i * Math.PI) / 8;
            const long = i % 2 === 0;
            const r1 = 34;
            const r2 = (long ? 47 : 41) + sun * 3;
            return (
              <line
                key={i}
                x1={50 + Math.cos(a) * r1}
                y1={50 + Math.sin(a) * r1}
                x2={50 + Math.cos(a) * r2}
                y2={50 + Math.sin(a) * r2}
                stroke={`rgba(255,212,59,${(long ? 0.6 : 0.35) * Math.min(sun, light * 1.8)})`}
                strokeWidth={long ? 2.6 : 1.8}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
      )}

      {/* Badan — siang hari ikut meredup saat tertutup awan atau hujan */}
      <div
        className="absolute inset-0 rounded-full transition-all duration-1000"
        style={{
          opacity: night ? 1 : 0.35 + 0.65 * Math.min(1, light * 1.8),
          background: night
            ? 'radial-gradient(circle at 36% 32%, #f1f5f9 0%, #cbd5e1 55%, #8193ab 100%)'
            : 'radial-gradient(circle at 36% 32%, #FFF9DB 0%, #FFD43B 40%, #FF9F1C 100%)',
          boxShadow: night
            ? '0 0 30px rgba(203,213,225,0.4), inset -8px -8px 16px rgba(0,0,0,0.25)'
            : `0 0 ${30 + light * 50}px rgba(255,212,59,${0.4 + light * 0.4}),
               inset -8px -10px 18px rgba(200,90,0,0.28)`,
        }}
      />
      {night && (
        <>
          <span className="absolute left-[24%] top-[28%] h-[17%] w-[17%] rounded-full bg-[#a3b2c6]/70" />
          <span className="absolute left-[56%] top-[50%] h-[23%] w-[23%] rounded-full bg-[#a3b2c6]/55" />
          <span className="absolute left-[36%] top-[64%] h-[11%] w-[11%] rounded-full bg-[#a3b2c6]/60" />
        </>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────── Awan */

function Clouds({
  count,
  auto,
  windSpeed,
  tone,
  light,
}: {
  count: number;
  auto: boolean;
  windSpeed: number;
  tone: 'white' | 'grey' | 'storm';
  light: number;
}) {
  const n = Math.max(0, Math.min(4, Math.round(count)));
  const palette = {
    white: ['#f6f9ff', '#c3cfe2'],
    grey: ['#c4cedb', '#7d8ba0'],
    storm: ['#8c98aa', '#465366'],
  }[tone];

  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: `${4 + (i % 3) * 7.5}%`,
            left: `${16 + i * 21}%`,
            opacity: 0.38 + light * 0.32 + (tone === 'white' ? 0 : 0.2),
            animation: auto
              ? `cloud-drift ${Math.max(24, 160 - windSpeed * 3.8)}s linear infinite`
              : undefined,
            animationDelay: `${i * -13}s`,
          }}
        >
          <svg
            width={150 * (1 + (i % 3) * 0.2)}
            height={62 * (1 + (i % 3) * 0.2)}
            viewBox="0 0 150 62"
            style={{ filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.22))' }}
          >
            <defs>
              <linearGradient id={`cl-${tone}-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={palette[0]} />
                <stop offset="100%" stopColor={palette[1]} />
              </linearGradient>
            </defs>
            <g fill={`url(#cl-${tone}-${i})`}>
              <ellipse cx="75" cy="40" rx="62" ry="18" />
              <ellipse cx="48" cy="32" rx="32" ry="19" />
              <ellipse cx="98" cy="30" rx="28" ry="17" />
              <ellipse cx="72" cy="22" rx="26" ry="17" />
            </g>
          </svg>
        </div>
      ))}
    </>
  );
}

/* ─────────────────────────────────────────────────────────── Pegunungan */

function Mountains({ light }: { light: number }) {
  const far =
    '0,520 0,452 90,410 170,438 260,382 360,430 450,396 560,446 650,404 760,438 860,388 960,428 1060,398 1160,436 1260,404 1400,444 1400,520';
  const near =
    '0,520 0,486 120,462 230,488 340,456 470,492 600,470 720,494 840,464 960,490 1080,470 1200,494 1310,474 1400,490 1400,520';

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox={`0 0 ${SCENE.w} ${SCENE.h}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="mt-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(212 30% ${16 + light * 18}%)`} />
          <stop offset="100%" stopColor={`hsl(210 34% ${11 + light * 12}%)`} />
        </linearGradient>
        <linearGradient id="mt-near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(176 22% ${11 + light * 13}%)`} />
          <stop offset="100%" stopColor={`hsl(160 26% ${8 + light * 9}%)`} />
        </linearGradient>
      </defs>
      <polygon points={far} fill="url(#mt-far)" opacity={0.75} />
      <polygon points={near} fill="url(#mt-near)" />
      {/* Kabut di kaki gunung */}
      <rect
        x={0}
        y={470}
        width={SCENE.w}
        height={50}
        fill={`rgba(160,200,230,${0.04 + light * 0.08})`}
      />
    </svg>
  );
}

/* ────────────────────────────────────── Lantai berperspektif + rumput */

function Ground({ light }: { light: number }) {
  // Titik hilang di tengah cakrawala; garis horizontal makin rapat ke belakang
  const vx = SCENE.w / 2;
  const depth = SCENE.h - HORIZON;
  const rows = Array.from({ length: 9 }, (_, i) => HORIZON + depth * ((i + 1) / 9) ** 1.9);
  const cols = Array.from({ length: 15 }, (_, i) => -700 + i * 200);

  return (
    <>
      <div
        className="absolute inset-x-0 bottom-0 transition-[background] duration-1000"
        style={{
          top: `${H_PCT}%`,
          background: `linear-gradient(180deg,
            hsl(152 32% ${10 + light * 15}%) 0%,
            hsl(150 28% ${8 + light * 10}%) 40%,
            hsl(150 26% ${5 + light * 5}%) 100%)`,
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${SCENE.w} ${SCENE.h}`}
        preserveAspectRatio="none"
      >
        <g stroke={`rgba(130,220,190,${0.05 + light * 0.06})`} strokeWidth={1}>
          {rows.map((y, i) => (
            <line key={`r${i}`} x1={0} y1={y} x2={SCENE.w} y2={y} />
          ))}
          {cols.map((x, i) => (
            <line key={`c${i}`} x1={vx} y1={HORIZON} x2={x} y2={SCENE.h} />
          ))}
        </g>
        {/* Batas cakrawala */}
        <line
          x1={0}
          y1={HORIZON}
          x2={SCENE.w}
          y2={HORIZON}
          stroke={`rgba(168,226,196,${0.16 + light * 0.24})`}
          strokeWidth={1.6}
        />
        {/* Rumput */}
        {Array.from({ length: 96 }).map((_, i) => {
          const x = i * (SCENE.w / 96);
          const h = 5 + Math.sin(i * 1.3) * 3;
          return (
            <path
              key={i}
              d={`M ${x} ${HORIZON} q 1.5 ${-h} 3 ${-h * 0.2}`}
              stroke={`rgba(126,196,150,${0.22 + light * 0.25})`}
              strokeWidth={1.6}
              fill="none"
            />
          );
        })}
      </svg>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────── Hujan */

function Rain() {
  const drops = useMemo(() => {
    const rnd = seeded(31);
    return Array.from({ length: 38 }, () => ({
      left: rnd() * 104,
      height: 14 + rnd() * 18,
      dur: 0.7 + rnd() * 0.5,
      delay: -rnd() * 1.2,
      opacity: 0.25 + rnd() * 0.35,
    }));
  }, []);

  return (
    <div className="absolute inset-0 bg-[#0b1728]/18">
      {drops.map((d, i) => (
        <span
          key={i}
          className="raindrop absolute top-0 block w-px rounded-full"
          style={{
            left: `${d.left}%`,
            height: d.height,
            opacity: d.opacity,
            background: 'linear-gradient(180deg, transparent, rgba(186,222,255,0.9))',
            transform: 'rotate(12deg)',
            animationDuration: `${d.dur}s`,
            animationDelay: `${d.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
