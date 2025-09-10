'use client';
import GameCanvas from '@/components/gameCanvas';
import Hud from '@/components/hud';
import UiShell from '@/components/uiShell';

export default function GamePage() {
  return (
    <UiShell>
      <h1 className="mb-4 text-center text-4xl font-bold tracking-tight text-white/90">
        Neon Blobs.io
      </h1>
      <p className="mb-6 text-center text-white/60">
        WASD/Arrows to move • Space to Dash
      </p>
      <div className="relative">
        <GameCanvas />
        <Hud />
      </div>
    </UiShell>
  );
}
