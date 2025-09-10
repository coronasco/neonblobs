import type { World, Entity } from './types';


export const setPos = (w: World, e: Entity, x: number, y: number) => w.pos.set(e, { x, y });
export const setVel = (w: World, e: Entity, x: number, y: number) => w.vel.set(e, { x, y });
export const setRad = (w: World, e: Entity, r: number) => w.rad.set(e, { r });
export const setColor = (w: World, e: Entity, a: number, b: number, g: number) => w.col.set(e, { a, b, g });