// lib/state/useGameStore.ts
import { create } from 'zustand';

/** Input flags pe care le poți folosi dacă vrei să treci inputul prin store */
export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  dash: boolean;
  fire?: boolean;
}

/** Informații pentru HUD despre Boss */
export type BossUI = {
  active: boolean;
  t: number;     // secunde rămase
  tMax: number;  // durata totală
};

/** UI agregat pentru HUD */
export interface UIState {
  score: number;
  level: number;
  leaderboard: Array<{ name: string; score: number }>;
  dashCooldown?: number;   // 0..1 (0 = gata)
  combo?: number;          // 1..3
  hp?: number;
  maxHp?: number;
  attack?: number;
  defense?: number;
  boss?: BossUI;           // <- important pt. bannerul de boss
}

type FeedItem = { id: number; text: string; t: number }; // t = secunde până dispare

interface CountryScore { [code: string]: number; }

interface GameStore {
  // State
  input: InputState;
  ui: UIState;
  country?: string;
  countryScores: CountryScore;
  killFeed: FeedItem[];

  // Actions
  setInput: (patch: Partial<InputState>) => void;
  setUI: (patch: Partial<UIState>) => void;

  setCountry: (code: string) => void;
  addCountryPoints: (code: string | undefined, delta: number) => void;

  pushFeed: (text: string) => void;
  tickFeed: (dt: number) => void;
}

let feedCounter = 1;

export const useGameStore = create<GameStore>((set) => ({
  // --- Initial state ---
  input: { up: false, down: false, left: false, right: false, dash: false, fire: false },

  ui: {
    score: 0,
    level: 1,
    leaderboard: [],
    dashCooldown: 0,
    combo: 1,
    boss: { active: false, t: 0, tMax: 0 },
  },

  country: undefined,
  countryScores: {},

  killFeed: [],

  // --- Actions ---
  setInput: (patch) =>
    set((s) => ({ input: { ...s.input, ...patch } })),

  // IMPORTANT: merge parțial, să nu pierzi câmpurile (ex: boss)
  setUI: (patch) =>
    set((s) => ({ ui: { ...s.ui, ...patch } })),

  setCountry: (code) =>
    set(() => {
      try {
        // păstrează și în localStorage ca să fie recuperat la guest
        localStorage.setItem('nb_country', code);
      } catch {}
      return { country: code };
    }),

  addCountryPoints: (code, delta) => {
    if (!code || delta <= 0) return;
    set((s) => ({
      countryScores: {
        ...s.countryScores,
        [code]: (s.countryScores[code] ?? 0) + delta,
      },
    }));
  },

  pushFeed: (text) =>
    set((s) => ({
      // ținem max 8 mesaje ca să nu încărcăm UI-ul
      killFeed: [{ id: feedCounter++, text, t: 5 }, ...s.killFeed].slice(0, 8),
    })),

  tickFeed: (dt) =>
    set((s) => ({
      killFeed: s.killFeed
        .map((f) => ({ ...f, t: f.t - dt }))
        .filter((f) => f.t > 0),
    })),
}));
