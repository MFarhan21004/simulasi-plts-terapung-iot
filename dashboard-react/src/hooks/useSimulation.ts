import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ScenarioId,
  SimulationControls,
  SimulationState,
} from '../types/simulation';
import { createInitialState, stepSimulation, type EmsMemory } from '../utils/physics';
import { DEFAULT_CONTROLS, SCENARIOS } from '../data/scenarios';
import { PHYSICS } from '../utils/constants';

/** Langkah integrasi maksimum agar hasil tetap stabil pada skala waktu tinggi. */
const MAX_STEP = 1;

export function useSimulation() {
  const [controls, setControls] = useState<SimulationControls>(DEFAULT_CONTROLS);
  const [state, setState] = useState<SimulationState>(() =>
    createInitialState(DEFAULT_CONTROLS),
  );
  const [paused, setPaused] = useState(false);

  // Ref agar loop animasi selalu membaca nilai terbaru tanpa dibuat ulang
  const controlsRef = useRef(controls);
  const stateRef = useRef(state);
  const pausedRef = useRef(paused);
  const memRef = useRef<EmsMemory>({ deficitTimer: 0 });

  controlsRef.current = controls;
  stateRef.current = state;
  pausedRef.current = paused;

  useEffect(() => {
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const realDt = Math.min((now - last) / 1000, 0.1);
      last = now;

      if (!pausedRef.current) {
        const c = controlsRef.current;
        let next = stateRef.current;
        let remaining = realDt * c.timeScale;

        // Integrasi bertahap: langkah besar dipecah agar EMS tetap akurat
        while (remaining > 0) {
          const dt = Math.min(remaining, MAX_STEP);
          next = stepSimulation(next, c, dt, memRef.current);
          remaining -= dt;
        }

        stateRef.current = next;
        setState(next);
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const updateControls = useCallback((patch: Partial<SimulationControls>) => {
    setControls((prev) => {
      const next = { ...prev, ...patch };

      // Perubahan yang harus langsung tercermin pada keadaan berjalan
      setState((s) => {
        let out = s;
        if (patch.initialSoc !== undefined && patch.initialSoc !== prev.initialSoc) {
          out = {
            ...out,
            batterySoc: patch.initialSoc,
            batteryEnergy: patch.initialSoc * PHYSICS.E_BAT_MAX,
          };
        }
        if (patch.initialH2 !== undefined && patch.initialH2 !== prev.initialH2) {
          const h2 = Math.min(patch.initialH2, next.h2Capacity);
          out = { ...out, hydrogenVolume: h2, oxygenVolume: Math.min(h2 / 2, next.o2Capacity) };
        }
        if (patch.h2Capacity !== undefined) {
          out = { ...out, hydrogenVolume: Math.min(out.hydrogenVolume, patch.h2Capacity) };
        }
        if (patch.o2Capacity !== undefined) {
          out = { ...out, oxygenVolume: Math.min(out.oxygenVolume, patch.o2Capacity) };
        }
        stateRef.current = out;
        return out;
      });

      return next;
    });
  }, []);

  const reset = useCallback(() => {
    memRef.current.deficitTimer = 0;
    setControls(DEFAULT_CONTROLS);
    const fresh = createInitialState(DEFAULT_CONTROLS);
    stateRef.current = fresh;
    setState(fresh);
    setPaused(false);
  }, []);

  const applyScenario = useCallback((id: ScenarioId) => {
    const scenario = SCENARIOS.find((s) => s.id === id);
    if (!scenario) return;

    memRef.current.deficitTimer = 0;
    const nextControls = { ...DEFAULT_CONTROLS, ...scenario.controls };
    const fresh = createInitialState(nextControls);

    const seeded: SimulationState = {
      ...fresh,
      scenario: id,
      batterySoc: scenario.seed?.soc ?? fresh.batterySoc,
      batteryEnergy: (scenario.seed?.soc ?? fresh.batterySoc) * PHYSICS.E_BAT_MAX,
      hydrogenVolume: scenario.seed?.hydrogen ?? fresh.hydrogenVolume,
      oxygenVolume: (scenario.seed?.hydrogen ?? fresh.hydrogenVolume) / 2,
    };

    setControls(nextControls);
    stateRef.current = seeded;
    setState(seeded);
    setPaused(false);
  }, []);

  return {
    state,
    controls,
    paused,
    setPaused,
    updateControls,
    reset,
    applyScenario,
  };
}
