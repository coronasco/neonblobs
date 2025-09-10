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
  cooldown: number;
  invuln?: number;
  score: number;
  alive: boolean;
  combo?: number;      // 1,2,3
  comboT?: number;     // secunde rămase în fereastra de combo
}

export interface Particle {
  value: number;
  kind?: 'normal' | 'super';
}

export interface World {
  nextId: number;
  pos: Map<Entity, Position>;
  vel: Map<Entity, Velocity>;
  rad: Map<Entity, Radius>;
  col: Map<Entity, Color>;
  player: Map<Entity, Player>;
  particle: Map<Entity, Particle>;
}
