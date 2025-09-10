'use client';
import { supabase } from '@/lib/supabaseClient';

/**
 * Creează / menține rândurile de bază pentru user în tabelele noastre.
 * Idempotent: poate fi apelată la fiecare login fără efecte adverse.
 */
export async function ensureUserInit(userId: string): Promise<void> {
  // profiles
  await supabase.from('profiles').upsert({ id: userId }, { onConflict: 'id' });

  // wallets (default shards = 0)
  await supabase.from('wallets').upsert({ user_id: userId }, { onConflict: 'user_id' });

  // equipped (setează fallback-uri dacă nu există)
  const { data: eq } = await supabase
    .from('cosmetics_equipped')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!eq) {
    await supabase.from('cosmetics_equipped').upsert({
      user_id: userId,
      outline_id: 'cyan',
      trail_id: 'neon',
    }, { onConflict: 'user_id' });
  }

  // starter freebies (owned) – cyan + neon
  const owned = await supabase
    .from('cosmetics_owned')
    .select('item_id')
    .eq('user_id', userId);

  const have = new Set((owned.data ?? []).map(r => r.item_id as string));
  const toInsert: Array<{user_id:string; item_id:string; kind:'outline'|'trail'}> = [];
  if (!have.has('cyan')) toInsert.push({ user_id: userId, item_id: 'cyan', kind: 'outline' });
  if (!have.has('neon')) toInsert.push({ user_id: userId, item_id: 'neon', kind: 'trail' });
  if (toInsert.length) {
    await supabase.from('cosmetics_owned').insert(toInsert);
  }
}
