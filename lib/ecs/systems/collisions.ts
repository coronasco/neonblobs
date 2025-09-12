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
import { onBotKilled } from './ai';

const ABSORB_FACTOR = 0.65;
const RADIUS_CAP    = 180;
const EPS           = 1e-3;
const COMBO_WINDOW  = 2.0; // secunde pentru combo în hotspot

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
  const pushFeed         = useGameStore.getState().pushFeed;
  const settings         = useSettings.getState();

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
        const fp = w.pos.get(other);
        const fr = w.rad.get(other);
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

          // creștere pe arie (limitată)
          const newArea = rToArea(pr) + rToArea(fr.r) * 0.08;
          w.rad.get(pe)!.r = Math.min(areaToR(newArea), RADIUS_CAP);

          // Floater & ping
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

        removeEntity(w, other);
        continue;
      }

      // ---------- PLAYER vs PLAYER ----------
      if (w.player.has(other)) {
        const plb = w.player.get(other)!;
        if (!plb.alive) continue;

        // invulnerabilitate (respawn shield) – ignoră
        if ((pla.invuln && pla.invuln > 0) || (plb.invuln && plb.invuln > 0)) continue;

        const pb = w.pos.get(other);
        const rb = w.rad.get(other);
        if (!pb || !rb) continue;

        const dx = pp.x - pb.x, dy = pp.y - pb.y;
        const dist2 = dx * dx + dy * dy;
        const radSum = pr + rb.r;
        if (dist2 > radSum * radSum) continue;

        // mărimi aproape egale → respingere (bounce), nu absorbim
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

        // determină cine e mare/mic
        const big: Entity   = pr > rb.r ? pe : other;
        const small: Entity = big === pe ? other : pe;

        // dacă cel mic are SHIELD activ → respingere + STOP
        const smallPl = w.player.get(small);
        if (smallPl && smallPl.shieldT && smallPl.shieldT > 0) {
          const vSmall = w.vel.get(small);
          const vBig   = w.vel.get(big);
          const pSmall = w.pos.get(small)!;
          const pBig   = w.pos.get(big)!;
          const dx2 = pSmall.x - pBig.x, dy2 = pSmall.y - pBig.y;
          const d2  = Math.hypot(dx2, dy2) || 1;
          const nx  = dx2 / d2, ny = dy2 / d2;
          if (vSmall) { vSmall.x += nx * 220; vSmall.y += ny * 220; }
          if (vBig)   { vBig.x   -= nx * 120; vBig.y   -= ny * 120; }
          continue;
        }

        // absorbție normală
        const areaBig   = rToArea(w.rad.get(big)!.r);
        const areaSmall = rToArea(w.rad.get(small)!.r);
        const newArea   = areaBig + areaSmall * ABSORB_FACTOR;

        w.rad.get(big)!.r = Math.min(areaToR(newArea), RADIUS_CAP);

        const scorer    = w.player.get(big)!;
        const bonusHere = inHotspot(w.pos.get(big)!.x, w.pos.get(big)!.y) ? HOTSPOT.BONUS_MULT : 1;
        const gainedPvP = 10 * bonusHere;
        scorer.score += gainedPvP;
        addCountryPoints(scorer.country, gainedPvP);

        // kill feed
        pushFeed(`${scorer.id} ate ${w.player.get(small)!.id}`);

        // floater + ping roșu la locul coliziunii
        const mx = (pp.x + pb.x) / 2;
        const my = (pp.y + pb.y) / 2;
        const tag = bonusHere > 1 ? `+${gainedPvP} x2` : `+${gainedPvP}`;
        addFloater(mx, my, tag, '#ff5252');
        addPing(mx, my, '#ff5252');

        if (settings.sound) SFX.absorb();
        if (settings.haptics && 'vibrate' in navigator) navigator.vibrate?.([12, 50]);

        // marcăm "small" ca mort și îl scoatem
        const smallWasBot = !!w.player.get(small)?.isBot;
        removeEntity(w, small);
        if (smallWasBot) onBotKilled(w, small); // respawn bot
      }
    }
  });
}
