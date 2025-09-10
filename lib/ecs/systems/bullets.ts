import type { World, Entity } from '../types';
import { addFloater, addPing } from '@/lib/ui/effects';
import { rToArea, areaToR } from '@/lib/math';
import { useGameStore } from '@/lib/state/useGameStore';

const BULLET_SPEED = 520;
const BULLET_LIFE = 1.2;   // sec
const FIRE_RATE = 0.28;    // sec
const DMG_BASE = 20;       // arie absolută minimă
const DMG_PCT  = 0.12;     // % din aria curentă a țintei

export function tryFire(w: World, shooter: Entity, dirX: number, dirY: number): void {
  const pl = w.player.get(shooter); const pos = w.pos.get(shooter);
  if (!pl || !pos) return;
  if (pl.fireCD && pl.fireCD > 0) return;

  const d = Math.hypot(dirX, dirY) || 1;
  const vx = (dirX / d) * BULLET_SPEED;
  const vy = (dirY / d) * BULLET_SPEED;

  const b = (w.nextId++);
  w.pos.set(b, { x: pos.x, y: pos.y });
  w.vel.set(b, { x: vx, y: vy });
  w.rad.set(b, { r: 3 });
  w.col.set(b, { a: 0, b: 0.9, g: 1 });
  // dmg = min abs sau procent (se calculează la impact în funcție de țintă)
  w.bullet.set(b, { owner: shooter, dmg: DMG_BASE, life: BULLET_LIFE });

  pl.fireCD = FIRE_RATE;
}

export function bulletsSystem(w: World, dt: number): void {
  // cooldown fire
  w.player.forEach((pl) => { pl.fireCD = Math.max(0, (pl.fireCD || 0) - dt); });

  // update + coliziuni
  w.bullet.forEach((b, e) => {
    const p = w.pos.get(e); const v = w.vel.get(e);
    if (!p || !v) { w.bullet.delete(e); return; }

    b.life -= dt;
    if (b.life <= 0) {
      w.bullet.delete(e); w.pos.delete(e); w.vel.delete(e); w.rad.delete(e); w.col.delete(e);
      return;
    }

    p.x += v.x * dt; p.y += v.y * dt;

    // === hit player
    let hit = false;
    w.player.forEach((pl, pe) => {
      if (pe === b.owner || !pl.alive) return;
      // invuln / shield = ignoră damage (doar feedback)
      if ((pl.invuln && pl.invuln > 0) || (pl.shieldT && pl.shieldT > 0)) return;

      const hp = w.pos.get(pe); const rr = w.rad.get(pe);
      if (!hp || !rr) return;
      const dx = hp.x - p.x, dy = hp.y - p.y;
      if (dx * dx + dy * dy <= (rr.r + 3) * (rr.r + 3)) {
        const area = rToArea(rr.r);
        const dmgArea = Math.max(DMG_BASE, area * DMG_PCT);
        const newArea = Math.max(0, area - dmgArea);
        rr.r = areaToR(newArea);

        addFloater(hp.x, hp.y, `-${Math.round(dmgArea)}`, '#ff5252');

        if (rr.r <= 6) {
          // “kill”
          pl.alive = false;
          const addCountry = useGameStore.getState().addCountryPoints;
          const pushFeed = useGameStore.getState().pushFeed;
          const killer = w.player.get(b.owner);
          if (killer) {
            killer.score += 12;
            addCountry(killer.country, 12);
            pushFeed(`${killer.id} eliminated ${pl.id}`);
          }
        }
        hit = true;
      }
    });

    if (hit) {
      addPing(p.x, p.y, '#ff5252');
      w.bullet.delete(e); w.pos.delete(e); w.vel.delete(e); w.rad.delete(e); w.col.delete(e);
      return;
    }

    // === hit boss (opțional mai slab)
    w.particle.forEach((pa, pe) => {
      if (pa.kind !== 'boss') return;
      const hp = w.pos.get(pe); const rr = w.rad.get(pe);
      if (!hp || !rr) return;
      const dx = hp.x - p.x, dy = hp.y - p.y;
      if (dx * dx + dy * dy <= (rr.r + 3) * (rr.r + 3)) {
        const area = rToArea(rr.r);
        const dmgArea = Math.max(DMG_BASE * 0.5, area * (DMG_PCT * 0.5));
        const newArea = Math.max(rToArea(8), area - dmgArea);
        rr.r = areaToR(newArea);

        addFloater(hp.x, hp.y, `-${Math.round(dmgArea)}`, '#ff66ff');
        addPing(hp.x, hp.y, '#ff66ff');

        w.bullet.delete(e); w.pos.delete(e); w.vel.delete(e); w.rad.delete(e); w.col.delete(e);
      }
    });
  });
}
