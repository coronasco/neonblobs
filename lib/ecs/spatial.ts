import type { World, Entity } from './types';

export interface Grid {
  size: number;
  cells: Map<string, Entity[]>;
}
function key(x: number, y: number) { return `${x},${y}`; }

export function buildGrid(w: World, cellSize = 64): Grid {
  const g: Grid = { size: cellSize, cells: new Map() };
  const insert = (e: Entity, x: number, y: number) => {
    const gx = Math.floor(x / cellSize), gy = Math.floor(y / cellSize);
    const k = key(gx, gy);
    if (!g.cells.has(k)) g.cells.set(k, []);
    g.cells.get(k)!.push(e);
  };
  w.pos.forEach((p, e) => { insert(e, p.x, p.y); });
  return g;
}
export function nearbyEntities(g: Grid, x: number, y: number): Entity[] {
  const gx = Math.floor(x / g.size), gy = Math.floor(y / g.size);
  const out: Entity[] = [];
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
    const k = key(gx + dx, gy + dy);
    if (g.cells.has(k)) out.push(...g.cells.get(k)!);
  }
  return out;
}
