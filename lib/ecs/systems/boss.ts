// lib/ecs/systems/boss.ts
import { BOSS, HOTSPOTS } from '@/lib/config';
import type { World, Entity } from '../types';

type Candidate = { e: Entity; d: number; x: number; y: number };

// alegem un interval random între INTERVAL_MIN și INTERVAL_MAX
function nextInterval(): number {
  const min = BOSS.INTERVAL_MIN ?? 480; // fallback ~8 min
  const max = BOSS.INTERVAL_MAX ?? 720; // fallback ~12 min
  return min + Math.random() * Math.max(1, max - min);
}

let timer: number = nextInterval();
let bossId: Entity | null = null;
let bossT = 0;
let target: { x: number; y: number } | null = null;
let fireCD = 0;

export function bossSystem(w: World, dt: number): void {
  if (bossId !== null) {
    bossT -= dt;
    fireCD = Math.max(0, fireCD - dt);

    const pos = w.pos.get(bossId);
    const vel = w.vel.get(bossId);
    if (!pos || !vel) { bossId = null; return; }

    // plimbare ușoară în interiorul unui hotspot
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

    // țintim cel mai apropiat player în range
    let best: Candidate | null = null;
    w.player.forEach((pl, e) => {
      if (!pl.alive) return;
      const p = w.pos.get(e);
      if (!p) return;
      const ddx = p.x - pos.x;
      const ddy = p.y - pos.y;
      const dist = Math.hypot(ddx, ddy);
      if (dist <= (BOSS.AGGRO_RANGE ?? 620)) {
        if (!best || dist < best.d) best = { e, d: dist, x: p.x, y: p.y };
      }
    });

    if (best && fireCD <= 0) {
      const vx = (best.x - pos.x) / best.d;
      const vy = (best.y - pos.y) / best.d;
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

    if (bossT <= 0) {
      bossId = null;
      timer = nextInterval();
    }
    return;
  }

  // inactiv → așteaptă următorul spawn
  timer -= dt;
  if (timer > 0) return;

  // spawn boss într-un hotspot
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
  fireCD = 1.2; // mic delay înainte de primul foc
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
  // owner negativ => nu există în w.player; e tratat ca non-player în bullets.ts
  w.bullet.set(e, { owner: (-1 as unknown as Entity), dmg, life: 2.5 });
}
