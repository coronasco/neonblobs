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
  WIDTH: 10000,
  HEIGHT: 6000,
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

// Super Orb event (periodic)
export const SUPER_EVENT = {
  INTERVAL: 50,    // la fiecare ~50s încearcă să pornească un event
  DURATION: 18,    // timp cât rămâne super-orbul pe hartă
  VALUE: 40,       // baza punctelor (mai trece prin hotspot/combos)
  RADIUS: 10,      // mărimea orbului
};

export const POWERUPS = {
  MAGNET_DURATION: 20,
  SHIELD_DURATION: 20,
  SPAWN_EVERY: 12,      // sec — probabilistic
  MAGNET_RADIUS: 260,        // raza de atractie mai mare
  MAGNET_PULL_SPEED: 320,    // ↑ viteză de urmărire (px/s)
  MAGNET_SNAP_DIST: 10,      // la distanța asta "se lipește" de player
};

export const BOSS = {
  // interval aleator 8–12 minute
  INTERVAL_MIN: 480,
  INTERVAL_MAX: 720,
  DURATION: 45,     // stă mai mult pe hartă
  RADIUS: 34,
  VALUE: 220,       // scor mare la kill (absorb)
  SPEED: 24,

  // combat
  AGGRO_RANGE: 620,
  SHOOT_EVERY: 1.6,
  BULLET_SPEED: 240,
  BULLET_DMG: 45,
} as const;

export const UI_FONT = {
  SMALL: '600 12px Arial, Helvetica, sans-serif',
  MEDIUM: '700 14px Arial, Helvetica, sans-serif',
  LARGE: '800 16px Arial, Helvetica, sans-serif',
};

export const SUPPLY = {
  INTERVAL_MIN: 25,     // seconds between spawns (min)
  INTERVAL_MAX: 45,     // seconds between spawns (max)
  TTL: 30,              // seconds the capsule stays on the map
  R: 16,                // visual radius
  SHARDS_MIN: 3,
  SHARDS_MAX: 7,
  POWERUP_CHANCE: 0.6,  // 60% chance to be a power-up, else shards
} as const;