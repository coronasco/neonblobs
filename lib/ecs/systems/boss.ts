import { BOSS, HOTSPOTS } from '@/lib/config';
import type { World, Entity } from '../types';

let timer = BOSS.INTERVAL * 0.6;
let bossId: Entity | null = null;
let bossT = 0;
let target: { x: number; y: number } | null = null;

export function bossSystem(w: World, dt: number): void {
  // activ → update mișcare / durată
  if (bossId !== null) {
    bossT -= dt;
    const pos = w.pos.get(bossId); const vel = w.vel.get(bossId);
    if (!pos || !vel) { bossId = null; return; }

    // se plimbă încet în interiorul hotspotului țintă
    if (!target) {
      const h = HOTSPOTS[Math.floor(Math.random() * HOTSPOTS.length)];
      target = { x: h.x + (Math.random() - 0.5) * h.r * 0.8, y: h.y + (Math.random() - 0.5) * h.r * 0.8 };
    }
    const dx = (target.x - pos.x), dy = (target.y - pos.y);
    const d = Math.hypot(dx, dy) || 1;
    vel.x = (dx / d) * BOSS.SPEED;
    vel.y = (dy / d) * BOSS.SPEED;
    pos.x += vel.x * dt; pos.y += vel.y * dt;
    if (d < 12) target = null;

    if (bossT <= 0) { // despawn
      // lăsăm să rămână particulă; oricum expiră ca particle normal
      bossId = null;
      timer = BOSS.INTERVAL;
    }
    return;
  }

  // inactiv → contorizăm până la următorul spawn
  timer -= dt;
  if (timer > 0) return;

  const h = HOTSPOTS[Math.floor(Math.random() * HOTSPOTS.length)];
  const e = (w.nextId++);
  const x = h.x, y = h.y;

  w.pos.set(e, { x, y });
  w.vel.set(e, { x: 0, y: 0 });
  w.rad.set(e, { r: BOSS.RADIUS });
  // magenta intens
  w.col.set(e, { a: 1, b: 0.2, g: 0.8 });
  w.particle.set(e, { value: BOSS.VALUE, kind: 'boss' });

  bossId = e;
  bossT = BOSS.DURATION;
  timer = BOSS.INTERVAL + BOSS.DURATION;
}
