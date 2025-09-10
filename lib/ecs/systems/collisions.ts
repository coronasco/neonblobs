import type { World } from '../types';
import { removeEntity } from '../world';
import { areaToR, rToArea } from '@/lib/math';
import { buildGrid, nearbyEntities } from '../spatial';
import { useGameStore } from '@/lib/state/useGameStore';
import { HOTSPOTS, HOTSPOT } from '@/lib/config';
import { SFX } from '@/lib/audio/sfx';
import { useSettings } from '@/lib/state/useSettings';
import { addFloater, addPing } from '@/lib/ui/effects';

const ABSORB_FACTOR = 0.65;
const RADIUS_CAP = 180;
const EPS = 1e-3;
const COMBO_WINDOW = 2.0;

function inHotspot(x: number, y: number): boolean {
  for (const h of HOTSPOTS) {
    const dx = x - h.x, dy = y - h.y;
    if (dx * dx + dy * dy <= h.r * h.r) return true;
  }
  return false;
}

export function collisionSystem(w: World) {
  const grid = buildGrid(w, 64);
  const addCountryPoints = useGameStore.getState().addCountryPoints;
  const settings = useSettings.getState();

  w.player.forEach((pla, pe) => {
    if (!w.pos.has(pe) || !w.rad.has(pe) || !pla.alive) return;

    const pp = w.pos.get(pe)!;
    const pr = w.rad.get(pe)!.r;
    const candidates = nearbyEntities(grid, pp.x, pp.y);

    const isHot = inHotspot(pp.x, pp.y);
    const hotspotMult = isHot ? HOTSPOT.BONUS_MULT : 1;

    if (!pla.combo) pla.combo = 1;
    if (pla.comboT === undefined) pla.comboT = 0;

    for (const other of candidates) {
      if (other === pe) continue;

      // PARTICLE
      if (w.particle.has(other)) {
        if (!w.pos.has(other) || !w.rad.has(other)) continue;
        const fp = w.pos.get(other)!;
        const fr = w.rad.get(other)!.r;

        const dx = pp.x - fp.x, dy = pp.y - fp.y;
        if (dx * dx + dy * dy <= (pr + fr) * (pr + fr)) {
          const pInfo = w.particle.get(other);
          if (pInfo) {
            // combo merge doar în hotspot
            if (isHot) {
              if (pla.comboT! > 0) pla.combo = Math.min(3, (pla.combo || 1) + 1);
              else pla.combo = Math.max(2, pla.combo || 2);
              pla.comboT = COMBO_WINDOW;
            } else { pla.combo = 1; pla.comboT = 0; }

            const base = pInfo.value;
            const gained = base * hotspotMult * (pla.combo || 1);
            pla.score += gained;
            addCountryPoints(pla.country, gained);

            // arie ++
            const newArea = rToArea(pr) + rToArea(fr) * 0.08;
            w.rad.get(pe)!.r = Math.min(areaToR(newArea), RADIUS_CAP);

            // Floater & SFX în funcție de sursă
            if (pInfo.kind === 'super') {
              const parts = [`+${gained}`, 'SUPER'];
              if (hotspotMult > 1) parts.push('x2');
              if ((pla.combo || 1) > 1) parts.push(`x${pla.combo}`);
              addFloater(fp.x, fp.y, parts.join(' '), '#ff66ff'); // violet
              addPing(fp.x, fp.y, '#ff66ff'); // ping pe minimap
              if (settings.sound) SFX.absorb(); // reuse (poți pune alt sunet separat)
            } else {
              const parts: string[] = [`+${gained}`];
              if (hotspotMult > 1) parts.push('x2');
              if ((pla.combo || 1) > 1) parts.push(`x${pla.combo}`);
              addFloater(fp.x, fp.y, parts.join(' '), '#00e5ff'); // cyan
              if (settings.sound) SFX.pickup();
            }
            if (settings.haptics && 'vibrate' in navigator) navigator.vibrate?.(10);
          }
          removeEntity(w, other);
        }
      }

      // PLAYER vs PLAYER
      else if (w.player.has(other)) {
        if (!w.pos.has(other) || !w.rad.has(other)) continue;

        const plb = w.player.get(other)!; if (!plb.alive) continue;
        if ((pla.invuln && pla.invuln > 0) || (plb.invuln && plb.invuln > 0)) continue;

        const pb = w.pos.get(other)!; const rb = w.rad.get(other)!.r;

        const dx = pp.x - pb.x, dy = pp.y - pb.y;
        const dist2 = dx * dx + dy * dy;
        const radSum = pr + rb;

        if (dist2 > radSum * radSum) continue;

        // egal = respingere
        if (Math.abs(pr - rb) <= EPS) {
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

        // absorbție normală
        const big = pr > rb ? pe : other;
        const small = big === pe ? other : pe;

        if (!w.rad.has(big) || !w.rad.has(small)) continue;
        if (!w.player.has(big) || !w.player.has(small)) continue;

        const areaBig = rToArea(w.rad.get(big)!.r);
        const areaSmall = rToArea(w.rad.get(small)!.r);
        const newArea = areaBig + areaSmall * ABSORB_FACTOR;

        w.rad.get(big)!.r = Math.min(areaToR(newArea), RADIUS_CAP);

        const scorer = w.player.get(big)!;
        const bonusHere = inHotspot(w.pos.get(big)!.x, w.pos.get(big)!.y) ? HOTSPOT.BONUS_MULT : 1;
        const gainedPvP = 10 * bonusHere;
        scorer.score += gainedPvP;
        useGameStore.getState().addCountryPoints(scorer.country, gainedPvP);

        // floater roșu + ping roșu
        const mx = (pp.x + pb.x) / 2, my = (pp.y + pb.y) / 2;
        const tag = bonusHere > 1 ? `+${gainedPvP} x2` : `+${gainedPvP}`;
        addFloater(mx, my, tag, '#ff5252');
        addPing(mx, my, '#ff5252');

        if (settings.sound) SFX.absorb();
        if (settings.haptics && 'vibrate' in navigator) navigator.vibrate?.([12, 50]);

        removeEntity(w, small);
      }
    }
  });
}
