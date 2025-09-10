'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { COUNTRY_NAMES, flagEmoji } from '@/lib/countries';

type Row = { country_code: string; points: number };

export default function CountryLeaderboard(): React.ReactElement {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('country_scores')
      .select('country_code, points')
      .order('points', { ascending: false })
      .limit(25);
    setRows(data ?? []);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-white">
      <div className="mb-2 text-sm font-bold">Country Leaderboard</div>
      {loading ? (
        <div className="py-6 text-center text-sm text-white/60">Loading…</div>
      ) : (
        <ul className="space-y-1">
          {rows.map((r, i) => (
            <li key={r.country_code}
                className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-white/5">
              <span className="flex items-center gap-2">
                <span className="w-6 text-center">{i+1}</span>
                <span className="text-xl">{flagEmoji(r.country_code)}</span>
                <span className="text-sm">{COUNTRY_NAMES[r.country_code] ?? r.country_code}</span>
              </span>
              <span className="text-sm font-semibold">{r.points.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
      <button
        onClick={() => void load()}
        className="mt-3 w-full rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/15"
      >
        Refresh
      </button>
    </div>
  );
}
