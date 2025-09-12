// lib/db/stats.ts
import { supabase } from '@/lib/supabaseClient';

export type StatsRow = {
  user_id: string;
  kills: number;
  deaths: number;
  damage_done: number;
  play_time_s: number;
};

export async function loadStats(userId: string): Promise<StatsRow> {
  const { data, error } = await supabase
    .from('player_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;

  if (!data) {
    const seed: StatsRow = { user_id: userId, kills: 0, deaths: 0, damage_done: 0, play_time_s: 0 };
    const { error: upErr } = await supabase.from('player_stats').upsert(seed);
    if (upErr) throw upErr;
    return seed;
  }
  return data as StatsRow;
}

export async function bumpStats(userId: string, patch: Partial<Omit<StatsRow, 'user_id'>>) {
  const curr = await loadStats(userId);
  const next = {
    ...curr,
    ...Object.fromEntries(
      Object.entries(patch).map(([k, v]) => [k, Math.max(0, (curr[k as keyof StatsRow] as number) + (v as number))])
    ),
  };
  const { error } = await supabase.from('player_stats').upsert({
    ...next,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
