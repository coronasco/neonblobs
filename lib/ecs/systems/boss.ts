// lib/ecs/systems/boss.ts
import type { World, Entity } from '../types';
import { BOSS, HOTSPOTS, SUPPLY } from '@/lib/config';
import { removeEntity } from '../world';
import { useGameStore } from '@/lib/state/useGameStore';

// === Status UI (citit din GameCanvas + HUD) ===
export type BossStatus = { active: boolean; timeLeft: number; duration: number };

let bossId: Entity | null = null;
let timeLeft = 0;
let duration = 0;

// spawn cadence
let timer = rand(BOSS.INTERVAL_MIN, BOSS.INTERVAL_MAX);

// AI fire control
let fireCD = 0;

// memorează o țintă de mișcare ca să nu „vibreze”
let target: { x: number; y: number } | null = null;

export function getBossStatus(): BossStatus {
  return { active: bossId !== null, timeLeft: Math.max(0, timeLeft), duration };
}

export function bossSystem(w: World, dt: number): void {
  // dacă avem boss activ -> update/AI
  if (bossId !== null) {
    timeLeft -= dt;
    fireCD = Math.max(0, fireCD - dt);

    const pos = w.pos.get(bossId);
    const vel = w.vel.get(bossId);
    const rad = w.rad.get(bossId);
    if (!pos || !vel || !rad) {
      bossId = null;
      timeLeft = 0;
      duration = 0;
      timer = rand(BOSS.INTERVAL_MIN, BOSS.INTERVAL_MAX);
      return;
    }

    // mișcare lentă între puncte din hotspot-uri
    if (!target) {
      const h = HOTSPOTS[Math.floor(Math.random() * HOTSPOTS.length)];
      target = {
        x: h.x + (Math.random() - 0.5) * h.r * 0.8,
        y: h.y + (Math.random() - 0.5) * h.r * 0.8,
      };
    }
    const dx = (target.x - pos.x), dy = (target.y - pos.y);
    const d = Math.hypot(dx, dy) || 1;
    vel.x = (dx / d) * BOSS.SPEED;
    vel.y = (dy / d) * BOSS.SPEED;
    pos.x += vel.x * dt; pos.y += vel.y * dt;
    if (d < 12) target = null;

    // auto-attack: ținta cea mai apropiată (player sau bot) în range
    type Target = { e: Entity; x: number; y: number; dist: number };
    let best: Target | null = null;

    w.player.forEach((pl, e) => {
      if (!pl.alive) return;
      const pp = w.pos.get(e);
      if (!pp) return;
      const ddx = pp.x - pos.x, ddy = pp.y - pos.y;
      const dist = Math.hypot(ddx, ddy);
      if (dist <= BOSS.AGGRO_RANGE) {
        if (!best || dist < best.dist) best = { e, x: pp.x, y: pp.y, dist };
      }
    });

    if (best && fireCD <= 0) {
      const bestTarget = best as { x: number; y: number; dist: number };
      const vx = (bestTarget.x - pos.x) / (bestTarget.dist || 1);
      const vy = (bestTarget.y - pos.y) / (bestTarget.dist || 1);
      spawnBossBullet(w, pos.x, pos.y, vx, vy, BOSS.BULLET_SPEED, BOSS.BULLET_DMG);
      const baseCadence = BOSS.SHOOT_EVERY;
      fireCD = baseCadence * (0.9 + Math.random() * 0.3);
    }

    // despawn natural
    if (timeLeft <= 0) {
      bossId = null;
      duration = 0;
      timer = rand(BOSS.INTERVAL_MIN, BOSS.INTERVAL_MAX);
    }
    return;
  }

  // nu avem boss → countdown până la următorul spawn
  timer -= dt;
  if (timer > 0) return;

  // spawn
  const e = (w.nextId++);
  const h = HOTSPOTS[Math.floor(Math.random() * HOTSPOTS.length)];
  const x = h.x, y = h.y;

  w.pos.set(e, { x, y });
  w.vel.set(e, { x: 0, y: 0 });
  w.rad.set(e, { r: BOSS.RADIUS });
  w.col.set(e, { a: 1, b: 0.2, g: 0.8 }); // mov
  w.particle.set(e, { value: BOSS.VALUE, kind: 'boss' });

  bossId = e;
  duration = BOSS.DURATION;
  timeLeft = duration;
  timer = rand(BOSS.INTERVAL_MIN, BOSS.INTERVAL_MAX) + BOSS.DURATION;
  target = null;
  fireCD = 0;

  // anunț pe killfeed
  try {
    const { pushFeed } = useGameStore.getState();
    pushFeed?.('⚠️ BOSS spawned! Find it and fight!');
  } catch {}
}

/** apelată din bullets / collisions când boss-ul moare */
export function bossKilled(w: World, killer: Entity): void {
  if (bossId === null) return;
  const p = w.pos.get(bossId);

  // puncte către killer
  const killerPl = w.player.get(killer);
  if (killerPl) {
    killerPl.score += BOSS.VALUE;
    try {
      const { addCountryPoints, pushFeed } = useGameStore.getState();
      addCountryPoints?.(killerPl.country, BOSS.VALUE);
      pushFeed?.(`${killerPl.id} defeated the BOSS! +${BOSS.VALUE} pts`);
    } catch {}
  }

  // drop shards (supply) în jurul boss-ului
  if (p) {
    const drops = 5 + Math.floor(Math.random() * 4); // 5..8
    for (let i = 0; i < drops; i++) {
      const e = (w.nextId++);
      const ang = Math.random() * Math.PI * 2;
      const r = 40 + Math.random() * 80;
      const x = p.x + Math.cos(ang) * r;
      const y = p.y + Math.sin(ang) * r;

      w.pos.set(e, { x, y });
      w.vel.set(e, { x: 0, y: 0 });
      w.rad.set(e, { r: 12 });
      w.col.set(e, { a: 0.66, b: 0.66, g: 1 });
      w.supply.set(e, {
        ttl: 30,
        loot: 'shards',
        amount: randInt(SUPPLY.SHARDS_MIN + 2, SUPPLY.SHARDS_MAX + 4),
      });
    }
  }

  // curățăm boss entity
  removeEntity(w, bossId);
  bossId = null;
  duration = 0;
  timeLeft = 0;
  target = null;
  fireCD = 0;
}

export function isBoss(e: Entity): boolean {
  return bossId !== null && e === bossId;
}

// helpers
function rand(a: number, b: number) { return a + Math.random() * (b - a); }
function randInt(a: number, b: number) { return Math.floor(rand(a, b + 1)); }

function spawnBossBullet(
  w: World,
  x: number,
  y: number,
  dirX: number,
  dirY: number,
  speed: number,
  dmg: number
) {
  const e = (w.nextId++);
  w.pos.set(e, { x, y });
  w.vel.set(e, { x: dirX * speed, y: dirY * speed });
  w.rad.set(e, { r: 3 });
  w.col.set(e, { a: 1, b: 0.4, g: 0.8 }); // mov
  w.bullet.set(e, { owner: -1 as unknown as Entity, dmg, life: 2.5, bounces: 0 });
}
