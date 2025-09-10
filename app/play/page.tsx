'use client';
import CountryLeaderboard from '@/components/CountryLeaderboard';
import GameCanvas from '@/components/gameCanvas';
import Hud from '@/components/hud';
import PersistenceBridge from '@/components/PersistenceBridge';
import SettingsPanel from '@/components/SettingsPanel';
import UiShell from '@/components/uiShell';

export default function GamePage() {
  return (
    <UiShell>
      <PersistenceBridge />
      <h1 className="mb-4 text-center text-4xl font-bold tracking-tight text-white/90">Neon Blobs.io</h1>
      <p className="mb-2 text-center text-white/60">WASD/Arrows • Space = Dash • Joystick pe mobil</p>

      <div className="relative">
        <GameCanvas />
        <div className="absolute inset-0">
          <Hud />
          <SettingsPanel />
        </div>
      </div>

      <CountryLeaderboard />
    </UiShell>
  );
}
