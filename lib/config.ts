export const GAME = {
  WIDTH: 1280,
  HEIGHT: 720,
  TPS: 60,
  MAX_PARTICLES: 900,  // mai multe particule pentru hartă mare
  START_RADIUS: 18,
  DASH_LOSS: 0.02,
  BOT_TARGET_POP: 24
} as const;

// HARTA — mult mai mare; fără wrap
export const MAP = {
  WIDTH: 4000,
  HEIGHT: 2400,
  WRAP: false
} as const;

// Hotspot-uri (coordonate world)
export const HOTSPOTS = [
  { x: 800,  y: 700,  r: 180, spawnRate: 1.4 },
  { x: 2200, y: 1400, r: 220, spawnRate: 1.0 },
  { x: 3400, y: 600,  r: 160, spawnRate: 1.2 },
  { x: 1800, y: 2100, r: 240, spawnRate: 0.8 }
] as const;

export const COUNTRIES = [
  { code: 'RO', name: 'Romania' },
  { code: 'IT', name: 'Italy' },
  { code: 'US', name: 'United States' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'PL', name: 'Poland' }
] as const;

// adaugă la finalul fișierului, sau integrează în obiectele existente:
export const HOTSPOT = {
  NEAR_DIST: 600,     // pentru săgeata de direcție
  BONUS_MULT: 2,      // x2 puncte în hotspot
};
