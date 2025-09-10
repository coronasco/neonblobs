import type { World } from '../types';
import { removeEntity } from '../world';
import { areaToR, rToArea } from '@/lib/math';
import { buildGrid, nearbyEntities } from '../spatial';
import { useGameStore } from '@/lib/state/useGameStore';
import { HOTSPOTS, HOTSPOT } from '@/lib/config';
import { SFX } from '@/lib/audio/sfx';
import { useSettings } from '@/lib/state/useSettings';
import { addFloater } from '@/lib/ui/effects';

const ABSORB_FACTOR = 0.65;
const RADIUS_CAP = 180;
const EPS = 1e-3;

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
    const hotspotBonus = inHotspot(pp.x, pp.y) ? HOTSPOT.BONUS_MULT : 1;

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
            const gained = pInfo.value * hotspotBonus;
            pla.score += gained;
            addCountryPoints(pla.country, gained);

            const newArea = rToArea(pr) + rToArea(fr) * 0.08;
            w.rad.get(pe)!.r = Math.min(areaToR(newArea), RADIUS_CAP);

            // 👇 adaugă floater “+X” (auriu dacă e x2)
            const gold = hotspotBonus > 1;
            addFloater(fp.x, fp.y, `+${gained}${gold ? ' x2' : ''}`, gold ? '#ffd700' : '#a8fffe');

            if (settings.sound) SFX.pickup();
            if (settings.haptics && 'vibrate' in navigator) navigator.vibrate?.(10);
          }
          removeEntity(w, other);
        }
      }

      // PLAYER vs PLAYER
      else if (w.player.has(other)) {
        const plb = w.player.get(other)!;
        if (!plb.alive) continue;
        if ((pla.invuln && pla.invuln > 0) || (plb.invuln && plb.invuln > 0)) continue;

        if (!w.pos.has(other) || !w.rad.has(other)) continue;
        const pb = w.pos.get(other)!;
        const rb = w.rad.get(other)!.r;

        const dx = pp.x - pb.x, dy = pp.y - pb.y;
        if (dx * dx + dy * dy > (pr + rb) * (pr + rb)) continue;
        if (Math.abs(pr - rb) <= EPS) continue;

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
        addCountryPoints(scorer.country, gainedPvP);

        // 👇 floater pe locul coliziunii
        const gold = bonusHere > 1;
        const mx = (pp.x + pb.x) / 2;
        const my = (pp.y + pb.y) / 2;
        addFloater(mx, my, `+${gainedPvP}${gold ? ' x2' : ''}`, gold ? '#ffd700' : '#ffffff');

        if (settings.sound) SFX.absorb();
        if (settings.haptics && 'vibrate' in navigator) navigator.vibrate?.([12, 50]);

        removeEntity(w, small);
      }
    }
  });
}
