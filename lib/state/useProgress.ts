// lib/state/useProgress.ts
'use client';

import { create } from 'zustand';
import {
  loadProgress,
  addXpServer,
  saveProgress,
  type ProgressRow,
  patchStatsServer,
} from '@/lib/db/progress';
import { supabase } from '@/lib/supabaseClient';

type ProgressState = {
  loaded: boolean;
  userId?: string | null;
  level: number;
  xp: number;
  attack: number;
  defense: number;
  // maxHp este doar local (schema dată nu are coloană pentru max_hp)
  maxHp: number;

  hydrate: () => Promise<void>;
  addXp: (delta: number) => Promise<void>;
  patchStats: (patch: Partial<{ attack: number; defense: number; max_hp: number }>) => Promise<void>;
};

const DEFAULT_MAX_HP = 100;

export const useProgress = create<ProgressState>((set, get) => ({
  loaded: false,
  userId: null,
  level: 1,
  xp: 0,
  attack: 10,
  defense: 5,
  maxHp: DEFAULT_MAX_HP,

  hydrate: async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user ?? null;
    set({ userId: user?.id ?? null });

    // Guest fallback
    if (!user?.id) {
      set({
        loaded: true,
        level: 1,
        xp: 0,
        attack: 10,
        defense: 5,
        maxHp: DEFAULT_MAX_HP,
      });
      return;
    }

    const row = await loadProgress(user.id);
    set({
      loaded: true,
      level: row.level,
      xp: row.xp,
      attack: row.attack,
      defense: row.defense,
      maxHp: DEFAULT_MAX_HP,
    });
  },

  addXp: async (delta: number) => {
    const userId = get().userId;

    // Guest: doar local
    if (!userId) {
      let xp = Math.max(0, get().xp + Math.floor(delta));
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

    // Guest: doar local
    if (!userId) {
      set({
        attack: patch.attack ?? get().attack,
        defense: patch.defense ?? get().defense,
        maxHp: patch.max_hp ?? get().maxHp,
      });
      return;
    }

    const next = await patchStatsServer(userId, {
      attack: patch.attack,
      defense: patch.defense,
    });

    set({
      attack: next.attack,
      defense: next.defense,
      maxHp: patch.max_hp ?? get().maxHp,
    });
  },
}));
