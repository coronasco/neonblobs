// lib/db/progress.ts
import { supabase } from '@/lib/supabaseClient';

/**
 * Schema folosită (conform mesajului tău):
 *
 *  - player_progress(user_id uuid PK, xp bigint, level int, last_level_up timestamptz, updated_at timestamptz)
 *  - player_stats(user_id uuid PK, attack int, defense int, updated_at timestamptz)
 *
 * Notă: max_hp NU există în schema ta, așa că rămâne o valoare derivată/locală în client.
 */

export type ProgressRow = {
  user_id: string;
  level: number;
  xp: number;
  attack: number;
  defense: number;
  // max_hp: doar pe client; nu e salvat în DB conform schemei furnizate
};

const DEFAULT_PROGRESS = { level: 1, xp: 0 } as const;
const DEFAULT_STATS = { attack: 10, defense: 5 } as const;

async function ensureRow(
  table: 'player_progress' | 'player_stats',
  user_id: string,
  defaults: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', user_id)
    .maybeSingle();

  // PGRST116: not found (for maybeSingle)
  if (error && (error as { code?: string }).code !== 'PGRST116') throw error;

  if (!data) {
    const { error: upsertErr } = await supabase.from(table).upsert({
      user_id,
      ...defaults,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>);
    if (upsertErr) throw upsertErr;
  }
}

/** Încarcă progres + stats și creează rânduri implicite dacă lipsesc. */
export async function loadProgress(user_id: string): Promise<ProgressRow> {
  await ensureRow('player_progress', user_id, DEFAULT_PROGRESS);
  await ensureRow('player_stats', user_id, DEFAULT_STATS);

  const { data: prog, error: e1 } = await supabase
    .from('player_progress')
    .select('xp, level')
    .eq('user_id', user_id)
    .maybeSingle();
  if (e1) throw e1;

  const { data: stats, error: e2 } = await supabase
    .from('player_stats')
    .select('attack, defense')
    .eq('user_id', user_id)
    .maybeSingle();
  if (e2) throw e2;

  return {
    user_id,
    level: (prog?.level as number) ?? DEFAULT_PROGRESS.level,
    xp: (prog?.xp as number) ?? DEFAULT_PROGRESS.xp,
    attack: (stats?.attack as number) ?? DEFAULT_STATS.attack,
    defense: (stats?.defense as number) ?? DEFAULT_STATS.defense,
  };
}

/** Salvează nivel/xp și stats – împărțite pe tabelele corecte. */
export async function saveProgress(p: ProgressRow): Promise<void> {
  const nowIso = new Date().toISOString();

  const { error: e1 } = await supabase.from('player_progress').upsert({
    user_id: p.user_id,
    level: p.level,
    xp: p.xp,
    updated_at: nowIso,
  } as Record<string, unknown>);
  if (e1) throw e1;

  const { error: e2 } = await supabase.from('player_stats').upsert({
    user_id: p.user_id,
    attack: p.attack,
    defense: p.defense,
    updated_at: nowIso,
  } as Record<string, unknown>);
  if (e2) throw e2;
}

/** Adaugă XP cu logică de level-up pe client și persistă în player_progress. */
export async function addXpServer(user_id: string, delta: number): Promise<ProgressRow> {
  const curr = await loadProgress(user_id);
  const nextTotal = Math.max(0, curr.xp + Math.floor(delta));

  // leveling simplu: +1 level la fiecare 100 XP
  let level = curr.level;
  let xp = nextTotal;
  while (xp >= 100) { xp -= 100; level += 1; }

  const updated: ProgressRow = { ...curr, xp, level };
  await saveProgress(updated);
  return updated;
}

/** Patch pentru stats (attack/defense) – persistă în player_stats. */
export async function patchStatsServer(
  user_id: string,
  patch: Partial<Pick<ProgressRow, 'attack' | 'defense'>>
): Promise<ProgressRow> {
  const curr = await loadProgress(user_id);
  const next: ProgressRow = {
    ...curr,
    attack: patch.attack ?? curr.attack,
    defense: patch.defense ?? curr.defense,
  };
  await saveProgress(next);
  return next;
}
