// lib/state/useProgress.ts
'use client';
import { create } from 'zustand';
import { loadProgress, addXpServer, saveProgress, type ProgressRow } from '@/lib/db/progress';
import { supabase } from '@/lib/supabaseClient';

type ProgressState = {
  loaded: boolean;
  userId?: string | null;
  level: number;
  xp: number;
  attack: number;
  defense: number;
  maxHp: number;
  hydrate: () => Promise<void>;
  addXp: (delta: number) => Promise<void>;
  patchStats: (patch: Partial<{ attack: number; defense: number; max_hp: number }>) => Promise<void>;
};

export const useProgress = create<ProgressState>((set, get) => ({
  loaded: false,
  userId: null,
  level: 1,
  xp: 0,
  attack: 10,
  defense: 0,
  maxHp: 100,

  hydrate: async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user ?? null;
    set({ userId: user?.id ?? null });

    // guest fallback → HUD activ, valori implicite
    if (!user?.id) {
      set({ loaded: true, level: 1, xp: 0, attack: 10, defense: 0, maxHp: 100 });
      return;
    }

    const row = await loadProgress(user.id);
    set({
      loaded: true,
      level: row.level,
      xp: row.xp,
      attack: row.attack,
      defense: row.defense,
      maxHp: row.max_hp,
    });
  },

  addXp: async (delta: number) => {
    const userId = get().userId;
    if (!userId) {
      // guest mode – simulează local
      let xp = Math.max(0, get().xp + delta);
      let level = get().level;
      while (xp >= 100) { xp -= 100; level += 1; }
      set({ xp, level });
      return;
    }
    const next = await addXpServer(userId, delta);
    set({ xp: next.xp, level: next.level });
  },

  patchStats: async (patch) => {
    const userId = get().userId;
    if (!userId) {
      set({
        attack: patch.attack ?? get().attack,
        defense: patch.defense ?? get().defense,
        maxHp: patch.max_hp ?? get().maxHp,
      });
      return;
    }
    const p: ProgressRow = {
      user_id: userId,
      level: get().level,
      xp: get().xp,
      attack: patch.attack ?? get().attack,
      defense: patch.defense ?? get().defense,
      max_hp: patch.max_hp ?? get().maxHp,
    };
    await saveProgress(p);
    set({ attack: p.attack, defense: p.defense, maxHp: p.max_hp });
  },
}));
