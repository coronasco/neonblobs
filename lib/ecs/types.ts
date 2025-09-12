// lib/ecs/types.ts
export type Entity = number;

export interface Position { x: number; y: number; }
export interface Velocity { x: number; y: number; }
export interface Radius   { r: number; }
export interface Color    { a: number; b: number; g: number; }

export interface Health {
  hp: number;
  maxHp: number;
}

export interface Player {
  id: string;
  country?: string;
  isBot?: boolean;

  ability: 'dash' | 'shield';
  cooldown: number;       // dash cooldown (sec)
  invuln?: number;        // invuln pe respawn (sec)
  score: number;
  alive: boolean;

  // combat stats
  attack: number;
  defense: number;

  // combo
  combo?: number;         // 1..3
  comboT?: number;        // sec

  // power-ups
  magnetT?: number;       // sec rămas (atrage particule)
  shieldT?: number;       // sec rămas (nu ia dmg la contact / bullets)
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
  owner: Entity; // -1 = boss
  dmg: number;   // damage “raw” (înainte de defense)
  life: number;  // sec
  bounces?: number;
}

export type SupplyDrop = {
  ttl: number;
  loot: 'magnet' | 'shield' | 'shards';
  amount?: number; // for shards
};

export interface World {
  nextId: number;

  pos: Map<Entity, Position>;
  vel: Map<Entity, Velocity>;
  rad: Map<Entity, Radius>;
  col: Map<Entity, Color>;

  health: Map<Entity, Health>;

  player: Map<Entity, Player>;
  particle: Map<Entity, Particle>;
  powerup: Map<Entity, PowerUp>;
  bullet: Map<Entity, Bullet>;
  supply: Map<Entity, SupplyDrop>;
}
