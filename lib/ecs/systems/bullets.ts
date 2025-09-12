// lib/ecs/systems/bullets.ts
import type { World, Entity } from '../types';
import { addFloater, addPing, addHit, addShake } from '@/lib/ui/effects';
import { rToArea, areaToR } from '@/lib/math';
import { useGameStore } from '@/lib/state/useGameStore';
import { MAP } from '@/lib/config';
import { setBotAggro } from './ai';

const BULLET_SPEED = 520;
const BULLET_LIFE = 1.2;    // sec
const FIRE_RATE   = 0.28;   // sec (player)
const DMG_BASE    = 20;     // arie minimă
const DMG_PCT     = 0.12;   // % din arie
const MAX_BOUNCES = 1;      // un ricoșeu

type BulletData = {
  owner: Entity;  // pentru boss putem folosi -1
  dmg: number;
  life: number;
  bounces?: number;
};

export function tryFire(w: World, shooter: Entity, dirX: number, dirY: number): void {
  const pl = w.player.get(shooter);
  const pos = w.pos.get(shooter);
  if (!pl || !pos) return;
  if (pl.fireCD && pl.fireCD > 0) return;

  const d = Math.hypot(dirX, dirY) || 1;
  const vx = (dirX / d) * BULLET_SPEED;
  const vy = (dirY / d) * BULLET_SPEED;

  const e = (w.nextId++);
  w.pos.set(e, { x: pos.x, y: pos.y });
  w.vel.set(e, { x: vx, y: vy });
  w.rad.set(e, { r: 3 });
  w.col.set(e, { a: 0, b: 0.9, g: 1 });
  w.bullet.set(e, { owner: shooter, dmg: DMG_BASE, life: BULLET_LIFE, bounces: 0 } as BulletData);

  pl.fireCD = FIRE_RATE;
}

export function bulletsSystem(w: World, dt: number): void {
  // cooldown pentru toți jucătorii
  w.player.forEach((pl) => { pl.fireCD = Math.max(0, (pl.fireCD || 0) - dt); });

  // update gloanțe
  w.bullet.forEach((bData, e) => {
    const b = bData as BulletData;
    const p = w.pos.get(e);
    const v = w.vel.get(e);
    if (!p || !v) { cleanupBullet(w, e); return; }

    b.life -= dt;
    if (b.life <= 0) { cleanupBullet(w, e); return; }

    // mișcă
    p.x += v.x * dt; p.y += v.y * dt;

    // ricoșeu margini hartă
    const r = 3;
    let bounced = false;
    if (p.x - r <= 0 && v.x < 0) { v.x = -v.x; p.x = r; bounced = true; }
    if (p.x + r >= MAP.WIDTH && v.x > 0) { v.x = -v.x; p.x = MAP.WIDTH - r; bounced = true; }
    if (p.y - r <= 0 && v.y < 0) { v.y = -v.y; p.y = r; bounced = true; }
    if (p.y + r >= MAP.HEIGHT && v.y > 0) { v.y = -v.y; p.y = MAP.HEIGHT - r; bounced = true; }
    if (bounced) {
      b.bounces = (b.bounces ?? 0) + 1;
      addPing(p.x, p.y, '#7de3ff');
      if ((b.bounces ?? 0) > MAX_BOUNCES) { cleanupBullet(w, e); return; }
    }

    // lovit PLAYER
    let hitSomething = false;
    w.player.forEach((pl, pe) => {
      if (!pl.alive) return;
      if (pe === b.owner) return; // nu ne lovim pe noi

      // invuln / shield
      if ((pl.invuln && pl.invuln > 0) || (pl.shieldT && pl.shieldT > 0)) return;

      const hp = w.pos.get(pe);
      const rr = w.rad.get(pe);
      if (!hp || !rr) return;

      const dx = hp.x - p.x, dy = hp.y - p.y;
      if (dx * dx + dy * dy <= (rr.r + r) * (rr.r + r)) {
        // damage pe "arie"
        const area    = rToArea(rr.r);
        const dmgArea = Math.max(DMG_BASE, area * DMG_PCT);
        const newArea = Math.max(0, area - dmgArea);
        rr.r = areaToR(newArea);

        addHit(hp.x, hp.y);
        addFloater(hp.x, hp.y, `-${Math.round(dmgArea)}`, '#ff5252');

        // dacă victima e BOT -> devine aggro pe shooter (dacă shooter e valid)
        if (pl.isBot && typeof b.owner === 'number' && b.owner > 0) {
          setBotAggro(pe, b.owner);
        }

        // dacă a murit
        if (rr.r <= 6) {
          pl.alive = false;

          const addCountry = useGameStore.getState().addCountryPoints;
          const pushFeed   = useGameStore.getState().pushFeed;

          const killer = w.player.get(b.owner);
          if (killer) {
            killer.score += 12;
            addCountry(killer.country, 12);
            pushFeed(`${killer.id} eliminated ${pl.id}`);
          } else {
            pushFeed?.(`Boss eliminated ${pl.id}`);
          }

          addShake(0.6);
          addPing(hp.x, hp.y, '#ff66ff');
        }

        hitSomething = true;
      }
    });

    if (hitSomething) {
      cleanupBullet(w, e);
      return;
    }

    // lovit BOSS (particulă specială) – dmg mai mic
    w.particle.forEach((pa, pe) => {
      if (pa.kind !== 'boss') return;
      const hp = w.pos.get(pe);
      const rr = w.rad.get(pe);
      if (!hp || !rr) return;

      const dx = hp.x - p.x, dy = hp.y - p.y;
      if (dx * dx + dy * dy <= (rr.r + r) * (rr.r + r)) {
        const area    = rToArea(rr.r);
        const dmgArea = Math.max(DMG_BASE * 0.5, area * (DMG_PCT * 0.5));
        const newArea = Math.max(rToArea(8), area - dmgArea);
        rr.r = areaToR(newArea);

        addHit(hp.x, hp.y);
        addFloater(hp.x, hp.y, `-${Math.round(dmgArea)}`, '#ff66ff');
        addPing(hp.x, hp.y, '#ff66ff');

        cleanupBullet(w, e);
      }
    });
  });
}

function cleanupBullet(w: World, e: Entity): void {
  w.bullet.delete(e);
  w.pos.delete(e);
  w.vel.delete(e);
  w.rad.delete(e);
  w.col.delete(e);
}
