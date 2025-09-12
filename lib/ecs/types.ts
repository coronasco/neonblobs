export type Entity = number;

export interface Position { x: number; y: number; }
export interface Velocity { x: number; y: number; }
export interface Radius { r: number; }
export interface Color { a: number; b: number; g: number; }

export interface Player {
  id: string;
  country?: string;
  isBot?: boolean;

  // abilități/temporizatoare
  ability: 'dash' | 'shield';
  cooldown: number;
  invuln?: number;
  fireCD?: number;

  // scor & stare
  score: number;
  alive: boolean;

  // combo
  combo?: number;
  comboT?: number;

  // power-ups
  magnetT?: number;
  shieldT?: number;

  // === STATS noi ===
  attack: number;     // baza de damage a jucătorului
  defense: number;    // reducere de damage a jucătorului
}

export type ParticleKind = 'normal' | 'super' | 'boss';

export interface Particle {
  value: number;
  kind?: ParticleKind;
}

export type PowerUpKind = 'magnet' | 'shield';
export interface PowerUp {
  kind: PowerUpKind;
  ttl: number;
}

export interface Bullet {
  owner: Entity;
  dmg: number;   // damage de bază al proiectilului
  life: number;  // secunde
}

export type SupplyDrop = {
  ttl: number;
  loot: 'magnet' | 'shield' | 'shards';
  amount?: number;
};

/** === Componentă nouă: HEALTH === */
export interface Health {
  hp: number;
  maxHp: number;
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
  supply: Map<Entity, SupplyDrop>;
  health: Map<Entity, Health>;   // <— NOU
}
