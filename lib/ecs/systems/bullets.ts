// lib/ecs/systems/bullets.ts
import type { World, Entity } from '../types';
import { addFloater, addPing, addHit, addShake } from '@/lib/ui/effects';
import { rToArea, areaToR } from '@/lib/math';
import { useGameStore } from '@/lib/state/useGameStore';
import { MAP } from '@/lib/config';
import { bossKilled, isBoss } from './boss';

const BULLET_SPEED = 520;
const BULLET_LIFE = 1.2;
const FIRE_RATE = 0.28;

const MAX_BOUNCES = 1;
const MIN_DMG = 1;

export function tryFire(w: World, shooter: Entity, dirX: number, dirY: number): void {
  const pl = w.player.get(shooter);
  const pos = w.pos.get(shooter);
  if (!pl || !pos) return;
  if ((pl).fireCD && (pl).fireCD > 0) return;

  const d = Math.hypot(dirX, dirY) || 1;
  const vx = (dirX / d) * BULLET_SPEED;
  const vy = (dirY / d) * BULLET_SPEED;

  const e = (w.nextId++);
  w.pos.set(e, { x: pos.x, y: pos.y });
  w.vel.set(e, { x: vx, y: vy });
  w.rad.set(e, { r: 3 });
  w.col.set(e, { a: 0, b: 0.9, g: 1 });
  // dmg bazat pe atacul jucătorului
  const dmg = Math.max(MIN_DMG, Math.floor((pl.attack ?? 10)));
  w.bullet.set(e, { owner: shooter, dmg, life: BULLET_LIFE, bounces: 0 });

  (pl).fireCD = FIRE_RATE;
}

export function bulletsSystem(w: World, dt: number): void {
  // cooldown pe arma
  w.player.forEach((pl) => { pl.fireCD = Math.max(0, (pl.fireCD || 0) - dt); });

  // update proiectile
  w.bullet.forEach((bd, e) => {
    const p = w.pos.get(e);
    const v = w.vel.get(e);
    if (!p || !v) { cleanupBullet(w, e); return; }

    bd.life -= dt;
    if (bd.life <= 0) { cleanupBullet(w, e); return; }

    // mișcare
    p.x += v.x * dt; p.y += v.y * dt;

    // ricoșeu margini hartă
    const r = 3;
    let bounced = false;
    if (p.x - r <= 0 && v.x < 0) { v.x = -v.x; p.x = r; bounced = true; }
    if (p.x + r >= MAP.WIDTH && v.x > 0) { v.x = -v.x; p.x = MAP.WIDTH - r; bounced = true; }
    if (p.y - r <= 0 && v.y < 0) { v.y = -v.y; p.y = r; bounced = true; }
    if (p.y + r >= MAP.HEIGHT && v.y > 0) { v.y = -v.y; p.y = MAP.HEIGHT - r; bounced = true; }
    if (bounced) {
      bd.bounces = (bd.bounces ?? 0) + 1;
      addPing(p.x, p.y, '#7de3ff');
      if ((bd.bounces ?? 0) > MAX_BOUNCES) { cleanupBullet(w, e); return; }
    }

    // lovit PLAYER
    let hit = false;
    w.player.forEach((pl, pe) => {
      if (hit) return;
      if (!pl.alive) return;

      // nu te bagi în glonțul tău, și shield/ invuln protejează
      if (pe === bd.owner) return;
      if ((pl.invuln && pl.invuln > 0) || (pl.shieldT && pl.shieldT > 0)) return;

      const hp = w.pos.get(pe); const rr = w.rad.get(pe);
      if (!hp || !rr) return;

      const dx = hp.x - p.x, dy = hp.y - p.y;
      if (dx * dx + dy * dy <= (rr.r + r) * (rr.r + r)) {
        // === DAMAGE pe HP, ținând cont de defense ===
        const hpComp = w.health.get(pe);
        if (hpComp) {
          const def = Math.max(0, w.player.get(pe)?.defense ?? 0);
          const raw = bd.dmg;
          const dealt = Math.max(MIN_DMG, raw - Math.floor(def * 0.5));
          hpComp.hp = Math.max(0, hpComp.hp - dealt);

          addHit(hp.x, hp.y);
          addFloater(hp.x, hp.y, `-${dealt}`, '#ff5252');

          if (hpComp.hp <= 0) {
            // kill: scor & feed
            pl.alive = false;
            const addCountry = useGameStore.getState().addCountryPoints;
            const pushFeed = useGameStore.getState().pushFeed;
            const killer = w.player.get(bd.owner);
            if (killer) {
              killer.score += 12;
              addCountry(killer.country, 12);
              pushFeed(`${killer.id} eliminated ${pl.id}`);
            }
            addShake(0.6);
            addPing(hp.x, hp.y, '#ff66ff');
          }
        }

        hit = true;
      }
    });
    if (hit) { cleanupBullet(w, e); return; }

    // lovit BOSS (ca particle kind 'boss')
    w.particle.forEach((pa, pe) => {
      if (hit) return;
      if (pa.kind !== 'boss') return;
      const hp = w.pos.get(pe); const rr = w.rad.get(pe);
      if (!hp || !rr) return;

      const dx = hp.x - p.x, dy = hp.y - p.y;
      if (dx * dx + dy * dy <= (rr.r + r) * (rr.r + r)) {
        // pentru boss folosim „HP” derivat din rază → scădem puțin raza
        const area = rToArea(rr.r);
        const newArea = Math.max(rToArea(10), area - bd.dmg * 6); // scalare ca să se simtă impactul
        rr.r = areaToR(newArea);

        addHit(hp.x, hp.y);
        addFloater(hp.x, hp.y, `-${bd.dmg}`, '#ff66ff');
        addPing(hp.x, hp.y, '#ff66ff');

        // dacă am ajuns foarte mic -> boss killed
        if (rr.r <= 12 && isBoss(pe)) {
          bossKilled(w, bd.owner);
        }

        hit = true;
      }
    });
    if (hit) { cleanupBullet(w, e); return; }
  });
}

function cleanupBullet(w: World, e: Entity): void {
  w.bullet.delete(e); w.pos.delete(e); w.vel.delete(e); w.rad.delete(e); w.col.delete(e);
}
