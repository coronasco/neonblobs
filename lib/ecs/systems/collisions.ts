import type { World } from '../types';
import { removeEntity } from '../world';
import { areaToR, rToArea } from '@/lib/math';
import { buildGrid, nearbyEntities } from '../spatial';
import { useGameStore } from '@/lib/state/useGameStore';

const ABSORB_FACTOR = 0.65;
const RADIUS_CAP = 180;
const EPS = 1e-3;

export function collisionSystem(w: World) {
  const grid = buildGrid(w, 64);
  const addCountryPoints = useGameStore.getState().addCountryPoints;

  w.player.forEach((pla, pe) => {
    if (!w.pos.has(pe) || !w.rad.has(pe) || !pla.alive) return;

    const pp = w.pos.get(pe)!;
    const pr = w.rad.get(pe)!.r;
    const candidates = nearbyEntities(grid, pp.x, pp.y);

    for (const other of candidates) {
      if (other === pe) continue;

      // particles
      if (w.particle.has(other)) {
        const fp = w.pos.get(other)!; const fr = w.rad.get(other)!.r;
        const dx = pp.x - fp.x, dy = pp.y - fp.y;
        if (dx * dx + dy * dy <= (pr + fr) * (pr + fr)) {
          const pInfo = w.particle.get(other);
          if (pInfo) {
            pla.score += pInfo.value;
            addCountryPoints(pla.country, pInfo.value); // ✅ puncte țării
            const newArea = rToArea(pr) + rToArea(fr) * 0.08;
            w.rad.get(pe)!.r = Math.min(areaToR(newArea), RADIUS_CAP);
          }
          removeEntity(w, other);
        }
      }
      // players
      else if (w.player.has(other)) {
        const plb = w.player.get(other)!; if (!plb.alive) continue;
        if ((pla.invuln && pla.invuln > 0) || (plb.invuln && plb.invuln > 0)) continue;

        const pb = w.pos.get(other)!; const rb = w.rad.get(other)!.r;
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
        scorer.score += 10;
        addCountryPoints(scorer.country, 10); // ✅ puncte țării

        removeEntity(w, small);
      }
    }
  });
}
