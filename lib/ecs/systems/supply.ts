import type { World, Entity, SupplyDrop } from '@/lib/ecs/types';
import { MAP, SUPPLY, HOTSPOTS } from '@/lib/config';
import { addFloater, addPing } from '@/lib/ui/effects';
import { useCosmetics } from '@/lib/state/useCosmetics';

// local timer
let nextSpawn = 0;
function randBetween(a: number, b: number) { return a + Math.random() * (b - a); }
function pick<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

export function initSupplyTimer(): void {
  nextSpawn = randBetween(SUPPLY.INTERVAL_MIN, SUPPLY.INTERVAL_MAX);
}

export function supplySystem(w: World, dt: number): void {
  // countdown spawn
  nextSpawn -= dt;
  if (nextSpawn <= 0) {
    spawnSupply(w);
    nextSpawn = randBetween(SUPPLY.INTERVAL_MIN, SUPPLY.INTERVAL_MAX);
  }

  // TTL + pickup
  w.supply.forEach((sup, e) => {
    sup.ttl -= dt;
    if (sup.ttl <= 0) {
      despawnSupply(w, e);
      return;
    }

    // pickup by nearest player
    for (const [pe, pl] of w.player) {
      if (!pl.alive) continue;
      const pp = w.pos.get(pe); const pr = w.rad.get(pe);
      const sp = w.pos.get(e); const sr = w.rad.get(e);
      if (!pp || !pr || !sp || !sr) continue;
      const dx = pp.x - sp.x, dy = pp.y - sp.y;
      const rr = pr.r + sr.r + 6;
      if (dx*dx + dy*dy <= rr*rr) {
        // reward
        if (sup.loot === 'shards') {
          const amt = sup.amount ?? 3;
          useCosmetics.getState().addShards(amt);
          addFloater(sp.x, sp.y, `+${amt} SHARDS`, '#9ae6ff');
        } else if (sup.loot === 'magnet') {
          pl.magnetT = Math.max(0, (pl.magnetT || 0)) + 6;
          addFloater(sp.x, sp.y, 'MAGNET!', '#00e5ff');
        } else {
          pl.shieldT = Math.max(0, (pl.shieldT || 0)) + 3;
          addFloater(sp.x, sp.y, 'SHIELD!', '#ffe066');
        }
        addPing(sp.x, sp.y, '#a78bfa');
        despawnSupply(w, e);
        break;
      }
    }
  });
}

function spawnSupply(w: World): void {
  // pick near a random hotspot (more action)
  const h = pick(HOTSPOTS);
  const angle = Math.random() * Math.PI * 2;
  const dist = Math.random() * (h.r * 0.7);
  const x = Math.max(20, Math.min(MAP.WIDTH - 20, h.x + Math.cos(angle) * dist));
  const y = Math.max(20, Math.min(MAP.HEIGHT - 20, h.y + Math.sin(angle) * dist));

  const e: Entity = w.nextId++;
  w.pos.set(e, { x, y });
  w.vel.set(e, { x: 0, y: 0 });
  w.rad.set(e, { r: SUPPLY.R });
  w.col.set(e, { a: 0.65, b: 0.4, g: 1 }); // lavender-ish
  const lootRand = Math.random();
  const loot: SupplyDrop['loot'] =
    lootRand < SUPPLY.POWERUP_CHANCE ? (Math.random() < 0.5 ? 'magnet' : 'shield') : 'shards';
  const amount = loot === 'shards' ? Math.floor(randBetween(SUPPLY.SHARDS_MIN, SUPPLY.SHARDS_MAX)) : undefined;
  w.supply.set(e, { ttl: SUPPLY.TTL, loot, amount });

  addPing(x, y, '#a78bfa'); // purple ping when it lands
  addFloater(x, y, 'SUPPLY DROP', '#c4b5fd');
}

function despawnSupply(w: World, e: Entity): void {
  w.supply.delete(e);
  w.pos.delete(e);
  w.vel.delete(e);
  w.rad.delete(e);
  w.col.delete(e);
}
