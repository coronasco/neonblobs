// lib/ecs/systems/boss.ts
import { BOSS, HOTSPOTS } from '@/lib/config';
import type { World, Entity } from '../types';

function nextInterval(): number {
  const min = BOSS.INTERVAL_MIN ?? 480; // ~8 min
  const max = BOSS.INTERVAL_MAX ?? 720; // ~12 min
  return min + Math.random() * Math.max(1, max - min);
}

let timer: number = nextInterval();
let bossId: Entity | null = null;
let bossT = 0;
let target: { x: number; y: number } | null = null;
let fireCD = 0;

export function bossSystem(w: World, dt: number): void {
  // ===== boss activ =====
  if (bossId !== null) {
    bossT -= dt;
    fireCD = Math.max(0, fireCD - dt);

    const pos = w.pos.get(bossId);
    const vel = w.vel.get(bossId);
    if (!pos || !vel) { bossId = null; return; }

    // mișcare lentă într-un punct țintă dintr-un hotspot
    if (!target) {
      const h = HOTSPOTS[Math.floor(Math.random() * HOTSPOTS.length)];
      target = {
        x: h.x + (Math.random() - 0.5) * h.r * 0.8,
        y: h.y + (Math.random() - 0.5) * h.r * 0.8,
      };
    }
    const dx = (target.x - pos.x);
    const dy = (target.y - pos.y);
    const d  = Math.hypot(dx, dy) || 1;
    vel.x = (dx / d) * (BOSS.SPEED ?? 24);
    vel.y = (dy / d) * (BOSS.SPEED ?? 24);
    pos.x += vel.x * dt;
    pos.y += vel.y * dt;
    if (d < 12) target = null;

    // caută cel mai apropiat player în range (fără 'never')
    let bestE: Entity | null = null;
    let bestX = 0, bestY = 0, bestD = Infinity;

    w.player.forEach((pl, e) => {
      if (!pl.alive) return;
      const p = w.pos.get(e);
      if (!p) return;
      const ddx = p.x - pos.x;
      const ddy = p.y - pos.y;
      const dist = Math.hypot(ddx, ddy);
      if (dist <= (BOSS.AGGRO_RANGE ?? 620) && dist < bestD) {
        bestE = e; bestX = p.x; bestY = p.y; bestD = dist;
      }
    });

    if (bestE !== null && fireCD <= 0 && bestD > 0) {
      const vx = (bestX - pos.x) / bestD;
      const vy = (bestY - pos.y) / bestD;
      spawnBossBullet(
        w,
        pos.x,
        pos.y,
        vx,
        vy,
        (BOSS.BULLET_SPEED ?? 240),
        (BOSS.BULLET_DMG ?? 45)
      );
      const baseCadence = BOSS.SHOOT_EVERY ?? 1.6;
      fireCD = baseCadence * (0.9 + Math.random() * 0.3);
    }

    // expiră boss-ul
    if (bossT <= 0) {
      bossId = null;
      timer = nextInterval();
    }
    return;
  }

  // ===== boss inactiv — countdown până la spawn =====
  timer -= dt;
  if (timer > 0) return;

  // spawn într-un hotspot
  const h = HOTSPOTS[Math.floor(Math.random() * HOTSPOTS.length)];
  const e = (w.nextId++);
  const x = h.x, y = h.y;

  w.pos.set(e, { x, y });
  w.vel.set(e, { x: 0, y: 0 });
  w.rad.set(e, { r: BOSS.RADIUS ?? 34 });
  w.col.set(e, { a: 1, b: 0.2, g: 0.8 }); // magenta intens
  w.particle.set(e, { value: BOSS.VALUE ?? 220, kind: 'boss' });

  bossId = e;
  bossT  = BOSS.DURATION ?? 45;
  timer  = nextInterval();
  fireCD = 1.2; // mic delay până la primul foc
}

function spawnBossBullet(
  w: World,
  x: number,
  y: number,
  dirX: number,
  dirY: number,
  speed: number,
  dmg: number
): void {
  const e = (w.nextId++);
  const d = Math.hypot(dirX, dirY) || 1;
  const vx = (dirX / d) * speed;
  const vy = (dirY / d) * speed;

  w.pos.set(e, { x, y });
  w.vel.set(e, { x: vx, y: vy });
  w.rad.set(e, { r: 4 });
  w.col.set(e, { a: 1, b: 0.3, g: 0.7 }); // roz/violet
  // owner "negativ" => proiectil de boss (nu e în w.player)
  w.bullet.set(e, { owner: (-1 as unknown as Entity), dmg, life: 2.5 });
}
