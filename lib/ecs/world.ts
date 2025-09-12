import type { World, Entity } from './types';

/** Creează world-ul cu TOATE map-urile inițializate */
export function createWorld(): World {
  return {
    nextId: 1,
    pos: new Map(),
    vel: new Map(),
    rad: new Map(),
    col: new Map(),
    player: new Map(),
    particle: new Map(),
    powerup: new Map(),   // ✅ nou
    bullet: new Map(),    // ✅ nou
    supply: new Map(),    // ✅ nou
    health: new Map(), 
  };
}

/** Rezervă un ID nou (nu atașează componente) */
export function spawn(w: World): Entity {
  const id = w.nextId++;
  return id;
}

/** Șterge complet o entitate din toate componentele */
export function removeEntity(w: World, e: Entity): void {
  w.player.delete(e);
  w.particle.delete(e);
  w.powerup.delete(e);  // ✅ nou
  w.bullet.delete(e);   // ✅ nou
  w.pos.delete(e);
  w.vel.delete(e);
  w.rad.delete(e);
  w.col.delete(e);
  w.health.delete(e);
}
