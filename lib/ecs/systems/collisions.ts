// lib/ecs/systems/collisions.ts
import type { World, Entity, Particle } from '../types';
import { removeEntity } from '../world';
import { areaToR, rToArea } from '@/lib/math';
import { buildGrid, nearbyEntities } from '../spatial';
import { useGameStore } from '@/lib/state/useGameStore';
import { HOTSPOTS, HOTSPOT } from '@/lib/config';
import { SFX } from '@/lib/audio/sfx';
import { useSettings } from '@/lib/state/useSettings';
import { addFloater, addPing } from '@/lib/ui/effects';
import { isBoss, bossKilled } from './boss';

const EPS = 1e-3;
const COMBO_WINDOW = 2.0; // secunde pentru combo în hotspot
const ABSORB_FACTOR = 0.15; // mai mic, doar efect vizual

function inHotspot(x: number, y: number): boolean {
  for (const h of HOTSPOTS) {
    const dx = x - h.x, dy = y - h.y;
    if (dx * dx + dy * dy <= h.r * h.r) return true;
  }
  return false;
}

export function collisionSystem(w: World): void {
  const grid = buildGrid(w, 64);
  const addCountryPoints = useGameStore.getState().addCountryPoints;
  const pushFeed = useGameStore.getState().pushFeed;
  const settings = useSettings.getState();

  w.player.forEach((pla, pe) => {
    if (!pla.alive || !w.pos.has(pe) || !w.rad.has(pe)) return;

    const pp = w.pos.get(pe)!;
    const pr = w.rad.get(pe)!.r;

    // default combo fields
    if (!pla.combo) pla.combo = 1;
    if (pla.comboT === undefined) pla.comboT = 0;

    const isHot = inHotspot(pp.x, pp.y);
    const hotspotMult = isHot ? HOTSPOT.BONUS_MULT : 1;

    const candidates = nearbyEntities(grid, pp.x, pp.y);
    for (const other of candidates) {
      if (other === pe) continue;

      // ---------- PLAYER vs PARTICLE ----------
      if (w.particle.has(other)) {
        const fp = w.pos.get(other); const fr = w.rad.get(other);
        if (!fp || !fr) continue;

        const dx = pp.x - fp.x, dy = pp.y - fp.y;
        if (dx * dx + dy * dy > (pr + fr.r) * (pr + fr.r)) continue;

        const pInfo = w.particle.get(other) as Particle | undefined;
        if (pInfo) {
          // combo crește doar în hotspot
          if (isHot) {
            if (pla.comboT! > 0) pla.combo = Math.min(3, (pla.combo || 1) + 1);
            else pla.combo = Math.max(2, pla.combo || 2);
            pla.comboT = COMBO_WINDOW;
          } else {
            pla.combo = 1;
            pla.comboT = 0;
          }

          const gained = pInfo.value * hotspotMult * (pla.combo || 1);
          pla.score += gained;
          addCountryPoints(pla.country, gained);

          // Efect vizual: creștere ușoară a razei
          const newArea = rToArea(pr) + rToArea(fr.r) * ABSORB_FACTOR;
          w.rad.get(pe)!.r = areaToR(newArea);

          // Floater & ping în funcție de tipul particulei
          if (pInfo.kind === 'super' || pInfo.kind === 'boss') {
            const parts = [`+${gained}`, pInfo.kind === 'boss' ? 'BOSS' : 'SUPER'];
            if (hotspotMult > 1) parts.push('x2');
            if ((pla.combo || 1) > 1) parts.push(`x${pla.combo}`);
            addFloater(fp.x, fp.y, parts.join(' '), '#ff66ff');
            addPing(fp.x, fp.y, '#ff66ff');
            if (settings.sound) SFX.absorb();
          } else {
            const parts: string[] = [`+${gained}`];
            if (hotspotMult > 1) parts.push('x2');
            if ((pla.combo || 1) > 1) parts.push(`x${pla.combo}`);
            addFloater(fp.x, fp.y, parts.join(' '), '#00e5ff');
            if (settings.sound) SFX.pickup();
          }
          if (settings.haptics && 'vibrate' in navigator) navigator.vibrate?.(10);
        }

        // Dacă particula era boss & a ajuns foarte mică, marcăm kill-ul (fallback în caz că a fost „mâncat”)
        if (isBoss(other)) {
          bossKilled(w, pe);
        } else {
          removeEntity(w, other);
        }
        continue;
      }

      // ---------- PLAYER vs PLAYER (ramming) ----------
      if (w.player.has(other)) {
        const plb = w.player.get(other)!;
        if (!plb.alive) continue;

        // invulnerabilitate (respawn shield) – ignoră
        if ((pla.invuln && pla.invuln > 0) || (plb.invuln && plb.invuln > 0)) continue;

        const pb = w.pos.get(other); const rb = w.rad.get(other);
        if (!pb || !rb) continue;

        const dx = pp.x - pb.x, dy = pp.y - pb.y;
        const dist2 = dx * dx + dy * dy;
        const radSum = pr + rb.r;
        if (dist2 > radSum * radSum) continue;

        // dacă mărimile sunt aproape egale → respingere ușoară
        if (Math.abs(pr - rb.r) <= EPS) {
          const vA = w.vel.get(pe), vB = w.vel.get(other);
          if (vA && vB) {
            const d = Math.hypot(dx, dy) || 1;
            const nx = dx / d, ny = dy / d;
            const impulse = 140;
            vA.x += nx * impulse; vA.y += ny * impulse;
            vB.x -= nx * impulse; vB.y -= ny * impulse;
          }
          continue;
        }

        // DAMAGE în ambele sensuri, în funcție de mărime + ATK/DEF
        const hpA = w.health.get(pe);
        const hpB = w.health.get(other);
        if (hpA && hpB) {
          const atkA = pla.attack ?? 10, defB = plb.defense ?? 0;
          const atkB = plb.attack ?? 10, defA = pla.defense ?? 0;
          const mag = Math.max(0.6, Math.min(1.4, (pr / Math.max(1, rb.r)))); // cât de mare e A vs B

          const dmgToB = Math.max(1, Math.floor(atkA * mag - defB * 0.5));
          const dmgToA = Math.max(1, Math.floor(atkB * (1 / mag) - defA * 0.5));

          hpB.hp = Math.max(0, hpB.hp - dmgToB);
          hpA.hp = Math.max(0, hpA.hp - dmgToA);

          addFloater(pb.x, pb.y, `-${dmgToB}`, '#ff5252');
          addFloater(pp.x, pp.y, `-${dmgToA}`, '#ff5252');

          // efect vizual mic de absorbție către cel mai mare
          const big: Entity = pr > rb.r ? pe : other;
          const small: Entity = big === pe ? other : pe;
          const areaBig = rToArea(w.rad.get(big)!.r);
          const areaSmall = rToArea(w.rad.get(small)!.r);
          const newArea = areaBig + areaSmall * ABSORB_FACTOR * 0.5;
          w.rad.get(big)!.r = areaToR(newArea);
        }

        // verificăm morți
        if (hpDead(w, other)) {
          const scorer = pla;
          scorer.score += 12;
          addCountryPoints(scorer.country, 12);
          pushFeed(`${scorer.id} eliminated ${w.player.get(other)!.id}`);
          removeEntity(w, other);
          addPing(pb.x, pb.y, '#ff5252');
        }
        if (hpDead(w, pe)) {
          const scorer = plb;
          scorer.score += 12;
          addCountryPoints(scorer.country, 12);
          pushFeed(`${scorer.id} eliminated ${pla.id}`);
          removeEntity(w, pe);
          addPing(pp.x, pp.y, '#ff5252');
        }

        if (settings.sound) SFX.absorb();
        if (settings.haptics && 'vibrate' in navigator) navigator.vibrate?.([12, 50]);
      }
    }

    // combo timer decay
    pla.comboT = Math.max(0, (pla.comboT || 0) - 1 / 60);
  });
}

function hpDead(w: World, e: Entity): boolean {
  const h = w.health.get(e);
  const pl = w.player.get(e);
  if (!h || !pl) return false;
  if (h.hp <= 0) {
    pl.alive = false;
    return true;
  }
  return false;
}
