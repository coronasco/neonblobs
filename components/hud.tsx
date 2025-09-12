'use client';
import { useEffect } from 'react';
import { useGameStore } from '@/lib/state/useGameStore';
import { formatScore } from '@/lib/format';
import { Magnet, Shield } from 'lucide-react';
import { useProgress } from '@/lib/state/useProgress';

export default function Hud(): React.ReactElement {
  const ui = useGameStore((s) => s.ui);
  const feed = useGameStore((s) => s.killFeed);
  const tickFeed = useGameStore((s) => s.tickFeed);

  const { level, xp, loaded } = useProgress();
  const hp = ui.hp ?? 0;
  const maxHp = ui.maxHp ?? 0;
  const attack = ui.attack ?? 0;
  const defense = ui.defense ?? 0;
  const hpPerc = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;

  const dashPerc = Math.min(1, Math.max(0, ui.dashCooldown ?? 0));
  const dashReady = dashPerc <= 0.01;
  const combo = Math.max(1, ui.combo ?? 1);

  useEffect(() => {
    let raf = 0; let last = performance.now();
    const loop = (now: number) => { const dt = (now - last) / 1000; last = now; tickFeed(Math.min(0.05, dt)); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tickFeed]);

  const magnetOn = typeof document !== 'undefined' && document.body.dataset.magnet === 'on';
  const shieldOn = typeof document !== 'undefined' && document.body.dataset.shield === 'on';

  return (
    <div className="pointer-events-none absolute z-10 mx-auto w-full h-full">
      {/* SCORE + COMBO */}
      <div className="absolute left-2 top-2 flex items-center gap-3">
        <div className="rounded-xl bg-black/40 p-2 text-sm py-2 md:px-4 md:py-2 md:text-4xl font-extrabold tracking-tight text-cyan-300 ring-1 ring-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
          {formatScore(ui.score)}
        </div>
        {/* LEVEL AND XP */}
        {loaded && (
          <div className="rounded-lg bg-black/40 px-3 py-1 text-sm ring-1 ring-white/10 w-[100px]">
            <span className="font-semibold text-white/90">LV {level}</span>
            <span className="ml-2 text-white/60">XP {xp}</span>
          </div>
        )}
        {combo > 1 && (
          <div className="rounded-lg bg-amber-400/20 px-3 py-1 text-sm md:text-lg font-bold text-amber-300 ring-1 ring-amber-300/40">
            COMBO x{combo}
          </div>
        )}
      </div>
      
      

      {/* DASH + POWERUPS */}
      <div className="absolute right-4 top-4 flex items-center gap-3">
        {/* Dash cooldown ring */}
        <div className="relative md:h-10 md:w-10 h-6 w-6">
          <div className="absolute inset-0 rounded-full border border-white/20" />
          <svg className="absolute inset-0" viewBox="0 0 36 36" aria-hidden>
            <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
            <circle
              cx="18" cy="18" r="16" fill="none" stroke="rgb(0,229,255)"
              strokeWidth="4" strokeDasharray={`${(1 - dashPerc) * 100} ${dashPerc * 100}`}
              strokeDashoffset="25"
            />
          </svg>
          <div className={`absolute inset-0 grid place-items-center md:text-[10px] text-[6px] ${dashReady ? 'text-cyan-300' : 'text-white/70'}`}>
            {dashReady ? 'DASH' : `${Math.ceil(dashPerc * 10) / 10}s`}
          </div>
        </div>

        {/* Magnet */}
        <PowerHudIcon active={magnetOn} type="magnet" />
        {/* Shield */}
        <PowerHudIcon active={shieldOn} type="shield" />
      </div>

      {/* Kill feed */}
      <ul className="absolute right-4 top-20 flex w-64 flex-col gap-1">
        {feed.map((f) => (
          <li key={f.id} className="rounded bg-black/45 px-2 py-1 text-sm text-white/90 ring-1 ring-white/10"
              style={{ opacity: Math.min(1, Math.max(0, f.t / 5)) }}>
            {f.text}
          </li>
        ))}
      </ul>

      {/* HEALTH + ATK/DEF */}
      <div className="absolute left-2 bottom-7 w-[240px] pointer-events-none">
        {/* Bara de HP */}
        <div className="mb-1 text-xs text-white/70">HEALTH</div>
        <div className="h-3 w-full rounded bg-white/10 ring-1 ring-white/10 overflow-hidden">
          <div
            className="h-full bg-emerald-400"
            style={{ width: `${hpPerc * 100}%` }}
          />
        </div>
        <div className="mt-1 text-xs text-white/80">
          {hp}/{maxHp}
        </div>

        {/* ATK / DEF */}
        <div className="mt-2 flex gap-2">
          <div className="rounded bg-black/40 px-2 py-1 text-xs ring-1 ring-white/10">
            ATK <b>{attack}</b>
          </div>
          <div className="rounded bg-black/40 px-2 py-1 text-xs ring-1 ring-white/10">
            DEF <b>{defense}</b>
          </div>
        </div>
      </div>
    </div>
  );
}

function PowerHudIcon({ active, type }: { active: boolean; type: 'magnet' | 'shield' }) {
  const Icon = type === 'magnet' ? Magnet : Shield;
  const color = type === 'magnet' ? 'text-cyan-400' : 'text-yellow-300';
  return (
    <div className="relative h-10 w-10 flex items-center justify-center">
      {active && <div className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-white/20" />}
      <div className={`pointer-events-none relative z-10 rounded-full p-2 ${color}`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
    </div>
  );
}
