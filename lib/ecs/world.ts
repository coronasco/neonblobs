// lib/ecs/world.ts
import type { World, Entity } from './types';

export function createWorld(): World {
  return {
    nextId: 1,

    pos: new Map(),
    vel: new Map(),
    rad: new Map(),
    col: new Map(),

    health: new Map(),

    player: new Map(),
    particle: new Map(),
    powerup: new Map(),
    bullet: new Map(),
    supply: new Map(),
  };
}

/** rezervă un ID nou (nu atașează componente) */
export function spawn(w: World): Entity {
  const id = w.nextId++;
  return id;
}

/** șterge complet o entitate din toate componentele */
export function removeEntity(w: World, e: Entity): void {
  w.player.delete(e);
  w.particle.delete(e);
  w.powerup.delete(e);
  w.bullet.delete(e);
  w.supply.delete(e);

  w.health.delete(e);

  w.pos.delete(e);
  w.vel.delete(e);
  w.rad.delete(e);
  w.col.delete(e);
}
