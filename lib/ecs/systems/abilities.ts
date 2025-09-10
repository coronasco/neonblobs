import { GAME } from '@/lib/config';
import type { World } from '../types';

export function tryDash(w: World, e: number, dir: { x: number; y: number }) {
  const pl = w.player.get(e); const r = w.rad.get(e); const v = w.vel.get(e);
  if (!pl || !r || !v) return;
  if (pl.cooldown > 0) return;
  const mag = 420 / Math.max(1, r.r / 16);
  v.x += dir.x * mag; v.y += dir.y * mag;
  r.r = Math.max(6, r.r * (1 - GAME.DASH_LOSS));
  pl.cooldown = 1.25;
}

export function cooldownSystem(w: World, dt: number) {
  w.player.forEach((pl) => {
    pl.cooldown = Math.max(0, pl.cooldown - dt);
    if (pl.invuln && pl.invuln > 0) pl.invuln = Math.max(0, pl.invuln - dt);
  });
}
