export const GAME = {
    WIDTH: 1280,
    HEIGHT: 720,
    TPS: 60,
    MAX_PARTICLES: 240,
    START_RADIUS: 18,
    DASH_LOSS: 0.02,
    BOT_TARGET_POP: 24
  } as const;
  
  // Dimensiuni hartă (mai mare decât viewport); fără wrap
  export const MAP = {
    WIDTH: 2000,
    HEIGHT: 1200,
    WRAP: false
  } as const;
  
  // Zone „hotspot” care generează multe resurse
  export const HOTSPOTS = [
    { x: 500,  y: 350,  r: 140, spawnRate: 1.2 },  // orbe/second
    { x: 1500, y: 800,  r: 160, spawnRate: 1.0 },
    { x: 1000, y: 600,  r: 200, spawnRate: 0.7 }   // central, mai mare
  ] as const;
  
  // Lista de țări suportate în MVP (poți extinde ușor)
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
  