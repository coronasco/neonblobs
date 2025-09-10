import { create } from 'zustand';

interface InputState { up: boolean; down: boolean; left: boolean; right: boolean; dash: boolean; }

interface UIState {
  score: number;
  level: number;
  leaderboard: Array<{ name: string; score: number }>;
  dashCooldown?: number; // 0..1 (0 = gata de folosit)
}

interface CountryScore { [code: string]: number; }

interface GameStore {
  input: InputState;
  ui: UIState;
  country?: string;
  countryScores: CountryScore;

  setInput: (patch: Partial<InputState>) => void;
  setUI: (patch: Partial<UIState>) => void;

  setCountry: (code: string) => void;
  addCountryPoints: (code: string | undefined, delta: number) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  input: { up: false, down: false, left: false, right: false, dash: false },
  ui: { score: 0, level: 1, leaderboard: [], dashCooldown: 0 },

  country: undefined,
  countryScores: {},

  setInput: (patch) => set((s) => ({ input: { ...s.input, ...patch } })),
  setUI: (patch) => set((s) => ({ ui: { ...s.ui, ...patch } })),

  setCountry: (code) => set(() => ({ country: code })),
  addCountryPoints: (code, delta) => {
    if (!code || delta <= 0) return;
    set((s) => ({
      countryScores: {
        ...s.countryScores,
        [code]: (s.countryScores[code] ?? 0) + delta
      }
    }));
  }
}));
