'use client';
import { create } from 'zustand';
import { supabase } from '@/lib/supabaseClient';

export type OutlineId =
  | 'cyan' | 'magenta' | 'lime' | 'gold'
  | 'neoRing' | 'holoGlass' | 'circuit' | 'hex' | 'tiger' | 'aurora';

export type TrailId =
  | 'neon' | 'pixel'
  | 'plasma' | 'circuitTrail' | 'comet' | 'holoTrail';

export type CosmeticKind = 'outline' | 'trail';

export interface CosmeticItem {
  id: OutlineId | TrailId;
  kind: CosmeticKind;
  name: string;
  description: string;
  meta?: Record<string, unknown>;
  animated?: boolean; // premium = non-craftable
}

interface CosmeticsState {
  // remote state (per user)
  loaded: boolean;
  userId: string | null;

  owned: {
    outline: Record<OutlineId, boolean>;
    trail: Record<TrailId, boolean>;
  };
  equipped: {
    outline: OutlineId | null;
    trail: TrailId | null;
  };
  shards: number;
  catalog: CosmeticItem[];

  // actions
  hydrate: (userId: string | null) => Promise<void>;
  buy: (id: OutlineId | TrailId) => Promise<void>;
  equip: (kind: CosmeticKind, id: OutlineId | TrailId) => Promise<void>;
  isOwned: (id: OutlineId | TrailId) => boolean;
  isCraftable: (id: OutlineId | TrailId) => boolean;

  addShards: (n: number) => Promise<number | null>;
  spendShards: (n: number) => Promise<number | null>;
  craftRandom: (cost?: number) => Promise<CosmeticItem | null>;
}

const catalog: CosmeticItem[] = [
  // outlines (craftable)
  { id: 'cyan',    kind: 'outline', name: 'Cyan Edge',    description: 'Classic neon cyan outline', animated: false },
  { id: 'magenta', kind: 'outline', name: 'Magenta Edge', description: 'Neon magenta outline',      animated: false },
  { id: 'lime',    kind: 'outline', name: 'Lime Edge',    description: 'Neon lime outline',         animated: false },
  { id: 'gold',    kind: 'outline', name: 'Gold Edge',    description: 'Bright golden outline',     animated: false },

  // outlines premium (animated)
  { id: 'neoRing',   kind: 'outline', name: 'Neo Ring',     description: 'Pulsing concentric rings',     animated: true },
  { id: 'holoGlass', kind: 'outline', name: 'Holo Glass',   description: 'Holographic glass highlight',   animated: true },
  { id: 'circuit',   kind: 'outline', name: 'Circuit Edge', description: 'Tech circuit strokes',          animated: true },
  { id: 'hex',       kind: 'outline', name: 'Hex Mesh',     description: 'Honeycomb rim',                 animated: true },
  { id: 'tiger',     kind: 'outline', name: 'Tiger Stripes',description: 'Kinetic stripes',               animated: true },
  { id: 'aurora',    kind: 'outline', name: 'Aurora',       description: 'Shifting polar gradient',       animated: true },

  // trails craftable
  { id: 'neon',  kind: 'trail', name: 'Neon Trail',  description: 'Smooth cyan→gold', animated: false },
  { id: 'pixel', kind: 'trail', name: 'Pixel Trail', description: 'Retro squares',    animated: false },

  // trails premium (animated)
  { id: 'plasma',      kind: 'trail', name: 'Plasma',         description: 'Organic pulsing band', animated: true },
  { id: 'circuitTrail',kind: 'trail', name: 'Circuit',        description: 'Segmented tech line',  animated: true },
  { id: 'comet',       kind: 'trail', name: 'Comet',          description: 'Bright head + tail',   animated: true },
  { id: 'holoTrail',   kind: 'trail', name: 'Holo',           description: 'Additive hologram',    animated: true },
];

const emptyOwned = {
  outline: { cyan: false, magenta: false, lime: false, gold: false, neoRing: false, holoGlass: false, circuit: false, hex: false, tiger: false, aurora: false } as Record<OutlineId, boolean>,
  trail:   { neon: false, pixel: false, plasma: false, circuitTrail: false, comet: false, holoTrail: false } as Record<TrailId, boolean>,
};

