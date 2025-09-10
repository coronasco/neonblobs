'use client';
import { useGameStore } from '@/lib/state/useGameStore';
import { formatScore } from '@/lib/format';

export default function Hud(): React.ReactElement {
  const ui = useGameStore((s) => s.ui);
  const dashPerc = Math.min(1, Math.max(0, ui.dashCooldown ?? 0));
  const dashReady = dashPerc <= 0.01;

  return (
    <div className="pointer-events-none relative z-10 mx-auto w-[1280px]">
      {/* SCORE stânga-sus */}
      <div className="absolute left-2 top-2 rounded-xl bg-black/40 px-4 py-2 text-4xl font-extrabold tracking-tight text-cyan-300 ring-1 ring-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
        {formatScore(ui.score)}
      </div>

      {/* DASH cooldown dreapta-sus */}
      <div className="absolute right-4 top-4 flex items-center gap-3">
        <div className="text-xs uppercase tracking-widest text-white/70">Dash</div>
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border border-white/20" />
          <svg className="absolute inset-0" viewBox="0 0 36 36" aria-hidden>
            <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
            <circle
              cx="18" cy="18" r="16" fill="none" stroke="rgb(0,229,255)"
              strokeWidth="4" strokeDasharray={`${(1 - dashPerc) * 100} ${dashPerc * 100}`}
              strokeDashoffset="25"
            />
          </svg>
          <div className={`absolute inset-0 grid place-items-center text-[10px] ${dashReady ? 'text-cyan-300' : 'text-white/70'}`}>
            {dashReady ? 'READY' : `${Math.ceil(dashPerc * 10) / 10}s`}
          </div>
        </div>
      </div>
    </div>
  );
}
