// lib/ecs/systems/powerups.ts
import { MAP, POWERUPS } from '@/lib/config';
import type { World, PowerUpKind } from '../types';

let timer = POWERUPS.SPAWN_EVERY * 0.7;

export function powerupSystem(w: World, dt: number): void {
  // spawn probabilistic
  timer -= dt;
  if (timer <= 0) {
    timer = POWERUPS.SPAWN_EVERY * (0.7 + Math.random() * 0.8);
    const e = (w.nextId++);
    const kind: PowerUpKind = Math.random() < 0.5 ? 'magnet' : 'shield';
    w.pos.set(e, { x: Math.random() * MAP.WIDTH, y: Math.random() * MAP.HEIGHT });
    w.rad.set(e, { r: 12 });
    w.col.set(e, kind === 'magnet' ? { a: 0, b: 0.9, g: 1 } : { a: 1, b: 1, g: 0.2 });
    w.powerup.set(e, { kind, ttl: 25 });
  }

  // decay power-ups pe hartă
  w.powerup.forEach((pu, e) => {
    pu.ttl -= dt;
    if (pu.ttl <= 0) {
      w.powerup.delete(e); w.pos.delete(e); w.rad.delete(e); w.col.delete(e);
    }
  });

  // pickup + efecte
  w.player.forEach((pl, pe) => {
    if (!pl.alive) return;
    const pPos = w.pos.get(pe); const pRad = w.rad.get(pe);
    if (!pPos || !pRad) return;

    // preia power-up când intră în rază
    w.powerup.forEach((pu, e) => {
      const pos = w.pos.get(e)!; const r = w.rad.get(e)!.r;
      const dx = pPos.x - pos.x, dy = pPos.y - pos.y;
      if (dx * dx + dy * dy <= (pRad.r + r) * (pRad.r + r)) {
        if (pu.kind === 'magnet') pl.magnetT = POWERUPS.MAGNET_DURATION;
        else pl.shieldT = POWERUPS.SHIELD_DURATION;
        w.powerup.delete(e); w.pos.delete(e); w.rad.delete(e); w.col.delete(e);
      }
    });

    // === MAGNET homing ===
    if (pl.magnetT && pl.magnetT > 0) {
      const R2 = POWERUPS.MAGNET_RADIUS * POWERUPS.MAGNET_RADIUS;
      const speed = POWERUPS.MAGNET_PULL_SPEED;

      w.particle.forEach((_pa, e) => {
        const pp = w.pos.get(e);
        if (!pp) return;
        const dx = pPos.x - pp.x, dy = pPos.y - pp.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > R2) return;

        const d = Math.sqrt(Math.max(1, d2));
        const step = Math.min(d, speed * dt);
        pp.x += (dx / d) * step;
        pp.y += (dy / d) * step;
      });

      pl.magnetT = Math.max(0, pl.magnetT - dt);
    }

    // SHIELD decay
    if (pl.shieldT && pl.shieldT > 0) pl.shieldT = Math.max(0, pl.shieldT - dt);
  });
}
