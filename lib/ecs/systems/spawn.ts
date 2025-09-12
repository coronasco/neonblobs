// lib/ecs/systems/spawn.ts
import type { World, Entity } from '../types';
import { spawn as reserveId } from '../world';
import { MAP, GAME, HOTSPOTS } from '@/lib/config';

type SpawnOpts = {
  level?: number;   // 1..250
  maxHp?: number;   // dacă vrei să suprascrii calculul default
  hp?: number;      // hp inițial (default = maxHp)
  attack?: number;  // suprascrie calculul din level
  defense?: number; // suprascrie calculul din level
};

/** calculează stats din level (cap la 250) */
function statsFromLevel(levelInput?: number) {
  const lvl = Math.max(1, Math.min(250, Math.floor(levelInput ?? 1)));
  const attack = 5 + lvl * 0.6;     // scalare lină
  const defense = 2 + lvl * 0.4;
  const maxHp = 100 + lvl * 10;     // HP crește vizibil cu level
  return { lvl, attack, defense, maxHp };
}

/** găsește un loc relativ liber față de pereți și alți jucători */
export function findSafeSpawn(w: World): { x: number; y: number } {
  for (let i = 0; i < 48; i++) {
    const x = 80 + Math.random() * (MAP.WIDTH - 160);
    const y = 80 + Math.random() * (MAP.HEIGHT - 160);

    // evită spawn fix în boshi / super orbs (aprox)
    let ok = true;
    w.player.forEach((_pl, e) => {
      const p = w.pos.get(e); const r = w.rad.get(e);
      if (!p || !r) return;
      const dx = p.x - x, dy = p.y - y;
      if (dx * dx + dy * dy < (r.r + 60) * (r.r + 60)) ok = false;
    });
    if (ok) return { x, y };
  }
  // fallback
  return { x: MAP.WIDTH * 0.5, y: MAP.HEIGHT * 0.5 };
}

/** spawnează un player / bot */
export function spawnPlayer(
  w: World,
  id: string,
  isBot: boolean,
  startRadius?: number,
  country?: string,
  opts?: SpawnOpts
): Entity {
  const e = reserveId(w);

  const base = statsFromLevel(opts?.level);
  const attack = opts?.attack ?? base.attack;
  const defense = opts?.defense ?? base.defense;
  const maxHp = Math.round(opts?.maxHp ?? base.maxHp);
  const hp = Math.round(opts?.hp ?? maxHp);

  const r = Math.max(10, Math.min(26, startRadius ?? GAME.START_RADIUS));

  const spot = findSafeSpawn(w);

  w.pos.set(e, { x: spot.x, y: spot.y });
  w.vel.set(e, { x: 0, y: 0 });
  w.rad.set(e, { r });
  w.col.set(e, { a: Math.random(), b: Math.random(), g: Math.random() * 0.5 + 0.5 });

  w.health.set(e, { hp, maxHp });

  w.player.set(e, {
    id,
    country,
    isBot,
    ability: 'dash',
    cooldown: 0,
    invuln: 1.0,
    score: 0,
    alive: true,
    magnetT: 0,
    shieldT: 0,
    fireCD: 0,
    // combat
    attack,
    defense,
    // combo
    combo: 1,
    comboT: 0,
  });

  return e;
}

/** populare particule pe hartă (normal + câteva super pentru varietate) */
export function spawnParticles(w: World): void {
  const total = Math.min(GAME.MAX_PARTICLES, Math.floor((MAP.WIDTH * MAP.HEIGHT) / 32000));
  const superEvery = Math.max(14, Math.floor(total / 28));

  let count = 0;
  while (count < total) {
    const e = reserveId(w);
    const isSuper = count % superEvery === 0;

    // distribuite uniform, dar ușor atrase de hotspot-uri
    const useHot = Math.random() < 0.45;
    let x: number, y: number;
    if (useHot) {
      const h = HOTSPOTS[Math.floor(Math.random() * HOTSPOTS.length)];
      const ang = Math.random() * Math.PI * 2;
      const rad = Math.random() * h.r;
      x = h.x + Math.cos(ang) * rad;
      y = h.y + Math.sin(ang) * rad;
    } else {
      x = Math.random() * MAP.WIDTH;
      y = Math.random() * MAP.HEIGHT;
    }

    w.pos.set(e, { x, y });
    w.vel.set(e, { x: 0, y: 0 });
    w.rad.set(e, { r: isSuper ? 10 : 6 });
    w.col.set(e, isSuper ? { a: 1, b: 0.4, g: 0.8 } : { a: 0, b: 0.9, g: 1 });
    w.particle.set(e, { value: isSuper ? 12 : 4, kind: isSuper ? 'super' : 'normal' });

    count++;
  }
}
