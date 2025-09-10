import { GAME, MAP } from '@/lib/config';
import { mulberry32 } from '@/lib/rng';
import { setColor, setPos, setRad, setVel } from '../components';
import type { World, Entity } from '../types';
import { spawn } from '../world';

export function spawnParticles(w: World, seed = 1337) {
  const rnd = mulberry32(seed);
  while (countParticles(w) < GAME.MAX_PARTICLES) {
    const e = spawn(w);
    setPos(w, e, rnd() * MAP.WIDTH, rnd() * MAP.HEIGHT);
    setVel(w, e, 0, 0);
    setRad(w, e, 3 + rnd() * 2);
    setColor(w, e, rnd(), rnd(), rnd());
    w.particle.set(e, { value: 1 + Math.floor(rnd() * 3) });
  }
}

export function countParticles(w: World) {
  let c = 0; w.particle.forEach(() => c++); return c;
}

export function findSafeSpawn(w: World, tries = 24, minDist = 180): { x: number; y: number } {
  for (let i = 0; i < tries; i++) {
    const x = Math.random() * MAP.WIDTH;
    const y = Math.random() * MAP.HEIGHT;
    let ok = true;
    w.player.forEach((_pl, e) => {
      const p = w.pos.get(e); const r = w.rad.get(e);
      if (!p || !r) return;
      const dx = p.x - x, dy = p.y - y;
      if (dx * dx + dy * dy < (minDist + r.r) * (minDist + r.r)) ok = false;
    });
    if (ok) return { x, y };
  }
  return { x: Math.random() * MAP.WIDTH, y: Math.random() * MAP.HEIGHT };
}

export function spawnPlayer(
  w: World,
  id: string,
  isBot = false,
  radius?: number,
  country?: string
): Entity {
  const e = spawn(w);
  const pos = findSafeSpawn(w);
  setPos(w, e, pos.x, pos.y);
  setVel(w, e, 0, 0);
  setRad(w, e, radius ?? GAME.START_RADIUS);
  setColor(w, e, Math.random(), Math.random(), Math.random());
  w.player.set(e, {
    id,
    country,
    isBot,
    ability: 'dash',
    cooldown: 0,
    invuln: 1.0,
    score: 0,
    alive: true
  });
  return e;
}
