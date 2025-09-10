'use client';
import { useGameStore } from '@/lib/state/useGameStore';

export default function CountryLeaderboard(): React.ReactElement {
  const scores = useGameStore((s) => s.countryScores);
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (!sorted.length) return (
    <div className="mx-auto mt-4 w-[1280px] text-center text-white/60">
      Joacă pentru țara ta – punctele vor apărea aici.
    </div>
  );

  return (
    <div className="mx-auto mt-4 w-[1280px]">
      <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
        <div className="mb-2 text-sm uppercase tracking-wider text-white/60">Top Countries</div>
        <div className="grid grid-cols-5 gap-2 text-sm text-white/90">
          {sorted.map(([code, pts], i) => (
            <div key={code} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/10">
              <span>{i + 1}. {code}</span>
              <span className="font-semibold">{pts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
