import { GAME, MAP, HOTSPOTS } from '@/lib/config';
import type { World, Entity, Particle } from '../types';
import { spawn } from '../world';

/** === PLAYER SPAWN ===================================================== */

export function spawnPlayer(
  w: World,
  id: string,
  isBot = false,
  sizeRand?: number,
  country?: string
): Entity {
  const e = spawn(w);

  // poziție random inițială; poți ajusta cum dorești
  const x = Math.random() * (MAP.WIDTH - 400) + 200;
  const y = Math.random() * (MAP.HEIGHT - 400) + 200;

  const r = sizeRand ? sizeRand : GAME.START_RADIUS;

  w.pos.set(e, { x, y });
  w.vel.set(e, { x: 0, y: 0 });
  w.rad.set(e, { r });
  w.col.set(e, { a: 0.6, b: 0.9, g: 0.7 });

  // stats de bază (pot fi suprascrise ulterior din Supabase)
  const baseAtk = isBot ? 8 : 10;
  const baseDef = isBot ? 3 : 5;
  const baseHp  = isBot ? 70 : 100;

  w.player.set(e, {
    id,
    country,
    isBot,
    ability: 'dash',
    cooldown: 0,
    invuln: 1.0,
    fireCD: 0,
    score: 0,
    alive: true,
    combo: 1,
    comboT: 0,
    magnetT: 0,
    shieldT: 0,
    attack: baseAtk,
    defense: baseDef,
  });

  w.health.set(e, { hp: baseHp, maxHp: baseHp });

  return e;
}

/** === PARTICLE SPAWN =================================================== */

export function spawnParticles(w: World): void {
  // umple harta până la GAME.MAX_PARTICLES, bias spre hotspot-uri
  const want = GAME.MAX_PARTICLES;
  let created = 0;

  // helper simplu pentru particule
  const addParticle = (x: number, y: number, value = 3, kind?: Particle['kind']) => {
    const e = spawn(w);
    w.pos.set(e, { x, y });
    // rază vizuală derivată din „value”
    const r = Math.max(3, Math.min(10, 3 + value * 0.6));
    w.rad.set(e, { r });
    // culori ușor cian; super/boss au alte culori în alte sisteme
    w.col.set(e, { a: 0.1 + Math.random() * 0.2, b: 0.85, g: 1 });
    w.particle.set(e, { value, kind });
  };

  // 1) particule distribuite uniform
  const baseCount = Math.floor(want * 0.6);
  for (let i = 0; i < baseCount; i++) {
    const x = Math.random() * MAP.WIDTH;
    const y = Math.random() * MAP.HEIGHT;
    addParticle(x, y, 3);
    created++;
  }

  // 2) „pachete” în hotspot-uri (mai multe și mai valoroase)
  const hotCount = want - created;
  for (let i = 0; i < hotCount; i++) {
    const h = HOTSPOTS[i % HOTSPOTS.length];
    const ang = Math.random() * Math.PI * 2;
    const rad = Math.random() * h.r * 0.9;
    const x = h.x + Math.cos(ang) * rad;
    const y = h.y + Math.sin(ang) * rad;
    // value ușor mai mare în hotspot
    const v = 4 + Math.floor(Math.random() * 3); // 4..6
    addParticle(x, y, v);
  }

  // opțional: 1-2 „super” la start (event separat le mai adaugă oricum)
  // pentru pornire interesantă:
  for (let i = 0; i < 2; i++) {
    const h = HOTSPOTS[Math.floor(Math.random() * HOTSPOTS.length)];
    const x = h.x + (Math.random() - 0.5) * h.r * 0.6;
    const y = h.y + (Math.random() - 0.5) * h.r * 0.6;
    addParticle(x, y, 10, 'super');
  }
}

/** === SAFE RESPAWN LOCATOR ============================================ */

export function findSafeSpawn(w: World): { x: number; y: number } {
  // caută un punct care să NU fie foarte aproape de alți jucători mari
  // încercări limitate, apoi fallback
  const MAX_TRIES = 40;
  const SAFE_MARGIN = 160;

  for (let t = 0; t < MAX_TRIES; t++) {
    const x = Math.random() * (MAP.WIDTH - 400) + 200;
    const y = Math.random() * (MAP.HEIGHT - 400) + 200;

    let ok = true;
    w.player.forEach((_pl, pe) => {
      const pp = w.pos.get(pe); const rr = w.rad.get(pe);
      if (!pp || !rr) return;
      const dx = pp.x - x, dy = pp.y - y;
      const dist = Math.hypot(dx, dy);
      if (dist < rr.r + SAFE_MARGIN) ok = false;
    });

    if (!ok) continue;

    // opțional: mai evităm și „pachete” de particule dense
    let density = 0;
    w.particle.forEach((_pa, e) => {
      const p = w.pos.get(e); if (!p) return;
      const dx = p.x - x, dy = p.y - y;
      if (dx * dx + dy * dy <= 180 * 180) density++;
    });
    if (density > 40) continue;

    return { x, y };
  }

  // fallback: centru hărții
  return { x: MAP.WIDTH / 2, y: MAP.HEIGHT / 2 };
}
