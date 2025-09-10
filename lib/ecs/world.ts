import type { World, Entity } from './types';


export function createWorld(): World {
    return {
        nextId: 1,
        pos: new Map(),
        vel: new Map(),
        rad: new Map(),
        col: new Map(),
        player: new Map(),
        particle: new Map()
    };
}


export function spawn(w: World): Entity { return w.nextId++; }


export function removeEntity(w: World, e: Entity) {
    w.pos.delete(e); w.vel.delete(e); w.rad.delete(e); w.col.delete(e);
    w.player.delete(e); w.particle.delete(e);
}