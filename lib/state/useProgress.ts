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
  setStats: (patch: Partial<Pick<ProgressRow, 'attack'|'defense'|'max_hp'>>) => Promise<void>;
};

export const useProgress = create<ProgressState>((set, get) => ({
  loaded: false,
  userId: undefined,
  level: 1,
  xp: 0,
  attack: 10,
  defense: 5,
  maxHp: 100,

  hydrate: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id ?? null;
    set({ userId });

    if (!userId) { set({ loaded: true }); return; }

    const p = await loadProgress(userId);
    set({
      level: p.level, xp: p.xp, attack: p.attack, defense: p.defense, maxHp: p.max_hp, loaded: true,
    });
  },

  addXp: async (delta) => {
    const userId = get().userId;
    if (!userId) return; // guest → nu salvăm
    const p = await addXpServer(userId, delta);
    set({ level: p.level, xp: p.xp });
  },

  setStats: async (patch) => {
    const userId = get().userId;
    if (!userId) return;
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
