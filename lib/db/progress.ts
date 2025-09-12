// lib/db/progress.ts
import { supabase } from '@/lib/supabaseClient';

export type ProgressRow = {
  user_id: string;
  level: number;
  xp: number;
  attack: number;
  defense: number;
  max_hp: number;
};

export async function loadProgress(userId: string): Promise<ProgressRow> {
  const { data, error } = await supabase
    .from('player_progress')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') throw error;

  if (!data) {
    // seed row
    const seed: ProgressRow = { user_id: userId, level: 1, xp: 0, attack: 10, defense: 5, max_hp: 100 };
    const { error: upErr } = await supabase.from('player_progress').upsert(seed);
    if (upErr) throw upErr;
    return seed;
  }
  return data as ProgressRow;
}

export async function saveProgress(p: ProgressRow): Promise<void> {
  const { error } = await supabase.from('player_progress').upsert({
    ...p,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function addXpServer(userId: string, delta: number): Promise<ProgressRow> {
  // simplu: faci atomic din client cu RPC sau upsert în doi pași
  const curr = await loadProgress(userId);
  const nextXp = Math.max(0, curr.xp + delta);
  // leveling simplu: LV up la fiecare 100 XP (ajustează)
  let level = curr.level;
  let xp = nextXp;
  while (xp >= 100) { xp -= 100; level += 1; }

  const updated: ProgressRow = { ...curr, xp, level };
  await saveProgress(updated);
  return updated;
}
