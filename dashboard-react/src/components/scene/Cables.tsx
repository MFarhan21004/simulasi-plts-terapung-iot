import type { FlowState } from '../../types/simulation';
import { SCENE, CABLES, type Cable } from './sceneLayout';
import { watt } from '../../utils/format';

/** Daya di bawah nilai ini dianggap tidak mengalir (README §8). */
const THRESHOLD = 0.05;

/**
 * Kecepatan aliran mengikuti v = v₀ + k·√P, lalu dibulatkan ke beberapa
 * tingkat. Pembulatan itu penting: tanpanya durasi animasi CSS berubah
 * tiap frame dan aliran terlihat tersendat.
 */
function speedOf(power: number): number {
  const raw = 1.15 - Math.sqrt(power) * 0.3;
  const clamped = Math.max(0.32, Math.min(1.15, raw));
  return Math.round(clamped * 10) / 10;
}

function Wire({ cable, power }: { cable: Cable; power: number }) {
  const active = power >= THRESHOLD;
  const dur = speedOf(power);

  // Tautan WiFi: garis titik tipis, tanpa selubung kabel
  if (cable.wireless) {
    return (
      <g>
        <path
          d={cable.d}
          fill="none"
          stroke={active ? `${cable.color}4d` : `${cable.color}1f`}
          strokeWidth={1.6}
          strokeDasharray="5 8"
          strokeLinecap="round"
        />
        {active && (
          <path
            className="flow-stream"
            d={cable.d}
            fill="none"
            stroke={cable.color}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray="0.1 30"
            style={{
              animationDuration: '1.6s',
              filter: `drop-shadow(0 0 4px ${cable.color})`,
            }}
          />
        )}
      </g>
    );
  }

  return (
    <g>
      {/* Selubung kabel */}
      <path
        d={cable.d}
        fill="none"
        stroke="rgba(4,9,17,0.75)"
        strokeWidth={cable.pipe ? 11 : 9}
        strokeLinecap="round"
      />
      {/* Inti */}
      <path
        d={cable.d}
        fill="none"
        stroke={active ? `${cable.color}66` : 'rgba(150,176,210,0.22)'}
        strokeWidth={cable.pipe ? 7 : 4.5}
        strokeLinecap="round"
      />
      {cable.pipe && (
        <path
          d={cable.d}
          fill="none"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth={2}
          strokeLinecap="round"
        />
      )}

      {/* Partikel energi — titik bulat yang berjalan di sepanjang kabel */}
      {active && (
        <path
          className="flow-stream"
          d={cable.d}
          fill="none"
          stroke={cable.color}
          strokeWidth={cable.pipe ? 6 : 5}
          strokeLinecap="round"
          strokeDasharray="0.1 20"
          style={{
            animationDuration: `${dur}s`,
            animationDirection: cable.reverse ? 'reverse' : 'normal',
            filter: `drop-shadow(0 0 5px ${cable.color})`,
          }}
        />
      )}
    </g>
  );
}

function PowerTag({ cable, power }: { cable: Cable; power: number }) {
  if (!cable.label || cable.hideLabel || power < THRESHOLD) return null;
  const text = watt(power);
  const w = text.length * 7.4 + 16;

  return (
    <g>
      <rect
        x={cable.label.x - w / 2}
        y={cable.label.y - 12}
        width={w}
        height={24}
        rx={12}
        fill="rgba(5,12,22,0.92)"
        stroke={`${cable.color}70`}
        strokeWidth={1.2}
      />
      <text
        x={cable.label.x}
        y={cable.label.y + 4.5}
        textAnchor="middle"
        fill={cable.color}
        fontSize={12.5}
        fontWeight={700}
        fontFamily="JetBrains Mono, ui-monospace, monospace"
      >
        {text}
      </text>
    </g>
  );
}

/**
 * Satu lapisan kabel. Adegan memasang dua lapisan: `back` di bawah benda dan
 * `front` di atasnya, sehingga sebagian kabel tampak lewat di belakang
 * perangkat dan sebagian melintas di depan — inti ilusi kedalaman 2.5D.
 */
export function Cables({ flows, layer }: { flows: FlowState; layer: 'back' | 'front' }) {
  const list = CABLES.filter((c) => (layer === 'front' ? c.front : !c.front));
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${SCENE.w} ${SCENE.h}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {list.map((c) => (
        <Wire key={c.id} cable={c} power={flows[c.flow]} />
      ))}
    </svg>
  );
}

/**
 * Tag daya seluruh jalur dalam satu lapisan tersendiri di atas benda,
 * sehingga angka pada kabel yang lewat di belakang tetap terbaca.
 */
export function PowerTags({ flows }: { flows: FlowState }) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${SCENE.w} ${SCENE.h}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {CABLES.map((c) => (
        <PowerTag key={c.id} cable={c} power={flows[c.flow]} />
      ))}
    </svg>
  );
}
