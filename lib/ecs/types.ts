export type Entity = number;

export interface Position { x: number; y: number; }
export interface Velocity { x: number; y: number; }
export interface Radius { r: number; }
export interface Color { a: number; b: number; g: number; }

export interface Player {
  id: string;
  country?: string;
  isBot?: boolean;
  ability: 'dash' | 'shield';
  cooldown: number;       // dash cd (sec)
  invuln?: number;        // invuln pe respawn
  score: number;
  alive: boolean;

  // combo
  combo?: number;         // 1..3
  comboT?: number;        // sec

  // power-ups
  magnetT?: number;       // sec rămas (atrage particule)
  shieldT?: number;       // sec rămas (nu poate fi absorbit)
  fireCD?: number;        // sec până poate trage din nou
}

export type ParticleKind = 'normal' | 'super' | 'boss';

export interface Particle {
  value: number;
  kind?: ParticleKind;
}

export type PowerUpKind = 'magnet' | 'shield';

export interface PowerUp {
  kind: PowerUpKind;
  ttl: number; // despawn timer (sec)
}

export interface Bullet {
  owner: Entity;
  dmg: number;   // “aria echivalentă” pe care o scade
  life: number;  // secunde
}

export interface World {
  nextId: number;
  pos: Map<Entity, Position>;
  vel: Map<Entity, Velocity>;
  rad: Map<Entity, Radius>;
  col: Map<Entity, Color>;
  player: Map<Entity, Player>;
  particle: Map<Entity, Particle>;
  powerup: Map<Entity, PowerUp>;
  bullet: Map<Entity, Bullet>;
}
