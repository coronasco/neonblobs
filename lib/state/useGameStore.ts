import { create } from 'zustand';

interface InputState { up: boolean; down: boolean; left: boolean; right: boolean; dash: boolean; fire?: boolean; }

interface UIState {
  score: number;
  level: number;
  leaderboard: Array<{ name: string; score: number }>;
  dashCooldown?: number;   // 0..1 (0 = gata)
  combo?: number;          // 1..3
  hp?: number;
  maxHp?: number;
  attack?: number;
  defense?: number;
}

type FeedItem = { id: number; text: string; t: number }; // t sec până dispare

interface CountryScore { [code: string]: number; }

interface GameStore {
  input: InputState;
  ui: UIState;
  country?: string;
  countryScores: CountryScore;

  killFeed: FeedItem[];

  setInput: (patch: Partial<InputState>) => void;
  setUI: (patch: Partial<UIState>) => void;

  setCountry: (code: string) => void;
  addCountryPoints: (code: string | undefined, delta: number) => void;

  pushFeed: (text: string) => void;
  tickFeed: (dt: number) => void;
}

let feedCounter = 1;

export const useGameStore = create<GameStore>((set) => ({
  input: { up: false, down: false, left: false, right: false, dash: false, fire: false },
  ui: { score: 0, level: 1, leaderboard: [], dashCooldown: 0, combo: 1 },

  country: undefined,
  countryScores: {},

  killFeed: [],

  setInput: (patch) => set((s) => ({ input: { ...s.input, ...patch } })),
  setUI: (patch) => set((s) => ({ ui: { ...s.ui, ...patch } })),

  setCountry: (code) => set(() => ({ country: code })),
  addCountryPoints: (code, delta) => {
    if (!code || delta <= 0) return;
    set((s) => ({
      countryScores: { ...s.countryScores, [code]: (s.countryScores[code] ?? 0) + delta }
    }));
  },

  pushFeed: (text) => set((s) => ({
    killFeed: [{ id: feedCounter++, text, t: 5 }, ...s.killFeed].slice(0, 6),
  })),
  tickFeed: (dt) => set((s) => ({
    killFeed: s.killFeed
      .map((f) => ({ ...f, t: f.t - dt }))
      .filter((f) => f.t > 0),
  })),
}));