export const useCosmetics = create<CosmeticsState>()((set, get) => ({
  loaded: false,
  userId: null,
  owned: structuredClone(emptyOwned),
  equipped: { outline: null, trail: null },
  shards: 0,
  catalog,

  // ===== Hydrate from Supabase =====
  hydrate: async (userId) => {
    set({ loaded: false, userId });

    if (!userId) {
      // guest: default free items (cyan + neon)
      const guestOwned = structuredClone(emptyOwned);
      guestOwned.outline.cyan = true;
      guestOwned.trail.neon = true;
      set({
        owned: guestOwned,
        equipped: { outline: 'cyan', trail: 'neon' },
        shards: 0,
        loaded: true,
      });
      return;
    }

    // 1) ensure profile + wallet row
    await supabase.from('profiles').upsert({ id: userId }, { onConflict: 'id' });
    await supabase.from('wallets').upsert({ user_id: userId }, { onConflict: 'user_id' });

    // 2) fetch wallet
    const { data: wallet } = await supabase
      .from('wallets')
      .select('shards')
      .eq('user_id', userId)
      .maybeSingle();

    // 3) fetch owned
    const { data: ownedRows } = await supabase
      .from('cosmetics_owned')
      .select('item_id, kind')
      .eq('user_id', userId);

    const o = structuredClone(emptyOwned);
    for (const row of ownedRows ?? []) {
    if (row.kind === 'outline') {
      const key = row.item_id as OutlineId;
      if (key in o.outline) o.outline[key] = true;
    } else if (row.kind === 'trail') {
      const key = row.item_id as TrailId;
      if (key in o.trail) o.trail[key] = true;
    }
    }
    // guarantee starter freebies:
    o.outline.cyan = true;
    o.trail.neon = true;

    // 4) equipped
    const { data: eqRow } = await supabase
      .from('cosmetics_equipped')
      .select('outline_id, trail_id')
      .eq('user_id', userId)
      .maybeSingle();

    set({
      owned: o,
      equipped: {
        outline: (eqRow?.outline_id as OutlineId) ?? 'cyan',
        trail: (eqRow?.trail_id as TrailId) ?? 'neon',
      },
      shards: wallet?.shards ?? 0,
      loaded: true,
    });

  },

  isOwned: (id) => {
    const item = get().catalog.find((c) => c.id === id);
    if (!item) return false;
    if (item.kind === 'outline') return !!get().owned.outline[id as OutlineId];
    return !!get().owned.trail[id as TrailId];
  },

  isCraftable: (id) => {
    const it = get().catalog.find((c) => c.id === id);
    return !!it && it.animated !== true;
  },

  // ===== Buy (FREE for now) =====
  buy: async (id) => {
    const item = get().catalog.find((c) => c.id === id);
    if (!item) return;
    const uid = get().userId;

    if (!uid) {
      // guest mode: local only
      const owned = structuredClone(get().owned);
      if (item.kind === 'outline') owned.outline[id as OutlineId] = true;
      else owned.trail[id as TrailId] = true;
      set({ owned });
      return;
    }

    await supabase.from('cosmetics_owned').upsert({ user_id: uid, item_id: String(id), kind: item.kind });
    // local reflect
    const owned = structuredClone(get().owned);
    if (item.kind === 'outline') owned.outline[id as OutlineId] = true;
    else owned.trail[id as TrailId] = true;
    set({ owned });
  },

  // ===== Equip =====
  equip: async (kind, id) => {
    const uid = get().userId;
    if (!get().isOwned(id)) return;

    if (!uid) {
      // guest
      if (kind === 'outline') set((s) => ({ equipped: { ...s.equipped, outline: id as OutlineId } }));
      else set((s) => ({ equipped: { ...s.equipped, trail: id as TrailId } }));
      return;
    }

    const eq = kind === 'outline'
      ? { outline_id: String(id), trail_id: get().equipped.trail ?? null }
      : { outline_id: get().equipped.outline ?? null, trail_id: String(id) };

    await supabase.from('cosmetics_equipped').upsert({ user_id: uid, ...eq }, { onConflict: 'user_id' });

    set((s) => ({
      equipped: {
        outline: (eq.outline_id as OutlineId) ?? s.equipped.outline,
        trail: (eq.trail_id as TrailId) ?? s.equipped.trail,
      }
    }));
  },

  // ===== Shards RPC =====
  addShards: async (n) => {
    const { data, error } = await supabase.rpc('add_shards', { delta: Math.max(0, Math.floor(n)) });
    if (!error) set({ shards: data ?? get().shards });
    return error ? null : (data as number);
  },

  spendShards: async (n) => {
    const { data, error } = await supabase.rpc('spend_shards', { cost: Math.max(0, Math.floor(n)) });
    if (!error && data !== null) set({ shards: data as number });
    return error ? null : (data as number | null);
  },

  // ===== Craft (non-animated only) =====
  craftRandom: async (cost = 10) => {
    const uid = get().userId;
    if (!uid) return null;

    // build pool: not owned & non-animated
    const pool = get().catalog.filter((c) => !get().isOwned(c.id) && c.animated !== true);
    if (pool.length === 0) return null;

    // try spend shards (atomic)
    const left = await get().spendShards(cost);
    if (left === null) return null; // not enough

    const unlocked = pool[Math.floor(Math.random() * pool.length)];
    const { error } = await supabase.from('cosmetics_owned').upsert({
      user_id: uid, item_id: String(unlocked.id), kind: unlocked.kind,
    });
    if (error) {
      // refund on failure
      await get().addShards(cost);
      return null;
    }

    // reflect locally
    const owned = structuredClone(get().owned);
    if (unlocked.kind === 'outline') owned.outline[unlocked.id as OutlineId] = true;
    else owned.trail[unlocked.id as TrailId] = true;

    // auto-equip same kind
    await get().equip(unlocked.kind, unlocked.id);

    set({ owned });
    return unlocked;
  },
}));
