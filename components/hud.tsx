'use client';
import { useGameStore } from '@/lib/state/useGameStore';


export default function Hud() {
const { ui } = useGameStore();
return (
<div className="pointer-events-none absolute inset-0">
<div className="p-6 text-4xl font-bold text-neon-cyan drop-shadow-[0_0_10px_rgba(0,229,255,0.8)]">{ui.score}</div>
<div className="absolute right-6 top-6 w-56 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
<div className="mb-2 text-sm uppercase tracking-wider text-white/60">Leaderboard</div>
<ul className="space-y-1 text-white/90">
{ui.leaderboard.slice(0, 5).map((r, i) => (
<li key={r.name} className="flex justify-between text-sm"><span>{i + 1}. {r.name}</span><span>{r.score}</span></li>
))}
</ul>
</div>
</div>
);
}