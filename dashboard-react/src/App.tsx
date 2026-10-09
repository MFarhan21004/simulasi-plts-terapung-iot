import { Header } from './components/Header';
import { ControlSidebar } from './components/ControlSidebar';
import { SimulationScene } from './components/scene/SimulationScene';
import {
  RealtimeMetrics,
  EnergyStatus,
  StorageLevels,
  SystemStatus,
} from './components/BottomPanels';
import { useSimulation } from './hooks/useSimulation';

/**
 * Satu halaman penuh: adegan simulasi mendominasi, panel kontrol di kanan,
 * dan ringkasan data di bawah sebagai informasi sekunder.
 */
export default function App() {
  const sim = useSimulation();

  return (
    <div className="min-h-screen">
      <Header
        state={sim.state}
        paused={sim.paused}
        onTogglePause={() => sim.setPaused((p) => !p)}
        onReset={sim.reset}
      />

      <main className="mx-auto w-full max-w-[1920px] px-4 py-3">
        <div className="flex flex-col gap-3 xl:flex-row">
          {/* Kolom utama */}
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <SimulationScene state={sim.state} controls={sim.controls} />

            {/* Informasi sekunder — ringkas agar tidak bersaing dengan adegan */}
            <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-4">
              <RealtimeMetrics s={sim.state} />
              <EnergyStatus s={sim.state} />
              <StorageLevels s={sim.state} controls={sim.controls} />
              <SystemStatus s={sim.state} />
            </div>
          </div>

          <ControlSidebar
            controls={sim.controls}
            state={sim.state}
            onChange={sim.updateControls}
            onScenario={sim.applyScenario}
          />
        </div>
      </main>
    </div>
  );
}
