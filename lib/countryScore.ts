'use client';

import { supabase } from '@/lib/supabaseClient';

let buffer = 0;
let scheduled = false;

export async function enqueueCountryDelta(userId: string | null, delta: number): Promise<void> {
  if (!userId) return;               // doar userii logați contribuie
  if (!delta || delta <= 0) return;
  buffer += delta;

  if (scheduled) return;
  scheduled = true;

  setTimeout(async () => {
    const take = buffer;
    buffer = 0;
    scheduled = false;
    if (take <= 0) return;
    await supabase.rpc('add_country_points', { p_user: userId, p_delta: take });
  }, 1500); // trimite la 1.5s în batch
}

export async function setUserCountry(userId: string | null, cc: string): Promise<void> {
  if (!userId) {
    localStorage.setItem('nb_country', cc.toUpperCase());
    return;
  }
  await supabase.rpc('set_user_country', { p_user: userId, p_country: cc.toUpperCase() });
}
