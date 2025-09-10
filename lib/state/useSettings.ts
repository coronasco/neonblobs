'use client';
import { create } from 'zustand';

interface SettingsState {
  sound: boolean;
  haptics: boolean;
  setSound: (v: boolean) => void;
  setHaptics: (v: boolean) => void;
}

export const useSettings = create<SettingsState>((set) => ({
  sound: true,
  haptics: true,
  setSound: (v) => set({ sound: v }),
  setHaptics: (v) => set({ haptics: v }),
}));
