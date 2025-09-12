// lib/ecs/systems/ai.ts
import type { World, Entity } from '../types';
import { HOTSPOTS } from '@/lib/config';
import { tryFire } from './bullets';
import { spawnPlayer } from './spawn';

// ==== Parametri AI bot ====
const BOT_MOVE_ACCEL = 80;
const BOT_DAMP       = 0.98;
const BOT_FIRE_RATE  = 0.65;         // mai lent ca playerul (0.28s)
const BOT_AGGRO_TIME = 4.0;          // secunde rămâne aggro pe țintă
const BOT_RESPAWN_MIN = 2.5;         // secunde
const BOT_RESPAWN_MAX = 5.0;         // secunde
const HOTSPOT_RUSH_DIST2 = 280 * 280; // dacă intri aproape de bot în hotspot, te ia în vizor

type BotAI = {
  fireCD: number;
  aggroUntil: number;     // clock time (sec) până când rămâne agresiv pe target
  target?: Entity;        // ultima țintă
};

const botBrain = new Map<Entity, BotAI>();

// queue respawn simple
const respawnQueue: Array<{ at: number; country: string | undefined; level?: number }> = [];

function nowSeconds(): number {
  return performance.now() / 1000;
}

export function scheduleBotRespawn(country?: string, level?: number) {
  const t = nowSeconds() + (BOT_RESPAWN_MIN + Math.random() * (BOT_RESPAWN_MAX - BOT_RESPAWN_MIN));
  respawnQueue.push({ at: t, country, level });
}

// din bullets.ts o chemăm când un bot e lovit de cineva
export function setBotAggro(bot: Entity, attacker: Entity) {
  const s = botBrain.get(bot) ?? { fireCD: 0, aggroUntil: 0, target: undefined };
  s.target = attacker;
  s.aggroUntil = nowSeconds() + BOT_AGGRO_TIME;
  botBrain.set(bot, s);
}

// util: e un punct în vreun hotspot?
function inHotspot(x: number, y: number): boolean {
  for (const h of HOTSPOTS) {
    const dx = x - h.x, dy = y - h.y;
    if (dx * dx + dy * dy <= h.r * h.r) return true;
  }
  return false;
}

export function botSystem(w: World, dt: number): void {
  const time = nowSeconds();

  // ===== Respawn bots programați
  while (respawnQueue.length && respawnQueue[0].at <= time) {
    const job = respawnQueue.shift()!;
    // respawn bot cu un level aproximativ (poți ignora level dacă nu îl folosești)
    const botName = `bot-${Math.floor(Math.random() * 100000)}`;
    const rBetween = (a: number, b: number) => a + Math.random() * (b - a);
    const levelRadius = job.level ? Math.max(12, Math.min(28, 12 + job.level)) : rBetween(12, 22);
    spawnPlayer(w, botName, true, levelRadius, job.country);
    // bot nou → creier nou
  }

  // colectează entități
  const bots: Entity[] = [];
  const humans: Entity[] = [];
  w.player.forEach((pl, e) => {
    if (!pl.alive) return;
    if (pl.isBot) bots.push(e);
    else humans.push(e);
  });

  // ===== Threat detect în hotspot: dacă bot-ul e în hotspot și un player intră aproape -> îl ia aggro
  for (const b of bots) {
    const bp = w.pos.get(b)!; const br = w.rad.get(b)!.r;
    if (!inHotspot(bp.x, bp.y)) continue;
    for (const h of humans) {
      const hp = w.pos.get(h)!;
      const dx = hp.x - bp.x, dy = hp.y - bp.y;
      const d2 = dx * dx + dy * dy;
      if (d2 <= HOTSPOT_RUSH_DIST2) {
        const s = botBrain.get(b) ?? { fireCD: 0, aggroUntil: 0, target: undefined };
        s.target = h;
        s.aggroUntil = time + BOT_AGGRO_TIME; // 4s
        botBrain.set(b, s);
        break;
      }
    }
  }

  // ===== Navigation + shooting
  for (const e of bots) {
    const pos = w.pos.get(e)!; const vel = w.vel.get(e)!; const rad = w.rad.get(e)!.r;

    // brain
    const s = botBrain.get(e) ?? { fireCD: 0, aggroUntil: 0, target: undefined };
    s.fireCD = Math.max(0, s.fireCD - dt);

    // dacă avem target activ și încă în aggro window, urmărește și trage
    let tx = pos.x, ty = pos.y;
    let hasTarget = false;

    if (s.target && time <= s.aggroUntil) {
      const tp = w.pos.get(s.target);
      const tPl = w.player.get(s.target);
      if (tp && tPl && tPl.alive) {
        tx = tp.x; ty = tp.y;
        hasTarget = true;

        // foc rar (BOT_FIRE_RATE)
        if (s.fireCD <= 0) {
          const dx = tx - pos.x, dy = ty - pos.y;
          const d = Math.hypot(dx, dy) || 1;
          tryFire(w, e, dx / d, dy / d);
          s.fireCD = BOT_FIRE_RATE * (0.9 + Math.random() * 0.3); // mic jitter
        }
      } else {
        // țintă invalidă
        s.target = undefined;
      }
    }

    // dacă nu are target → comportamentul vechi: caută particule, evită umanii mai mari
    if (!hasTarget) {
      let bestD = Infinity;
      // flee human mult mai mare, altfel caută cea mai apropiată particulă
      for (const h of humans) {
        const hp = w.pos.get(h)!; const hr = w.rad.get(h)!.r;
        const dx = hp.x - pos.x, dy = hp.y - pos.y;
        const d2 = dx * dx + dy * dy;
        if (hr > rad * 1.2 && d2 < 200 * 200) {
          tx = pos.x - dx; ty = pos.y - dy; bestD = 0; // flee
          break;
        }
      }
      if (bestD === Infinity) {
        let bestP = Infinity;
        w.particle.forEach((_p, pe) => {
          const pp = w.pos.get(pe)!;
          const d2 = (pp.x - pos.x) ** 2 + (pp.y - pos.y) ** 2;
          if (d2 < bestP) { bestP = d2; tx = pp.x; ty = pp.y; }
        });
      }
    }

    // steering
    const ax = Math.sign(tx - pos.x) * BOT_MOVE_ACCEL;
    const ay = Math.sign(ty - pos.y) * BOT_MOVE_ACCEL;
    vel.x += ax * dt; vel.y += ay * dt;
    vel.x *= BOT_DAMP; vel.y *= BOT_DAMP;

    botBrain.set(e, s);
  }
}

// util: când un bot moare din orice motiv, din collisions.ts putem programa respawn
export function onBotKilled(w: World, bot: Entity) {
  const pl = w.player.get(bot);
  scheduleBotRespawn(pl?.country, /* level? */ undefined);
  botBrain.delete(bot);
}
